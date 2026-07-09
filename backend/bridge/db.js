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

  -- Customer table/event/experience bookings.
  CREATE TABLE IF NOT EXISTS bookings (
    id                TEXT    PRIMARY KEY,
    user_id           TEXT    NOT NULL,
    listing_id        INTEGER NOT NULL DEFAULT 0,
    listing_name      TEXT    DEFAULT '',
    listing_image     TEXT    DEFAULT '',
    date              TEXT    DEFAULT '',
    time              TEXT    DEFAULT '',
    party_size        INTEGER DEFAULT 1,
    confirmation_code TEXT    DEFAULT '',
    points            INTEGER DEFAULT 0,
    status            TEXT    DEFAULT 'confirmed',
    type              TEXT    DEFAULT '',
    can_review        INTEGER DEFAULT 0,
    created_at        INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_user   ON bookings(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

  -- Customer saved/favourite listings.
  CREATE TABLE IF NOT EXISTS favorites (
    user_id    TEXT    NOT NULL,
    listing_id INTEGER NOT NULL,
    created_at INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, listing_id)
  );
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

  -- Per-merchant settings (open/closed state etc.).
  CREATE TABLE IF NOT EXISTS merchant_settings (
    user_id    TEXT    PRIMARY KEY,
    is_open    INTEGER DEFAULT 1,
    updated_at INTEGER DEFAULT 0
  );

  -- In-app notifications per user.
  CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT    PRIMARY KEY,
    user_id    TEXT    NOT NULL,
    type       TEXT    DEFAULT 'system',
    title      TEXT    DEFAULT '',
    body       TEXT    DEFAULT '',
    read       INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);

  -- User-submitted listing reviews.
  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    user_id    TEXT    NOT NULL,
    user_name  TEXT    DEFAULT '',
    rating     INTEGER NOT NULL DEFAULT 5,
    text       TEXT    DEFAULT '',
    verified   INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews(user_id);

  -- Tickets purchased by customers (separate from the ticket validation table).
  CREATE TABLE IF NOT EXISTS purchased_tickets (
    id                TEXT    PRIMARY KEY,
    user_id           TEXT    NOT NULL,
    event_id          INTEGER DEFAULT 0,
    event_name        TEXT    DEFAULT '',
    event_image       TEXT    DEFAULT '',
    event_date        TEXT    DEFAULT '',
    event_time        TEXT    DEFAULT '',
    venue             TEXT    DEFAULT '',
    tier_name         TEXT    DEFAULT '',
    tier_color        TEXT    DEFAULT '',
    quantity          INTEGER DEFAULT 1,
    total_price       REAL    DEFAULT 0,
    confirmation_code TEXT    DEFAULT '',
    email             TEXT    DEFAULT '',
    purchased_at      TEXT    DEFAULT '',
    status            TEXT    DEFAULT 'upcoming'
  );
  CREATE INDEX IF NOT EXISTS idx_pt_user ON purchased_tickets(user_id);

  -- Promo/offer catalog — seeded on startup, admin-editable later.
  CREATE TABLE IF NOT EXISTS offers (
    id            TEXT PRIMARY KEY,
    code          TEXT NOT NULL UNIQUE,
    title         TEXT DEFAULT '',
    blurb         TEXT DEFAULT '',
    detail        TEXT DEFAULT '',
    category      TEXT DEFAULT 'all',
    discount_type TEXT DEFAULT 'percent',
    amount        REAL DEFAULT 0,
    min_spend     REAL DEFAULT 0,
    expires       TEXT DEFAULT '',
    colors        TEXT DEFAULT '[]',
    icon          TEXT DEFAULT '',
    active        INTEGER DEFAULT 1
  );

  -- ── WhatsApp support: one row per customer thread ──────────────────────────
  -- last_customer_msg_at is the anchor for Meta's rolling 24-hour session window;
  -- last_message_at (any direction) drives the sidebar's "most recent" ordering.
  CREATE TABLE IF NOT EXISTS conversations (
    id                   TEXT PRIMARY KEY,
    phone                TEXT NOT NULL UNIQUE,   -- customer WhatsApp number, E.164
    name                 TEXT    DEFAULT '',
    status               TEXT    DEFAULT 'open', -- open | pending | closed
    assigned_agent_id    TEXT    DEFAULT '',
    last_message_at      INTEGER DEFAULT 0,
    last_message_preview TEXT    DEFAULT '',
    last_customer_msg_at INTEGER DEFAULT 0,      -- anchors the 24h template rule
    unread               INTEGER DEFAULT 0,
    created_at           INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_convos_status ON conversations(status);
  CREATE INDEX IF NOT EXISTS idx_convos_recent ON conversations(last_message_at);

  -- ── WhatsApp support: append-only message log ──────────────────────────────
  CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    direction       TEXT    DEFAULT 'inbound',  -- inbound (customer) | outbound (agent)
    sender          TEXT    DEFAULT 'customer', -- 'customer' | agent id | 'system'
    body            TEXT    DEFAULT '',
    media_url       TEXT    DEFAULT '',
    status          TEXT    DEFAULT 'received',  -- received | queued | sent | delivered | read | failed
    provider_sid    TEXT    DEFAULT '',          -- Twilio Message SID for status callbacks
    created_at      INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_messages_convo ON messages(conversation_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_messages_sid   ON messages(provider_sid);

  -- ── Admin/ops: customer & merchant disputes ────────────────────────────────
  CREATE TABLE IF NOT EXISTS disputes (
    id           TEXT PRIMARY KEY,
    order_ref    TEXT    DEFAULT '',
    raised_by    TEXT    DEFAULT '',      -- user id who opened it
    against      TEXT    DEFAULT '',      -- 'merchant' | 'driver' | 'customer'
    reason       TEXT    DEFAULT '',
    detail       TEXT    DEFAULT '',
    status       TEXT    DEFAULT 'open',  -- open | investigating | resolved | rejected
    resolution   TEXT    DEFAULT '',
    resolved_by  TEXT    DEFAULT '',      -- admin id
    created_at   INTEGER DEFAULT 0,
    resolved_at  INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
  CREATE INDEX IF NOT EXISTS idx_disputes_order  ON disputes(order_ref);

  -- ── Admin/ops: immutable audit trail of privileged actions ─────────────────
  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id   TEXT    DEFAULT '',
    actor_name TEXT    DEFAULT '',
    action     TEXT    NOT NULL,          -- e.g. 'user.suspend', 'order.refund'
    target     TEXT    DEFAULT '',        -- affected entity id
    detail     TEXT    DEFAULT '',        -- JSON context
    ip         TEXT    DEFAULT '',
    created_at INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_audit_actor  ON audit_log(actor_id);
  CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
  CREATE INDEX IF NOT EXISTS idx_audit_ts     ON audit_log(created_at);
`)

// ── Additive column migrations ─────────────────────────────────────────────────
// SQLite can't add columns via CREATE TABLE IF NOT EXISTS, so add-if-missing here.
// Safe to run on every boot: each column is checked against the live schema.
// NB: called AFTER each target table's CREATE (see users compliance block below).
function addColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`)
  }
}

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

