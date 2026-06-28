import { useState, useEffect } from 'react'
import { liveClock, liveDate } from '../utils/time'

export default function Header() {
  const [time, setTime] = useState(liveClock())
  const [date, setDate] = useState(liveDate())

  useEffect(() => {
    const id = setInterval(() => {
      setTime(liveClock())
      setDate(liveDate())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-icon" aria-hidden="true">⏱</div>
        <div>
          <h1>Staff Attendance</h1>
          <p className="header-sub">Track check-in &amp; check-out times</p>
        </div>
      </div>
      <div className="live-clock">
        <div className="time">{time}</div>
        <div className="date">{date}</div>
      </div>
    </header>
  )
}
