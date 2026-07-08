// Spotly persistent store — SQLite via better-sqlite3.
//
// Schema is intentionally Postgres-compatible (TEXT, REAL, INTEGER).
// Swap the adapter in this file when moving to production Postgres;
// all query logic above stays the same.
//
// Install: npm install better-sqlite3
//          (ships prebuilt binaries for macOS/Linux Node 18+)

const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../spotly.db')
const db = new Database(DB_PATH)

// WAL mode: concurrent reads while writes are in progress.
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

db.exec(`
  -- Every order that has ever existed on the bus.
  -- The MQTT bridge writes through on every status event so this is always fresh.
  CREATE TABLE IF NOT EXISTS orders (
    ref            TEXT PRIMARY KEY,
    merchant_id    TEXT NOT NULL DEFAULT '',
    merchant_name  TEXT         DEFAULT '',
    customer_name  TEXT         DEFAULT '',
    customer_phone TEXT         DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'placed',
    items          TEXT         DEFAULT '[]',
    subtotal       REAL         DEFAULT 0,
    delivery_fee   REAL         DEFAULT 0,
    total          REAL         DEFAULT 0,
    placed_at      INTEGER      DEFAULT 0,
    address        TEXT         DEFAULT '',
    address_note   TEXT         DEFAULT '',
    pickup_lat     REAL,
    pickup_lng     REAL,
    dropoff_lat    REAL,
    dropoff_lng    REAL,
    driver_id      TEXT         DEFAULT '',
    driver_name    TEXT         DEFAULT '',
    prep_minutes   INTEGER      DEFAULT 20,
    updated_at     INTEGER      DEFAULT 0
  );

  -- Immutable audit trail — every status transition is appended, never updated.
  CREATE TABLE IF NOT EXISTS order_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ref         TEXT    NOT NULL,
    status      TEXT    NOT NULL,
    driver_id   TEXT,
    driver_name TEXT,
    ts          INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);
  CREATE INDEX IF NOT EXISTS idx_orders_driver   ON orders(driver_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_events_ref      ON order_events(ref);
  CREATE INDEX IF NOT EXISTS idx_events_ts       ON order_events(ts);

  -- Latest menu per merchant (whole payload as JSON; mirrors the retained MQTT message).
  CREATE TABLE IF NOT EXISTS menus (
    merchant_id TEXT PRIMARY KEY,
    items       TEXT NOT NULL DEFAULT '[]',
    updated_at  INTEGER       DEFAULT 0
  );

  -- Issued event tickets — retained state mirrors tickets/{code}.
  CREATE TABLE IF NOT EXISTS tickets (
    code        TEXT PRIMARY KEY,
    event_name  TEXT    DEFAULT '',
    tier_name   TEXT    DEFAULT '',
    quantity    INTEGER DEFAULT 1,
    holder      TEXT    DEFAULT '',
    status      TEXT    DEFAULT 'valid',
    issued_at   INTEGER DEFAULT 0,
    redeemed_at INTEGER
  );
`)

// ── Prepared statements ──────────────────────────────────────────────────────