const getOrder            = db.prepare('SELECT * FROM orders WHERE ref = ?')
const getByMerchant       = db.prepare('SELECT * FROM orders WHERE merchant_id = ? ORDER BY placed_at DESC LIMIT 500')
const getByDriver         = db.prepare('SELECT * FROM orders WHERE driver_id = ? ORDER BY updated_at DESC LIMIT 500')
const getByCustomerPhone  = db.prepare('SELECT * FROM orders WHERE customer_phone = ? ORDER BY placed_at DESC LIMIT 200')
const getEventsByRef      = db.prepare('SELECT * FROM order_events WHERE ref = ? ORDER BY ts ASC')
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

// Compliance fields on users (age/ID gate for events + alcohol; driver vetting).
// Runs after the users table exists above.
addColumn('users', 'dob',              "TEXT DEFAULT ''")           // ISO date
addColumn('users', 'age_verified',     'INTEGER DEFAULT 0')         // 18+ confirmed
addColumn('users', 'id_status',        "TEXT DEFAULT 'unverified'") // unverified|pending|verified|rejected
addColumn('users', 'background_check', "TEXT DEFAULT 'none'")       // drivers: none|pending|clear|flagged
addColumn('users', 'suspended_reason', "TEXT DEFAULT ''")
addColumn('users', 'suspended_at',     'INTEGER DEFAULT 0')

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

