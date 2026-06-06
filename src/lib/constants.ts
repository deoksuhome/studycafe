export const SEATS = Array.from({ length: 25 }, (_, i) => i + 1)

export const TIME_SLOTS = {
  saturday: [
    { slot: 0, label: '08:30 - 09:30', start: '08:30', end: '09:30' },
    { slot: 1, label: '09:30 - 10:30', start: '09:30', end: '10:30' },
    { slot: 2, label: '10:30 - 11:30', start: '10:30', end: '11:30' },
    { slot: 3, label: '11:30 - 12:30', start: '11:30', end: '12:30' },
  ],
  sunday: [
    { slot: 0, label: '13:00 - 14:00', start: '13:00', end: '14:00' },
    { slot: 1, label: '14:00 - 15:00', start: '14:00', end: '15:00' },
    { slot: 2, label: '15:00 - 16:00', start: '15:00', end: '16:00' },
    { slot: 3, label: '16:00 - 17:00', start: '16:00', end: '17:00' },
  ],
}

export type DayOfWeek = 'saturday' | 'sunday'

export function getNextWeekend(): { saturday: Date; sunday: Date } {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sunday, 6=Saturday

  let daysUntilSaturday = (6 - dayOfWeek + 7) % 7
  if (daysUntilSaturday === 0) daysUntilSaturday = 7 // next Saturday if today is Saturday

  const saturday = new Date(today)
  saturday.setDate(today.getDate() + daysUntilSaturday)
  saturday.setHours(0, 0, 0, 0)

  const sunday = new Date(saturday)
  sunday.setDate(saturday.getDate() + 1)

  return { saturday, sunday }
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getSlotTimeRange(day: DayOfWeek, startSlot: number, endSlot: number): string {
  const slots = TIME_SLOTS[day]
  return `${slots[startSlot].start} - ${slots[endSlot].end}`
}