// Full-order upsert (from merchants/{id}/orders/{ref} retained payload).
// Overwrites every column; called when we have the complete Order object.
const upsertFullOrder = db.prepare(`
  INSERT INTO orders (
    ref, merchant_id, merchant_name, customer_name, customer_phone,
    status, items, subtotal, delivery_fee, total,
    placed_at, address, address_note,
    pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
    driver_id, driver_name, prep_minutes, updated_at
  ) VALUES (
    @ref, @merchant_id, @merchant_name, @customer_name, @customer_phone,
    @status, @items, @subtotal, @delivery_fee, @total,
    @placed_at, @address, @address_note,
    @pickup_lat, @pickup_lng, @dropoff_lat, @dropoff_lng,
    @driver_id, @driver_name, @prep_minutes, @updated_at
  )
  ON CONFLICT(ref) DO UPDATE SET
    merchant_id    = CASE WHEN excluded.merchant_id    != '' THEN excluded.merchant_id    ELSE merchant_id    END,
    merchant_name  = CASE WHEN excluded.merchant_name  != '' THEN excluded.merchant_name  ELSE merchant_name  END,
    customer_name  = CASE WHEN excluded.customer_name  != '' THEN excluded.customer_name  ELSE customer_name  END,
    customer_phone = CASE WHEN excluded.customer_phone != '' THEN excluded.customer_phone ELSE customer_phone END,
    status         = excluded.status,
    items          = CASE WHEN excluded.items != '[]'  THEN excluded.items         ELSE items          END,
    subtotal       = CASE WHEN excluded.subtotal  > 0  THEN excluded.subtotal      ELSE subtotal       END,
    delivery_fee   = CASE WHEN excluded.delivery_fee > 0 THEN excluded.delivery_fee ELSE delivery_fee  END,
    total          = CASE WHEN excluded.total     > 0  THEN excluded.total         ELSE total          END,
    placed_at      = CASE WHEN excluded.placed_at > 0  THEN excluded.placed_at     ELSE placed_at      END,
    address        = CASE WHEN excluded.address   != '' THEN excluded.address       ELSE address        END,
    address_note   = CASE WHEN excluded.address_note != '' THEN excluded.address_note ELSE address_note END,
    pickup_lat     = COALESCE(excluded.pickup_lat,  pickup_lat),
    pickup_lng     = COALESCE(excluded.pickup_lng,  pickup_lng),
    dropoff_lat    = COALESCE(excluded.dropoff_lat, dropoff_lat),
    dropoff_lng    = COALESCE(excluded.dropoff_lng, dropoff_lng),
    driver_id      = CASE WHEN excluded.driver_id   != '' THEN excluded.driver_id   ELSE driver_id   END,
    driver_name    = CASE WHEN excluded.driver_name != '' THEN excluded.driver_name ELSE driver_name END,
    prep_minutes   = CASE WHEN excluded.prep_minutes != 20 THEN excluded.prep_minutes ELSE prep_minutes END,
    updated_at     = excluded.updated_at
`)

// Status-only upsert (from orders/{ref}/status).
// Creates a minimal stub row if the ref is new; otherwise updates just status + driver.
const upsertOrderStatus = db.prepare(`
  INSERT INTO orders (ref, status, driver_id, driver_name, updated_at)
  VALUES (@ref, @status, @driver_id, @driver_name, @updated_at)
  ON CONFLICT(ref) DO UPDATE SET
    status      = excluded.status,
    driver_id   = CASE WHEN excluded.driver_id   != '' THEN excluded.driver_id   ELSE driver_id   END,
    driver_name = CASE WHEN excluded.driver_name != '' THEN excluded.driver_name ELSE driver_name END,
    updated_at  = excluded.updated_at
`)

const insertEvent = db.prepare(`
  INSERT INTO order_events (ref, status, driver_id, driver_name, ts)
  VALUES (@ref, @status, @driver_id, @driver_name, @ts)
`)

const getOrder         = db.prepare('SELECT * FROM orders WHERE ref = ?')
const getByMerchant    = db.prepare('SELECT * FROM orders WHERE merchant_id = ? ORDER BY placed_at DESC LIMIT 500')
const getByDriver      = db.prepare('SELECT * FROM orders WHERE driver_id = ? ORDER BY updated_at DESC LIMIT 500')
const getEventsByRef   = db.prepare('SELECT * FROM order_events WHERE ref = ? ORDER BY ts ASC')
const countOrders      = db.prepare('SELECT COUNT(*) AS n FROM orders')
const countEvents      = db.prepare('SELECT COUNT(*) AS n FROM order_events')

const upsertMenu       = db.prepare(`
  INSERT INTO menus (merchant_id, items, updated_at) VALUES (@merchant_id, @items, @updated_at)
  ON CONFLICT(merchant_id) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at
`)
const getMenu          = db.prepare('SELECT * FROM menus WHERE merchant_id = ?')
const countMenus       = db.prepare('SELECT COUNT(*) AS n FROM menus')

