import { useState, useCallback } from 'react'
import { useAttendance } from './hooks/useAttendance'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import CheckInPanel from './components/CheckInPanel'
import StaffList from './components/StaffList'
import Payroll from './components/Payroll'
import AttendanceLog from './components/AttendanceLog'
import Settings from './components/Settings'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'attendance', label: 'Check In/Out' },
  { id: 'staff', label: 'Staff' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'records', label: 'Records' },
  { id: 'settings', label: 'Settings' },
]

function Toast({ message, type, onClose }) {
  if (!message) return null
  return (
    <div className={`toast ${type}`} role="status">
      {message}
      <button
        onClick={onClose}
        style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [toast, setToast] = useState(null)

  const attendance = useAttendance()

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return (
    <div className="app">
      <Header />

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && (
        <Dashboard
          staff={attendance.staff}
          todayRecords={attendance.getTodayRecords()}
          currentlyIn={attendance.getCurrentlyIn()}
          getStaffById={attendance.getStaffById}
        />
      )}

      {tab === 'attendance' && (
        <CheckInPanel
          staff={attendance.staff}
          getActiveRecord={attendance.getActiveRecord}
          checkIn={attendance.checkIn}
          checkOut={attendance.checkOut}
          showToast={showToast}
        />
      )}

      {tab === 'staff' && (
        <StaffList
          staff={attendance.staff}
          addStaff={attendance.addStaff}
          updateStaff={attendance.updateStaff}
          deleteStaff={attendance.deleteStaff}
          showToast={showToast}
        />
      )}

      {tab === 'payroll' && (
        <Payroll
          staff={attendance.staff}
          records={attendance.records}
          addAdvance={attendance.addAdvance}
          deleteAdvance={attendance.deleteAdvance}
          processSalary={attendance.processSalary}
          revertSalaryPayment={attendance.revertSalaryPayment}
          showToast={showToast}
        />
      )}

      {tab === 'records' && (
        <AttendanceLog
          records={attendance.records}
          staff={attendance.staff}
          getStaffById={attendance.getStaffById}
        />
      )}

      {tab === 'settings' && (
        <Settings
          staffCount={attendance.staff.length}
          recordCount={attendance.records.length}
          clearAllData={attendance.clearAllData}
          showToast={showToast}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}
