const STORAGE_KEY = 'staff-attendance-data'

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { staff: [], records: [] }
    return JSON.parse(raw)
  } catch {
    return { staff: [], records: [] }
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function generateId() {
  return crypto.randomUUID()
}
