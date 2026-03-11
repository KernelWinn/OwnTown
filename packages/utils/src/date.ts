/** Format ISO date to Indian date display: "12 Mar 2024" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Format ISO date to time: "9:00 AM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** Get today's date in YYYY-MM-DD */
export function todayDate(): string {
  return new Date().toISOString().split('T')[0]
}

/** Get next N dates from today */
export function getNextDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })
}
