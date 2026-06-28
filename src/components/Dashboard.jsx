import { formatTime } from '../utils/time'

export default function Dashboard({ staff, todayRecords, currentlyIn, getStaffById }) {
  const presentCount = currentlyIn.length
  const completedToday = todayRecords.filter((r) => r.checkOut).length

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Staff</div>
          <div className="stat-value">{staff.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Currently In</div>
          <div className="stat-value success">{presentCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Checked Out Today</div>
          <div className="stat-value">{completedToday}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Entries</div>
          <div className="stat-value warning">{todayRecords.length}</div>
        </div>
      </div>

      {presentCount > 0 && (
        <div className="card">
          <h2 className="card-title">Currently Checked In</h2>
          <div className="staff-grid">
            {currentlyIn.map((record) => {
              const person = getStaffById(record.staffId)
              if (!person) return null
              return (
                <div key={record.id} className="staff-card in-office">
                  <div className="staff-info">
                    <h3>{person.name}</h3>
                    <p className="meta">{person.role}</p>
                    <span className="status-badge in">
                      <span className="status-dot" />
                      In since {formatTime(record.checkIn)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {staff.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>No staff members yet. Go to the Staff tab to add your team.</p>
          </div>
        </div>
      )}
    </div>
  )
}