db.exec(`
  CREATE TABLE IF NOT EXISTS push_tokens (
    user_id    TEXT NOT NULL,
    token      TEXT NOT NULL,
    platform   TEXT DEFAULT 'expo',
    updated_at INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, token)
  );
  CREATE INDEX IF NOT EXISTS idx_push_user ON push_tokens(user_id);
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS listings (
    id            INTEGER PRIMARY KEY,
    category      TEXT    NOT NULL DEFAULT 'food',
    type          TEXT    DEFAULT 'restaurant',
    name          TEXT    NOT NULL,
    cuisine       TEXT    DEFAULT '',
    rating        REAL    DEFAULT 4.5,
    review_count  INTEGER DEFAULT 0,
    price_level   TEXT    DEFAULT '$$',
    distance      TEXT    DEFAULT '',
    address       TEXT    DEFAULT '',
    description   TEXT    DEFAULT '',
    image         TEXT    DEFAULT '',
    images        TEXT    DEFAULT '[]',
    tags          TEXT    DEFAULT '[]',
    features      TEXT    DEFAULT '[]',
    hours         TEXT    DEFAULT '',
    time_slots    TEXT    DEFAULT '[]',
    ticket_tiers  TEXT    DEFAULT '[]',
    event_date    TEXT,
    event_time    TEXT,
    points_earned INTEGER DEFAULT 50,
    eta           TEXT    DEFAULT '',
    popular       INTEGER DEFAULT 0,
    price         REAL,
    menu          TEXT    DEFAULT '[]',
    merchant_id   TEXT    DEFAULT '',
    active        INTEGER DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
  CREATE INDEX IF NOT EXISTS idx_listings_popular  ON listings(popular);
`)

// push token prepared statements

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

const upsertPushToken  = db.prepare(`INSERT INTO push_tokens (user_id, token, platform, updated_at) VALUES (@user_id, @token, @platform, @updated_at) ON CONFLICT(user_id, token) DO UPDATE SET updated_at = excluded.updated_at`)
const getPushTokens    = db.prepare('SELECT token FROM push_tokens WHERE user_id = ?')
const deletePushToken  = db.prepare('DELETE FROM push_tokens WHERE user_id = ? AND token = ?')

const getListing          = db.prepare('SELECT * FROM listings WHERE id = ? AND active = 1')
const listListings        = db.prepare('SELECT * FROM listings WHERE active = 1 ORDER BY popular DESC, rating DESC')

// Bookings
const insertBooking       = db.prepare(`
  INSERT INTO bookings (id, user_id, listing_id, listing_name, listing_image, date, time,
    party_size, confirmation_code, points, status, type, can_review, created_at)
  VALUES (@id, @user_id, @listing_id, @listing_name, @listing_image, @date, @time,
    @party_size, @confirmation_code, @points, @status, @type, @can_review, @created_at)
`)
const getBookingsByUser   = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC')
const getBookingById      = db.prepare('SELECT * FROM bookings WHERE id = ?')
const updateBookingStatus = db.prepare('UPDATE bookings SET status = ? WHERE id = ? AND user_id = ?')
const patchBooking        = db.prepare('UPDATE bookings SET date = @date, time = @time, party_size = @party_size WHERE id = @id AND user_id = @user_id')

// Favorites
const insertFavorite      = db.prepare('INSERT OR IGNORE INTO favorites (user_id, listing_id, created_at) VALUES (?, ?, ?)')
const deleteFavorite      = db.prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?')
const getFavoritesByUser  = db.prepare('SELECT listing_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC')

// Notifications
const insertNotification   = db.prepare(`
  INSERT INTO notifications (id, user_id, type, title, body, read, created_at)
  VALUES (@id, @user_id, @type, @title, @body, 0, @created_at)
`)
const getNotifsByUser      = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
const markNotifRead        = db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
const markAllNotifsRead    = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?')
const deleteUserNotifs     = db.prepare('DELETE FROM notifications WHERE user_id = ?')

// Merchant settings
const upsertMerchantSettings = db.prepare(`
  INSERT INTO merchant_settings (user_id, is_open, updated_at)
  VALUES (@user_id, @is_open, @updated_at)
  ON CONFLICT(user_id) DO UPDATE SET is_open = excluded.is_open, updated_at = excluded.updated_at
`)
const getMerchantSettings    = db.prepare('SELECT * FROM merchant_settings WHERE user_id = ?')

