// Spotly — automated SQLite backups with retention.
//
// Uses better-sqlite3's online .backup() (safe while the DB is in use / WAL mode).
// Schedule startBackups() from the server; it also runs one immediately.
//
//   BACKUP_DIR       where snapshots land        (default ../../backups)
//   BACKUP_EVERY_MS  interval                     (default 6h)
//   BACKUP_KEEP      how many snapshots to keep   (default 14)
//
// For production also ship these off-box (S3/R2 lifecycle rule, or a cron that
// syncs BACKUP_DIR) so a lost server doesn't lose the backups with it.

const fs   = require('fs')
const path = require('path')
const { db, DB_PATH } = require('./db')

const BACKUP_DIR     = process.env.BACKUP_DIR || path.join(__dirname, '../../backups')
const BACKUP_EVERY_MS = Number(process.env.BACKUP_EVERY_MS || 6 * 60 * 60 * 1000)
const BACKUP_KEEP     = Number(process.env.BACKUP_KEEP || 14)

function stamp(d) {
  // YYYYMMDD-HHMMSS in UTC, filesystem-safe
  const p = n => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`
}

async function runBackup() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    const file = path.join(BACKUP_DIR, `spotly-${stamp(new Date())}.db`)
    await db.backup(file)               // atomic, non-blocking online backup
    prune()
    console.log(`[backup] wrote ${path.basename(file)}`)
    return file
  } catch (err) {
    console.error('[backup] failed:', err.message)
    return null
  }
}

function prune() {
  const snaps = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('spotly-') && f.endsWith('.db'))
    .sort()                              // lexical == chronological with this stamp
  const excess = snaps.length - BACKUP_KEEP
  for (let i = 0; i < excess; i++) {
    try { fs.unlinkSync(path.join(BACKUP_DIR, snaps[i])) } catch {}
  }
}

function startBackups() {
  console.log(`[backup] enabled — dir=${BACKUP_DIR} every=${Math.round(BACKUP_EVERY_MS / 3600000)}h keep=${BACKUP_KEEP}`)
  runBackup()
  const t = setInterval(runBackup, BACKUP_EVERY_MS)
  if (t.unref) t.unref()
  return t
}

module.exports = { startBackups, runBackup, BACKUP_DIR }

// Allow `node backup.js` for a manual one-off snapshot.
if (require.main === module) {
  runBackup().then(f => { console.log(f ? `Backup: ${f}` : 'Backup failed'); process.exit(f ? 0 : 1) })
}
