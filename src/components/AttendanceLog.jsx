import { useState, useMemo } from 'react'
import { formatTime, formatDateShort, formatDuration, todayISO } from '../utils/time'
import { buildExportRows, EXPORT_HEADERS } from '../utils/export'

export default function AttendanceLog({ records, staff, getStaffById }) {
  const [filterDate, setFilterDate] = useState(todayISO())
  const [filterStaff, setFilterStaff] = useState('all')

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchDate = !filterDate || r.checkIn.slice(0, 10) === filterDate
      const matchStaff = filterStaff === 'all' || r.staffId === filterStaff
      return matchDate && matchStaff
    })
  }, [records, filterDate, filterStaff])

  const exportCSV = () => {
    const rows = buildExportRows(filtered, getStaffById)

    const csv = [EXPORT_HEADERS, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${filterDate || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <h2 className="card-title">
        Attendance Records
        <button className="btn btn-ghost btn-sm" onClick={exportCSV} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </h2>
      <p className="card-hint">CSV export shows one row per staff per day: first check-in, last check-out, and total time in company.</p>

      <div className="filters">
        <div className="form-group">
          <label htmlFor="filterDate">Date</label>
          <input
            id="filterDate"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="filterStaff">Staff Member</label>
          <select
            id="filterStaff"
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
          >
            <option value="all">All Staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: '0.125rem' }}
          onClick={() => { setFilterDate(''); setFilterStaff('all') }}
        >
          Clear Filters
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📅</div>
          <p>No attendance records for the selected filters.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Role</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const person = getStaffById(r.staffId)
                return (
                  <tr key={r.id}>
                    <td>{formatDateShort(r.checkIn)}</td>
                    <td><strong>{person?.name ?? 'Unknown'}</strong></td>
                    <td>{person?.role || '—'}</td>
                    <td>{formatTime(r.checkIn)}</td>
                    <td>{formatTime(r.checkOut)}</td>
                    <td>{formatDuration(r.checkIn, r.checkOut)}</td>
                    <td>
                      <span className={`status-badge ${r.checkOut ? 'out' : 'in'}`}>
                        <span className="status-dot" />
                        {r.checkOut ? 'Completed' : 'Active'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
