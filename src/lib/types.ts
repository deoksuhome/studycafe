export interface Profile {
  id: string
  username: string
  role: 'student' | 'admin'
  created_at: string
}

export interface Reservation {
  id: string
  user_id: string
  seat_number: number
  date: string
  day_of_week: 'saturday' | 'sunday'
  start_slot: number
  end_slot: number
  created_at: string
  profiles?: Profile
}

export interface SlotStatus {
  seat: number
  slot: number
  isReserved: boolean
  isOwnReservation: boolean
}
