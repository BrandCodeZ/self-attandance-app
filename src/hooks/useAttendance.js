import { useState, useEffect, useCallback } from 'react'
import { loadData, saveData, generateId } from '../utils/storage'
import { isSameDay } from '../utils/time'

export function useAttendance() {
  const [data, setData] = useState(loadData)

  useEffect(() => {
    saveData(data)
  }, [data])

  const addStaff = useCallback(({ name, role, employeeId, hourlyRate }) => {
    const staff = {
      id: generateId(),
      name: name.trim(),
      role: role.trim(),
      employeeId: employeeId.trim(),
      hourlyRate: parseFloat(hourlyRate) || 0,
      advances: [],
      salaryPayments: [],
      createdAt: new Date().toISOString(),
    }
    setData((prev) => ({ ...prev, staff: [...prev.staff, staff] }))
    return staff
  }, [])

  const updateStaff = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) =>
        s.id === id
          ? {
              ...s,
              ...updates,
              name: updates.name?.trim() ?? s.name,
              role: updates.role?.trim() ?? s.role,
              employeeId: updates.employeeId?.trim() ?? s.employeeId,
              hourlyRate: updates.hourlyRate !== undefined ? parseFloat(updates.hourlyRate) || 0 : s.hourlyRate,
            }
          : s
      ),
    }))
  }, [])

  const deleteStaff = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.filter((s) => s.id !== id),
    }))
  }, [])

  const getActiveRecord = useCallback(
    (staffId) => data.records.find((r) => r.staffId === staffId && !r.checkOut),
    [data.records]
  )

  const checkIn = useCallback((staffId, at) => {
    const active = data.records.find((r) => r.staffId === staffId && !r.checkOut)
    if (active) return { error: 'Already checked in' }

    const checkInTime = at ?? new Date().toISOString()
    if (Number.isNaN(new Date(checkInTime).getTime())) {
      return { error: 'Invalid date or time' }
    }

    const record = {
      id: generateId(),
      staffId,
      checkIn: checkInTime,
      checkOut: null,
    }
    setData((prev) => ({ ...prev, records: [record, ...prev.records] }))
    return { record }
  }, [data.records])

  const checkOut = useCallback((staffId, at) => {
    const active = data.records.find((r) => r.staffId === staffId && !r.checkOut)
    if (!active) return { error: 'Not checked in' }

    const checkOutTime = at ?? new Date().toISOString()
    if (Number.isNaN(new Date(checkOutTime).getTime())) {
      return { error: 'Invalid date or time' }
    }
    if (new Date(checkOutTime) <= new Date(active.checkIn)) {
      return { error: 'Check-out must be after check-in' }
    }

    setData((prev) => ({
      ...prev,
      records: prev.records.map((r) =>
        r.id === active.id ? { ...r, checkOut: checkOutTime } : r
      ),
    }))
    return { success: true }
  }, [data.records])

  const clearAllData = useCallback(() => {
    setData({ staff: [], records: [] })
  }, [])

  const getStaffById = useCallback(
    (id) => data.staff.find((s) => s.id === id),
    [data.staff]
  )

  const getTodayRecords = useCallback(() => {
    const now = new Date().toISOString()
    return data.records.filter((r) => isSameDay(r.checkIn, now))
  }, [data.records])

  const getCurrentlyIn = useCallback(() => {
    return data.records.filter((r) => !r.checkOut)
  }, [data.records])

  const addAdvance = useCallback((staffId, { amount, date, description }) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => {
        if (s.id !== staffId) return s
        const advance = {
          id: generateId(),
          amount: parseFloat(amount) || 0,
          remaining: parseFloat(amount) || 0,
          date: date || new Date().toISOString().slice(0, 10),
          description: description?.trim() || '',
          status: 'pending', // 'pending', 'partially_deducted', 'deducted'
        }
        return {
          ...s,
          advances: [...(s.advances || []), advance],
        }
      }),
    }))
  }, [])

  const deleteAdvance = useCallback((staffId, advanceId) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => {
        if (s.id !== staffId) return s
        return {
          ...s,
          advances: (s.advances || []).filter((adv) => adv.id !== advanceId),
        }
      }),
    }))
  }, [])

  const processSalary = useCallback((staffId, month, { workingHours, hourlyRate, baseSalary, advanceDeducted, netPayout }) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => {
        if (s.id !== staffId) return s

        const payment = {
          id: generateId(),
          month,
          workingHours,
          hourlyRate,
          baseSalary,
          advanceDeducted,
          netPayout,
          dateProcessed: new Date().toISOString(),
        }

        let remainingToDeduct = advanceDeducted
        const updatedAdvances = (s.advances || []).map((adv) => {
          if (remainingToDeduct <= 0 || adv.status === 'deducted') return adv

          const deductFromThis = Math.min(adv.remaining, remainingToDeduct)
          const newRemaining = adv.remaining - deductFromThis
          remainingToDeduct -= deductFromThis

          return {
            ...adv,
            remaining: newRemaining,
            status: newRemaining <= 0 ? 'deducted' : 'partially_deducted',
          }
        })

        return {
          ...s,
          advances: updatedAdvances,
          salaryPayments: [...(s.salaryPayments || []), payment],
        }
      }),
    }))
  }, [])

  const revertSalaryPayment = useCallback((staffId, paymentId) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => {
        if (s.id !== staffId) return s
        const payment = (s.salaryPayments || []).find((p) => p.id === paymentId)
        if (!payment) return s

        let amountToRestore = payment.advanceDeducted
        const updatedAdvances = [...(s.advances || [])]
          .reverse()
          .map((adv) => {
            if (amountToRestore <= 0) return adv
            const maxRestore = adv.amount - adv.remaining
            if (maxRestore <= 0) return adv

            const restoreAmount = Math.min(maxRestore, amountToRestore)
            const newRemaining = adv.remaining + restoreAmount
            amountToRestore -= restoreAmount

            return {
              ...adv,
              remaining: newRemaining,
              status: newRemaining === adv.amount ? 'pending' : 'partially_deducted',
            }
          })
          .reverse()

        return {
          ...s,
          advances: updatedAdvances,
          salaryPayments: (s.salaryPayments || []).filter((p) => p.id !== paymentId),
        }
      }),
    }))
  }, [])

  return {
    staff: data.staff,
    records: data.records,
    addStaff,
    updateStaff,
    deleteStaff,
    checkIn,
    checkOut,
    clearAllData,
    getActiveRecord,
    getStaffById,
    getTodayRecords,
    getCurrentlyIn,
    addAdvance,
    deleteAdvance,
    processSalary,
    revertSalaryPayment,
  }
}