// Offers
const insertOffer          = db.prepare(`
  INSERT OR IGNORE INTO offers (id, code, title, blurb, detail, category, discount_type, amount, min_spend, expires, colors, icon, active)
  VALUES (@id, @code, @title, @blurb, @detail, @category, @discount_type, @amount, @min_spend, @expires, @colors, @icon, 1)
`)
const getAllOffers          = db.prepare('SELECT * FROM offers WHERE active = 1')

// Reviews
const insertReview        = db.prepare(`
  INSERT INTO reviews (listing_id, user_id, user_name, rating, text, verified, created_at)
  VALUES (@listing_id, @user_id, @user_name, @rating, @text, 1, @created_at)
`)
const getReviewsByListing = db.prepare('SELECT * FROM reviews WHERE listing_id = ? ORDER BY created_at DESC')
const getAllReviews        = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500')

// Purchased tickets
const insertPurchasedTicket  = db.prepare(`
  INSERT OR IGNORE INTO purchased_tickets
    (id, user_id, event_id, event_name, event_image, event_date, event_time,
     venue, tier_name, tier_color, quantity, total_price, confirmation_code, email, purchased_at, status)
  VALUES
    (@id, @user_id, @event_id, @event_name, @event_image, @event_date, @event_time,
     @venue, @tier_name, @tier_color, @quantity, @total_price, @confirmation_code, @email, @purchased_at, @status)
`)
const getPurchasedTicketsByUser = db.prepare('SELECT * FROM purchased_tickets WHERE user_id = ? ORDER BY rowid DESC')

// ── WhatsApp support conversations ────────────────────────────────────────────
const insertConversation = db.prepare(`
  INSERT INTO conversations (id, phone, name, status, assigned_agent_id,
    last_message_at, last_message_preview, last_customer_msg_at, unread, created_at)
  VALUES (@id, @phone, @name, @status, @assigned_agent_id,
    @last_message_at, @last_message_preview, @last_customer_msg_at, @unread, @created_at)
`)
const getConversationByPhone = db.prepare('SELECT * FROM conversations WHERE phone = ?')
const getConversationById     = db.prepare('SELECT * FROM conversations WHERE id = ?')
const listConversations       = db.prepare('SELECT * FROM conversations ORDER BY last_message_at DESC LIMIT 500')

// Touch on any new message. `is_customer` (1/0) decides whether we also bump the
// 24h-window anchor and the unread counter.
const touchConversation = db.prepare(`
  UPDATE conversations SET
    name                 = CASE WHEN @name != '' THEN @name ELSE name END,
    last_message_at      = @ts,
    last_message_preview = @preview,
    last_customer_msg_at = CASE WHEN @is_customer = 1 THEN @ts ELSE last_customer_msg_at END,
    unread               = CASE WHEN @is_customer = 1 THEN unread + 1 ELSE unread END,
    status               = CASE WHEN @is_customer = 1 AND status = 'closed' THEN 'open' ELSE status END
  WHERE id = @id
`)
const setConversationStatus = db.prepare('UPDATE conversations SET status = @status WHERE id = @id')
const assignConversation    = db.prepare('UPDATE conversations SET assigned_agent_id = @agent_id WHERE id = @id')
const clearConversationUnread = db.prepare('UPDATE conversations SET unread = 0 WHERE id = ?')

// ── WhatsApp support messages ─────────────────────────────────────────────────
const insertMessage = db.prepare(`
  INSERT INTO messages (id, conversation_id, direction, sender, body, media_url, status, provider_sid, created_at)
  VALUES (@id, @conversation_id, @direction, @sender, @body, @media_url, @status, @provider_sid, @created_at)
`)
const getMessagesByConversation = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 500')
const updateMessageStatusBySid  = db.prepare('UPDATE messages SET status = @status WHERE provider_sid = @provider_sid')

// ── Admin: users management ───────────────────────────────────────────────────
const listUsers        = db.prepare(`SELECT id, phone, name, role, status, id_status, background_check,
  age_verified, suspended_reason, created_at FROM users ORDER BY created_at DESC LIMIT 1000`)
