export default function Settings({ staffCount, recordCount, clearAllData, showToast }) {
  const handleClear = () => {
    const message = `Delete all ${staffCount} staff and ${recordCount} attendance records? This cannot be undone.`
    if (!window.confirm(message)) return
    if (!window.confirm('Are you sure? Export a CSV backup first if you need your data.')) return
    clearAllData()
    showToast('All data cleared', 'success')
  }

  return (
    <div className="card">
      <h2 className="card-title">Settings</h2>

      <div className="settings-section">
        <h3 className="settings-label">Data Summary</h3>
        <p className="settings-meta">{staffCount} staff member{staffCount !== 1 ? 's' : ''} · {recordCount} attendance record{recordCount !== 1 ? 's' : ''}</p>
      </div>

      <div className="settings-section danger-zone">
        <h3 className="settings-label">Clear All Data</h3>
        <p className="settings-meta">Remove all staff and attendance records from this browser. Export a CSV from Records first if you need a backup.</p>
        <button className="btn btn-danger" onClick={handleClear}>
          Clear All Data
        </button>
      </div>
    </div>
  )
}
