import { formatTime, formatDateShort, formatDuration } from './time'

export function localDateKey(isoString) {
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function aggregateRecordsForExport(records, getStaffById) {
  const groups = new Map()

  for (const record of records) {
    const dateKey = localDateKey(record.checkIn)
    const key = `${record.staffId}-${dateKey}`

    if (!groups.has(key)) {
      groups.set(key, {
        staffId: record.staffId,
        dateKey,
        checkIns: [],
        checkOuts: [],
      })
    }

    const group = groups.get(key)
    group.checkIns.push(new Date(record.checkIn).getTime())
    if (record.checkOut) {
      group.checkOuts.push(new Date(record.checkOut).getTime())
    }
  }

  return Array.from(groups.values())
    .map((group) => {
      const firstCheckIn = new Date(Math.min(...group.checkIns)).toISOString()
      const lastCheckOut = group.checkOuts.length
        ? new Date(Math.max(...group.checkOuts)).toISOString()
        : null
      const person = getStaffById(group.staffId)

      return {
        dateKey: group.dateKey,
        person,
        firstCheckIn,
        lastCheckOut,
      }
    })
    .sort((a, b) => {
      if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey)
      return (a.person?.name ?? '').localeCompare(b.person?.name ?? '')
    })
}

export function buildExportRows(records, getStaffById) {
  return aggregateRecordsForExport(records, getStaffById).map((row) => [
    formatDateShort(row.firstCheckIn),
    row.person?.name ?? 'Unknown',
    row.person?.role ?? '',
    row.person?.employeeId ?? '',
    formatTime(row.firstCheckIn),
    formatTime(row.lastCheckOut),
    formatDuration(row.firstCheckIn, row.lastCheckOut),
  ])
}

export const EXPORT_HEADERS = [
  'Date',
  'Name',
  'Role',
  'Employee ID',
  'First Check In',
  'Last Check Out',
  'Total Duration',
]
