import { useState } from 'react'
import { formatTime, todayISO, nowTimeInput, toISOFromLocal } from '../utils/time'

export default function CheckInPanel({ staff, getActiveRecord, checkIn, checkOut, showToast }) {
  const [lateModal, setLateModal] = useState(null)

  if (staff.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>Add staff members first to record attendance.</p>
        </div>
      </div>
    )
  }

  const handleLateConfirm = (date, time) => {
    if (!lateModal) return
    const at = toISOFromLocal(date, time)
    const { person, type } = lateModal

    if (type === 'in') {
      const result = checkIn(person.id, at)
      if (result.error) showToast(result.error, 'error')
      else showToast(`${person.name} late check-in recorded`, 'success')
    } else {
      const result = checkOut(person.id, at)
      if (result.error) showToast(result.error, 'error')
      else showToast(`${person.name} late check-out recorded`, 'success')
    }
    setLateModal(null)
  }

  return (
    <>
      <div className="card">
        <h2 className="card-title">Quick Check-In / Check-Out</h2>
        <p className="card-hint">Use <strong>Late Entry</strong> to pick a past date and time when recording attendance after the fact.</p>
        <div className="staff-grid">
          {staff.map((person) => (
            <StaffCheckCard
              key={person.id}
              person={person}
              activeRecord={getActiveRecord(person.id)}
              onCheckIn={() => {
                const result = checkIn(person.id)
                if (result.error) showToast(result.error, 'error')
                else showToast(`${person.name} checked in`, 'success')
              }}
              onCheckOut={() => {
                const result = checkOut(person.id)
                if (result.error) showToast(result.error, 'error')
                else showToast(`${person.name} checked out`, 'success')
              }}
              onLateEntry={(type) => setLateModal({ person, type })}
            />
          ))}
        </div>
      </div>

      {lateModal && (
        <LateEntryModal
          person={lateModal.person}
          type={lateModal.type}
          checkInTime={lateModal.type === 'out' ? getActiveRecord(lateModal.person.id)?.checkIn : null}
          onConfirm={handleLateConfirm}
          onClose={() => setLateModal(null)}
        />
      )}
    </>
  )
}

function StaffCheckCard({ person, activeRecord, onCheckIn, onCheckOut, onLateEntry }) {
  const isIn = !!activeRecord

  return (
    <div className={`staff-card ${isIn ? 'in-office' : ''}`}>
      <div className="staff-info">
        <h3>{person.name}</h3>
        <p className="meta">{person.role}</p>
        <span className="id-badge">ID: {person.employeeId || '—'}</span>
      </div>
      <span className={`status-badge ${isIn ? 'in' : 'out'}`}>
        <span className="status-dot" />
        {isIn ? `In since ${formatTime(activeRecord.checkIn)}` : 'Not checked in'}
      </span>
      <div className="staff-actions">
        {isIn ? (
          <>
            <button className="btn btn-danger" onClick={onCheckOut}>
              Check Out
            </button>
            <button className="btn btn-ghost btn-sm late-btn" onClick={() => onLateEntry('out')}>
              Late Check Out
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-success" onClick={onCheckIn}>
              Check In
            </button>
            <button className="btn btn-ghost btn-sm late-btn" onClick={() => onLateEntry('in')}>
              Late Entry
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function LateEntryModal({ person, type, checkInTime, onConfirm, onClose }) {
  const [date, setDate] = useState(todayISO())
  const [time, setTime] = useState(nowTimeInput())

  const title = type === 'in'
    ? `Late Check-In — ${person.name}`
    : `Late Check-Out — ${person.name}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="late-modal-title">
        <h3 id="late-modal-title" className="modal-title">{title}</h3>
        <p className="modal-desc">
          {type === 'in'
            ? 'Choose the date and time this staff member actually arrived.'
            : 'Choose the date and time this staff member actually left.'}
        </p>
        {checkInTime && (
          <p className="modal-note">Checked in at: {formatTime(checkInTime)}</p>
        )}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="late-date">Date</label>
            <input
              id="late-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="late-time">Time</label>
            <input
              id="late-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={() => onConfirm(date, time)}
            disabled={!date || !time}
          >
            Save {type === 'in' ? 'Check-In' : 'Check-Out'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
