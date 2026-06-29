import { useState, useMemo } from 'react'

export default function Payroll({
  staff,
  records,
  addAdvance,
  deleteAdvance,
  processSalary,
  revertSalaryPayment,
  showToast,
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Advance Form State
  const [advanceForm, setAdvanceForm] = useState({
    staffId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  })

  // Calculate hours worked for a staff member in a specific month
  const getWorkingHoursForMonth = (staffId, monthStr) => {
    const staffRecords = records.filter(
      (r) =>
        r.staffId === staffId &&
        r.checkIn &&
        r.checkOut &&
        r.checkIn.slice(0, 7) === monthStr
    )
    let totalMs = 0
    for (const r of staffRecords) {
      const diff = new Date(r.checkOut) - new Date(r.checkIn)
      if (diff > 0) {
        totalMs += diff
      }
    }
    return totalMs / 3600000 // Convert to hours
  }

  // Get total pending advances for a staff member that occurred on or before the selected month
  const getAvailableAdvances = (person, monthStr) => {
    if (!person.advances) return 0
    const endOfMonth = `${monthStr}-31`
    return person.advances
      .filter((adv) => adv.date <= endOfMonth && adv.status !== 'deducted')
      .reduce((sum, adv) => sum + (adv.remaining || 0), 0)
  }

  // Build Payroll Data
  const payrollData = useMemo(() => {
    return staff.map((person) => {
      // Check if already processed for this month
      const payment = (person.salaryPayments || []).find(
        (p) => p.month === selectedMonth
      )

      if (payment) {
        return {
          person,
          isProcessed: true,
          paymentId: payment.id,
          workingHours: payment.workingHours,
          hourlyRate: payment.hourlyRate,
          baseSalary: payment.baseSalary,
          advanceDeducted: payment.advanceDeducted,
          netPayout: payment.netPayout,
          dateProcessed: payment.dateProcessed,
        }
      }

      // If not processed, calculate dynamically
      const workingHours = getWorkingHoursForMonth(person.id, selectedMonth)
      const hourlyRate = person.hourlyRate || 0
      const baseSalary = workingHours * hourlyRate
      const availableAdvances = getAvailableAdvances(person, selectedMonth)
      const advanceDeducted = Math.min(baseSalary, availableAdvances)
      const netPayout = baseSalary - advanceDeducted

      return {
        person,
        isProcessed: false,
        workingHours,
        hourlyRate,
        baseSalary,
        advanceDeducted,
        netPayout,
      }
    })
  }, [staff, records, selectedMonth])

  // Handle Recording Advance
  const handleRecordAdvance = (e) => {
    e.preventDefault()
    const { staffId, amount, date, description } = advanceForm
    if (!staffId) {
      showToast('Please select a staff member', 'error')
      return
    }
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please enter a valid amount greater than 0', 'error')
      return
    }
    if (!date) {
      showToast('Please select a date', 'error')
      return
    }

    addAdvance(staffId, { amount: parsedAmount, date, description })
    showToast(`Advance of $${parsedAmount.toFixed(2)} recorded successfully`, 'success')
    setAdvanceForm({
      staffId: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
    })
  }

  // Handle Process Salary Payout
  const handleProcessSalary = (row) => {
    if (row.isProcessed) return

    const { person, workingHours, hourlyRate, baseSalary, advanceDeducted, netPayout } = row
    const confirmMsg = `Process salary for ${person.name} for ${selectedMonth}?\n\n` +
      `- Working Hours: ${workingHours.toFixed(2)} hrs\n` +
      `- Hourly Rate: $${hourlyRate.toFixed(2)}/hr\n` +
      `- Base Salary: $${baseSalary.toFixed(2)}\n` +
      `- Advances Deducted: -$${advanceDeducted.toFixed(2)}\n` +
      `- Net Payout: $${netPayout.toFixed(2)}`

    if (!window.confirm(confirmMsg)) return

    processSalary(person.id, selectedMonth, {
      workingHours,
      hourlyRate,
      baseSalary,
      advanceDeducted,
      netPayout,
    })
    showToast(`Salary for ${person.name} processed successfully`, 'success')
  }

  // Handle Revert Salary Payout
  const handleRevertSalary = (row) => {
    if (!row.isProcessed) return
    const confirmMsg = `Are you sure you want to revert the processed salary for ${row.person.name} for ${selectedMonth}?\nThis will restore the deducted advances.`
    if (!window.confirm(confirmMsg)) return

    revertSalaryPayment(row.person.id, row.paymentId)
    showToast(`Salary payout reverted for ${row.person.name}`, 'success')
  }

  // Get all advances across all staff for viewing in the ledger list
  const allAdvances = useMemo(() => {
    const list = []
    staff.forEach((person) => {
      if (person.advances) {
        person.advances.forEach((adv) => {
          list.push({
            ...adv,
            staffName: person.name,
            staffId: person.id,
          })
        })
      }
    })
    // Sort advances by date descending
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [staff])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Monthly Payroll Calculation Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Monthly Payroll Calculator</h2>
          <div className="form-group" style={{ width: 'auto', minWidth: '180px' }}>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select payroll month"
            />
          </div>
        </div>
        <p className="card-hint">
          Calculate salaries based on working hours in the selected month and automatically deduct any prepayment/advance balances.
        </p>

        {staff.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💳</div>
            <p>No staff members available. Go to the Staff tab to add your team.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Hourly Rate</th>
                  <th>Hours Worked</th>
                  <th>Base Salary</th>
                  <th>Advances Deducted</th>
                  <th>Net Payout</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((row) => (
                  <tr key={row.person.id}>
                    <td>
                      <strong>{row.person.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {row.person.role || 'No Role'}
                      </div>
                    </td>
                    <td>${parseFloat(row.hourlyRate).toFixed(2)}/hr</td>
                    <td>{row.workingHours.toFixed(2)} hrs</td>
                    <td>${row.baseSalary.toFixed(2)}</td>
                    <td style={{ color: row.advanceDeducted > 0 ? 'var(--warning)' : 'inherit' }}>
                      {row.advanceDeducted > 0 ? `-$${row.advanceDeducted.toFixed(2)}` : '$0.00'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                      ${row.netPayout.toFixed(2)}
                    </td>
                    <td>
                      <span className={`status-badge ${row.isProcessed ? 'in' : 'out'}`}>
                        <span className="status-dot" />
                        {row.isProcessed ? 'Processed & Paid' : 'Unprocessed'}
                      </span>
                    </td>
                    <td>
                      {row.isProcessed ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRevertSalary(row)}
                        >
                          Revert
                        </button>
                      ) : (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleProcessSalary(row)}
                          disabled={row.workingHours === 0 && row.advanceDeducted === 0}
                        >
                          Pay &amp; Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Record Advance Payment Form */}
        <div className="card">
          <h2 className="card-title">Record Advance Payment (Prepayment)</h2>
          <p className="card-hint">
            Record advances paid to staff. These amounts will be deducted from their payroll salary in the subsequent month calculations.
          </p>
          <form onSubmit={handleRecordAdvance}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="advanceStaff">Staff Member *</label>
                <select
                  id="advanceStaff"
                  value={advanceForm.staffId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  required
                >
                  <option value="">Select Staff...</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role || 'No Role'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="advanceAmount">Amount ($) *</label>
                  <input
                    id="advanceAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="advanceDate">Date Paid *</label>
                  <input
                    id="advanceDate"
                    type="date"
                    value={advanceForm.date}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="advanceDesc">Description / Purpose</label>
                <input
                  id="advanceDesc"
                  type="text"
                  value={advanceForm.description}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, description: e.target.value })}
                  placeholder="e.g. Pre-month house rent advance"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                Record Prepayment / Advance
              </button>
            </div>
          </form>
        </div>

        {/* Advance Payments Ledger List */}
        <div className="card">
          <h2 className="card-title">Advances Ledger</h2>
          <p className="card-hint">
            History of advance payments recorded. Remaining balances are deducted during payroll runs.
          </p>

          {allAdvances.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💵</div>
              <p>No advance payments recorded yet.</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Staff / Date</th>
                    <th>Amount</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allAdvances.map((adv) => (
                    <tr key={adv.id}>
                      <td>
                        <strong>{adv.staffName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {adv.date} {adv.description ? `· ${adv.description}` : ''}
                        </div>
                      </td>
                      <td>${adv.amount.toFixed(2)}</td>
                      <td style={{ color: adv.remaining > 0 ? 'var(--warning)' : 'inherit' }}>
                        ${adv.remaining.toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            adv.status === 'deducted'
                              ? 'out'
                              : adv.status === 'partially_deducted'
                              ? 'warning'
                              : 'in'
                          }`}
                          style={{
                            color: adv.status === 'partially_deducted' ? 'var(--warning)' : undefined,
                            background: adv.status === 'partially_deducted' ? 'rgba(245,158,11,0.12)' : undefined
                          }}
                        >
                          <span className="status-dot" />
                          {adv.status === 'deducted'
                            ? 'Deducted'
                            : adv.status === 'partially_deducted'
                            ? 'Partial'
                            : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {adv.status === 'pending' ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (window.confirm(`Delete advance payment of $${adv.amount.toFixed(2)} for ${adv.staffName}?`)) {
                                deleteAdvance(adv.staffId, adv.id)
                                showToast('Advance payment deleted', 'success')
                              }
                            }}
                          >
                            Delete
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
