import { useState, useEffect, useCallback } from 'react'
import { loadData, saveData, generateId } from '../utils/storage'
import { isSameDay } from '../utils/time'

export function useAttendance() {
  const [data, setData] = useState(loadData)

  useEffect(() => {
    saveData(data)
  }, [data])

  const addStaff = useCallback(({ name, role, employeeId }) => {
    const staff = {
      id: generateId(),
      name: name.trim(),
      role: role.trim(),
      employeeId: employeeId.trim(),
      createdAt: new Date().toISOString(),
    }
    setData((prev) => ({ ...prev, staff: [...prev.staff, staff] }))
    return staff
  }, [])

  const updateStaff = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) =>
        s.id === id ? { ...s, ...updates, name: updates.name?.trim() ?? s.name, role: updates.role?.trim() ?? s.role, employeeId: updates.employeeId?.trim() ?? s.employeeId } : s
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
  }
}
