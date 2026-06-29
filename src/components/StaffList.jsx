import { useState } from 'react'

export default function StaffList({ staff, addStaff, updateStaff, deleteStaff, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', role: '', employeeId: '', hourlyRate: '' })

  const resetForm = () => {
    setForm({ name: '', role: '', employeeId: '', hourlyRate: '' })
    setEditing(null)
    setShowForm(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast('Name is required', 'error')
      return
    }

    if (editing) {
      updateStaff(editing, form)
      showToast('Staff updated', 'success')
    } else {
      addStaff(form)
      showToast('Staff added', 'success')
    }
    resetForm()
  }

  const startEdit = (person) => {
    setEditing(person.id)
    setForm({
      name: person.name,
      role: person.role,
      employeeId: person.employeeId,
      hourlyRate: person.hourlyRate !== undefined ? person.hourlyRate : '',
    })
    setShowForm(true)
  }

  const handleDelete = (person) => {
    if (window.confirm(`Remove ${person.name} from staff list?`)) {
      deleteStaff(person.id)
      showToast('Staff removed', 'success')
    }
  }

  return (
    <div>
      <div className="card">
        <h2 className="card-title">
          Staff Members
          {!showForm && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              + Add Staff
            </button>
          )}
        </h2>

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Smith"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role / Department</label>
                <input
                  id="role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Sales, HR, etc."
                />
              </div>
              <div className="form-group">
                <label htmlFor="employeeId">Employee ID</label>
                <input
                  id="employeeId"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  placeholder="EMP-001"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hourlyRate">Hourly Rate ($)</label>
                <input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editing ? 'Save Changes' : 'Add Staff'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {staff.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">👤</div>
            <p>No staff members yet. Click "Add Staff" to get started.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Employee ID</th>
                  <th>Hourly Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((person) => (
                  <tr key={person.id}>
                    <td><strong>{person.name}</strong></td>
                    <td>{person.role || '—'}</td>
                    <td>{person.employeeId || '—'}</td>
                    <td>${parseFloat(person.hourlyRate || 0).toFixed(2)}/hr</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => startEdit(person)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(person)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