const upsertTicket     = db.prepare(`
  INSERT INTO tickets (code, event_name, tier_name, quantity, holder, status, issued_at, redeemed_at)
  VALUES (@code, @event_name, @tier_name, @quantity, @holder, @status, @issued_at, @redeemed_at)
  ON CONFLICT(code) DO UPDATE SET
    status      = excluded.status,
    redeemed_at = COALESCE(excluded.redeemed_at, redeemed_at)
`)
const getTicket        = db.prepare('SELECT * FROM tickets WHERE code = ?')
const getTicketsByEvent= db.prepare('SELECT * FROM tickets WHERE event_name = ? ORDER BY issued_at DESC')
const getAllTickets     = db.prepare('SELECT * FROM tickets ORDER BY issued_at DESC LIMIT 500')
const countTickets     = db.prepare('SELECT COUNT(*) AS n FROM tickets')

// ── Auth tables ──────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    phone       TEXT UNIQUE NOT NULL,
    name        TEXT DEFAULT '',
    role        TEXT DEFAULT 'customer',
    status      TEXT DEFAULT 'active',
    created_at  INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

  CREATE TABLE IF NOT EXISTS otp_requests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    phone       TEXT NOT NULL,
    code        TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    used        INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_requests(phone);

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  INTEGER NOT NULL,
    created_at  INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id           TEXT PRIMARY KEY,
    order_ref    TEXT NOT NULL,
    amount       REAL NOT NULL,
    currency     TEXT DEFAULT 'USD',
    method       TEXT DEFAULT 'ecocash',
    status       TEXT DEFAULT 'pending',
    provider_ref TEXT,
    phone        TEXT,
    created_at   INTEGER DEFAULT 0,
    updated_at   INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_payments_order  ON payments(order_ref);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

  CREATE TABLE IF NOT EXISTS payouts (
    id           TEXT PRIMARY KEY,
    driver_id    TEXT NOT NULL,
    amount       REAL NOT NULL,
    method       TEXT DEFAULT 'ecocash',
    account      TEXT DEFAULT '',
    status       TEXT DEFAULT 'pending',
    note         TEXT DEFAULT '',
    requested_at INTEGER DEFAULT 0,
    paid_at      INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_payouts_driver ON payouts(driver_id);
  CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
`)

const insertUser     = db.prepare('INSERT OR IGNORE INTO users (id,phone,name,role,status,created_at) VALUES (@id,@phone,@name,@role,@status,@created_at)')
const getUserByPhone = db.prepare('SELECT * FROM users WHERE phone = ?')
const getUserById    = db.prepare('SELECT * FROM users WHERE id = ?')
const updateUser     = db.prepare('UPDATE users SET name = @name, status = @status WHERE id = @id')

const createOtp    = db.prepare('INSERT INTO otp_requests (phone,code,expires_at) VALUES (@phone,@code,@expires_at)')
const expireOtps   = db.prepare('UPDATE otp_requests SET used = 1 WHERE phone = ? AND used = 0')
const getLatestOtp = db.prepare('SELECT * FROM otp_requests WHERE phone = ? AND used = 0 ORDER BY id DESC LIMIT 1')
const markOtpUsed  = db.prepare('UPDATE otp_requests SET used = 1 WHERE id = ?')

const createSession        = db.prepare('INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at) VALUES (@id,@user_id,@token_hash,@expires_at,@created_at)')
const getSession           = db.prepare('SELECT * FROM sessions WHERE token_hash = ?')
const deleteSession        = db.prepare('DELETE FROM sessions WHERE token_hash = ?')
const pruneExpiredSessions = db.prepare('DELETE FROM sessions WHERE expires_at < ?')

const insertPayment        = db.prepare('INSERT INTO payments (id,order_ref,amount,currency,method,status,provider_ref,phone,created_at,updated_at) VALUES (@id,@order_ref,@amount,@currency,@method,@status,@provider_ref,@phone,@created_at,@updated_at)')
const getPaymentById       = db.prepare('SELECT * FROM payments WHERE id = ?')
const getPaymentByOrderRef = db.prepare('SELECT * FROM payments WHERE order_ref = ?')
const updatePaymentStatus  = db.prepare('UPDATE payments SET status = @status, provider_ref = COALESCE(@provider_ref, provider_ref), updated_at = @updated_at WHERE id = @id')
const getPaymentsByStatus  = db.prepare('SELECT * FROM payments WHERE status = ? ORDER BY created_at DESC LIMIT 200')
const countPayments        = db.prepare('SELECT COUNT(*) AS n FROM payments')

const insertPayout         = db.prepare('INSERT INTO payouts (id,driver_id,amount,method,account,status,note,requested_at,paid_at) VALUES (@id,@driver_id,@amount,@method,@account,@status,@note,@requested_at,@paid_at)')
const getPayoutsByDriver   = db.prepare('SELECT * FROM payouts WHERE driver_id = ? ORDER BY requested_at DESC LIMIT 200')
const updatePayoutStatus   = db.prepare('UPDATE payouts SET status = @status, paid_at = @paid_at WHERE id = @id')
const countPayouts         = db.prepare('SELECT COUNT(*) AS n FROM payouts')

// ── Conversion helpers ───────────────────────────────────────────────────────

function rowToOrder(row) {
  if (!row) return null
  return {
    ref:           row.ref,
    merchantId:    row.merchant_id,
    merchantName:  row.merchant_name,
    customerName:  row.customer_name,
    customerPhone: row.customer_phone,
    status:        row.status,
    items:         JSON.parse(row.items || '[]'),
    subtotal:      row.subtotal,
    deliveryFee:   row.delivery_fee,
    total:         row.total,
    placedAt:      row.placed_at,
    address:       row.address,
    addressNote:   row.address_note || undefined,
    pickupCoord:   row.pickup_lat != null ? { lat: row.pickup_lat, lng: row.pickup_lng } : undefined,
    dropoffCoord:  row.dropoff_lat != null ? { lat: row.dropoff_lat, lng: row.dropoff_lng } : undefined,
    driverId:      row.driver_id || undefined,
    driverName:    row.driver_name || undefined,
    prepMinutes:   row.prep_minutes,
  }
}

function orderToRow(o, now) {
  return {
    ref:           o.ref            || '',
    merchant_id:   o.merchantId     || '',
    merchant_name: o.merchantName   || '',
    customer_name: o.customerName   || '',
    customer_phone:o.customerPhone  || '',
    status:        o.status         || 'placed',
    items:         JSON.stringify(o.items || []),
    subtotal:      o.subtotal       || 0,
    delivery_fee:  o.deliveryFee    || 0,
    total:         o.total          || 0,
    placed_at:     o.placedAt       || now,
    address:       o.address        || '',
    address_note:  o.addressNote    || '',
    pickup_lat:    o.pickupCoord?.lat  ?? null,
    pickup_lng:    o.pickupCoord?.lng  ?? null,
    dropoff_lat:   o.dropoffCoord?.lat ?? null,
    dropoff_lng:   o.dropoffCoord?.lng ?? null,
    driver_id:     o.driverId       || '',
    driver_name:   o.driverName     || '',
    prep_minutes:  o.prepMinutes    ?? 20,
    updated_at:    now,
  }
}

module.exports = {
  db, DB_PATH,
  upsertFullOrder, upsertOrderStatus, insertEvent,
  getOrder, getByMerchant, getByDriver, getEventsByRef,
  countOrders, countEvents,
  upsertMenu, getMenu, countMenus,
  upsertTicket, getTicket, getTicketsByEvent, getAllTickets, countTickets,
  rowToOrder, orderToRow,
  // auth
  insertUser, getUserByPhone, getUserById, updateUser,
  createOtp, expireOtps, getLatestOtp, markOtpUsed,
  createSession, getSession, deleteSession, pruneExpiredSessions,
  // payments
  insertPayment, getPaymentById, getPaymentByOrderRef, updatePaymentStatus, getPaymentsByStatus, countPayments,
  // payouts
  insertPayout, getPayoutsByDriver, updatePayoutStatus, countPayouts,
}