const searchUsers      = db.prepare(`SELECT id, phone, name, role, status, id_status, background_check,
  age_verified, suspended_reason, created_at FROM users
  WHERE phone LIKE @q OR name LIKE @q OR id = @exact ORDER BY created_at DESC LIMIT 200`)
const setUserStatus    = db.prepare('UPDATE users SET status = @status, suspended_reason = @reason, suspended_at = @at WHERE id = @id')
const setUserRole      = db.prepare('UPDATE users SET role = @role WHERE id = @id')
const setUserCompliance= db.prepare('UPDATE users SET id_status = @id_status, age_verified = @age_verified, background_check = @background_check WHERE id = @id')
const setUserAge       = db.prepare('UPDATE users SET dob = @dob, age_verified = @age_verified WHERE id = @id')
const countUsers       = db.prepare('SELECT COUNT(*) AS n FROM users')
const countUsersByRole = db.prepare("SELECT role, COUNT(*) AS n FROM users GROUP BY role")

// ── Admin: disputes ───────────────────────────────────────────────────────────
const insertDispute    = db.prepare(`INSERT INTO disputes
  (id, order_ref, raised_by, against, reason, detail, status, resolution, resolved_by, created_at, resolved_at)
  VALUES (@id, @order_ref, @raised_by, @against, @reason, @detail, @status, '', '', @created_at, 0)`)
const listDisputes     = db.prepare('SELECT * FROM disputes ORDER BY created_at DESC LIMIT 500')
const listDisputesByStatus = db.prepare('SELECT * FROM disputes WHERE status = ? ORDER BY created_at DESC LIMIT 500')
const getDispute       = db.prepare('SELECT * FROM disputes WHERE id = ?')
const resolveDispute   = db.prepare('UPDATE disputes SET status = @status, resolution = @resolution, resolved_by = @resolved_by, resolved_at = @resolved_at WHERE id = @id')
const countOpenDisputes= db.prepare("SELECT COUNT(*) AS n FROM disputes WHERE status IN ('open','investigating')")

// ── Admin: audit log ──────────────────────────────────────────────────────────
const insertAudit      = db.prepare(`INSERT INTO audit_log (actor_id, actor_name, action, target, detail, ip, created_at)
  VALUES (@actor_id, @actor_name, @action, @target, @detail, @ip, @created_at)`)
const listAudit        = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 500')

// ── Admin: live order monitor ─────────────────────────────────────────────────
const listRecentOrders = db.prepare('SELECT * FROM orders ORDER BY placed_at DESC LIMIT 200')
const listActiveOrders = db.prepare(`SELECT * FROM orders
  WHERE status NOT IN ('delivered','done','declined','cancelled') ORDER BY placed_at DESC LIMIT 200`)

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
  getOrder, getByMerchant, getByDriver, getByCustomerPhone, getEventsByRef,
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
  // push tokens
  upsertPushToken, getPushTokens, deletePushToken,
  // listings catalog
  getListing, listListings,
  // bookings
  insertBooking, getBookingsByUser, getBookingById, updateBookingStatus, patchBooking,
  // favorites
  insertFavorite, deleteFavorite, getFavoritesByUser,
  // merchant settings
  upsertMerchantSettings, getMerchantSettings,
  // notifications
  insertNotification, getNotifsByUser, markNotifRead, markAllNotifsRead, deleteUserNotifs,
  // offers
  insertOffer, getAllOffers,
  // reviews
  insertReview, getReviewsByListing, getAllReviews,
  // purchased tickets
  insertPurchasedTicket, getPurchasedTicketsByUser,
  // whatsapp support — conversations
  insertConversation, getConversationByPhone, getConversationById, listConversations,
  touchConversation, setConversationStatus, assignConversation, clearConversationUnread,
  // whatsapp support — messages
  insertMessage, getMessagesByConversation, updateMessageStatusBySid,
  // admin — users
  listUsers, searchUsers, setUserStatus, setUserRole, setUserCompliance, setUserAge, countUsers, countUsersByRole,
  // admin — disputes
  insertDispute, listDisputes, listDisputesByStatus, getDispute, resolveDispute, countOpenDisputes,
  // admin — audit log
  insertAudit, listAudit,
  // admin — orders monitor
  listRecentOrders, listActiveOrders,
}
