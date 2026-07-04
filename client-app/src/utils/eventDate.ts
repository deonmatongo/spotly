// Parse the human-readable event date/time strings from the mock data
// (e.g. "Saturday, 5 July 2025" + "7:00 PM – 11:30 PM") into real Date objects
// so calendar entries land on the actual event, not a hardcoded placeholder.

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
}

function applyTime(date: Date, match: RegExpMatchArray) {
  let h = parseInt(match[1], 10) % 12
  if (/pm/i.test(match[3])) h += 12
  date.setHours(h, parseInt(match[2], 10), 0, 0)
}

export function parseEventDate(dateStr?: string, timeStr?: string): { start: Date; end: Date } {
  let start: Date | null = null

  if (dateStr) {
    const m = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
    if (m && MONTHS[m[2].toLowerCase()] !== undefined) {
      start = new Date(parseInt(m[3], 10), MONTHS[m[2].toLowerCase()], parseInt(m[1], 10), 19, 0, 0, 0)
    }
  }
  // Fallback: a month out, so the entry is still useful if the string is odd.
  if (!start) {
    start = new Date()
    start.setMonth(start.getMonth() + 1)
    start.setHours(19, 0, 0, 0)
  }

  const times = timeStr ? [...timeStr.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/g)] : []
  if (times.length >= 1) applyTime(start, times[0])

  let end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
  if (times.length >= 2) {
    const e = new Date(start)
    applyTime(e, times[1])
    if (e > start) end = e
  }

  return { start, end }
}
