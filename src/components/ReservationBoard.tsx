'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TIME_SLOTS, SEATS, DayOfWeek, getNextWeekend, formatDate, getSlotTimeRange } from '@/lib/constants'
import { Reservation } from '@/lib/types'

interface Props {
  userId: string
  username: string
}

interface ModalState {
  seat: number
  startSlot: number | null
  endSlot: number | null
}

export default function ReservationBoard({ userId, username }: Props) {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('saturday')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { saturday, sunday } = getNextWeekend()
  const dates = { saturday: formatDate(saturday), sunday: formatDate(sunday) }
  const currentDate = dates[activeDay]

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('date', currentDate)
    setReservations(data || [])
    setLoading(false)
  }, [currentDate])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const myReservation = reservations.find(r => r.user_id === userId)

  function isSeatSlotReserved(seat: number, slot: number): boolean {
    return reservations.some(
      r => r.seat_number === seat && r.start_slot <= slot && r.end_slot >= slot
    )
  }

  function isMyReservation(seat: number, slot: number): boolean {
    return reservations.some(
      r => r.user_id === userId && r.seat_number === seat && r.start_slot <= slot && r.end_slot >= slot
    )
  }

  function getCellColor(seat: number, slot: number): string {
    if (isMyReservation(seat, slot)) return 'bg-blue-500 text-white'
    if (isSeatSlotReserved(seat, slot)) return 'bg-red-400 text-white'
    return 'bg-green-100 hover:bg-green-200 text-green-800 cursor-pointer'
  }

  function handleCellClick(seat: number, slot: number) {
    if (isSeatSlotReserved(seat, slot) && !isMyReservation(seat, slot)) return
    if (myReservation && !isMyReservation(seat, slot)) return
    setModal({ seat, startSlot: slot, endSlot: slot })
    setError('')
  }

  async function handleReserve() {
    if (!modal || modal.startSlot === null || modal.endSlot === null) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seat_number: modal.seat,
        date: currentDate,
        day_of_week: activeDay,
        start_slot: modal.startSlot,
        end_slot: modal.endSlot,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '예약에 실패했습니다.')
    } else {
      setSuccess('예약이 완료되었습니다!')
      setModal(null)
      fetchReservations()
      setTimeout(() => setSuccess(''), 3000)
    }
    setSubmitting(false)
  }

  async function handleCancelReservation() {
    if (!myReservation) return
    setSubmitting(true)
    const res = await fetch(`/api/reservations?id=${myReservation.id}`, { method: 'DELETE' })
    if (res.ok) {
      setSuccess('예약이 취소되었습니다.')
      fetchReservations()
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError('예약 취소에 실패했습니다.')
    }
    setSubmitting(false)
  }

  const slots = TIME_SLOTS[activeDay]

  return (
    <div className="space-y-4">
      {/* Day Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveDay('saturday')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            activeDay === 'saturday'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          토요일 {saturday.getMonth() + 1}/{saturday.getDate()}
        </button>
        <button
          onClick={() => setActiveDay('sunday')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
            activeDay === 'sunday'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          일요일 {sunday.getMonth() + 1}/{sunday.getDate()}
        </button>
      </div>

      {/* My Reservation Info */}
      {myReservation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">내 예약</p>
            <p className="text-sm text-blue-600">
              {myReservation.seat_number}번 좌석 · {getSlotTimeRange(activeDay, myReservation.start_slot, myReservation.end_slot)}
            </p>
          </div>
          <button
            onClick={handleCancelReservation}
            disabled={submitting}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            취소
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
          {success}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block"></span>예약 가능</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block"></span>예약됨</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>내 예약</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">불러오는 중...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-gray-500 font-medium w-12">좌석</th>
                {slots.map(s => (
                  <th key={s.slot} className="p-2 text-center text-gray-500 font-medium text-xs whitespace-nowrap">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEATS.map(seat => (
                <tr key={seat} className="border-t border-gray-100">
                  <td className="p-2 font-medium text-gray-700">{seat}번</td>
                  {slots.map(s => (
                    <td key={s.slot} className="p-1">
                      <button
                        onClick={() => handleCellClick(seat, s.slot)}
                        disabled={isSeatSlotReserved(seat, s.slot) && !isMyReservation(seat, s.slot) || (!!myReservation && !isMyReservation(seat, s.slot))}
                        className={`w-full h-8 rounded text-xs font-medium transition-colors ${getCellColor(seat, s.slot)} disabled:cursor-not-allowed`}
                      >
                        {isMyReservation(seat, s.slot) ? '내것' : isSeatSlotReserved(seat, s.slot) ? '예약됨' : ''}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{modal.seat}번 좌석 예약</h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">시작 시간</label>
                <select
                  value={modal.startSlot ?? ''}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setModal(m => m ? { ...m, startSlot: v, endSlot: Math.max(v, m.endSlot ?? v) } : null)
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {slots.map(s => (
                    <option key={s.slot} value={s.slot} disabled={isSeatSlotReserved(modal.seat, s.slot)}>
                      {s.start} {isSeatSlotReserved(modal.seat, s.slot) ? '(예약됨)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">종료 시간</label>
                <select
                  value={modal.endSlot ?? ''}
                  onChange={e => setModal(m => m ? { ...m, endSlot: Number(e.target.value) } : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {slots.filter(s => s.slot >= (modal.startSlot ?? 0)).map(s => (
                    <option key={s.slot} value={s.slot} disabled={isSeatSlotReserved(modal.seat, s.slot)}>
                      {s.end} {isSeatSlotReserved(modal.seat, s.slot) ? '(예약됨)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              {modal.startSlot !== null && modal.endSlot !== null &&
                `예약 시간: ${getSlotTimeRange(activeDay, modal.startSlot, modal.endSlot)}`
              }
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-3">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setModal(null); setError('') }}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleReserve}
                disabled={submitting}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
              >
                {submitting ? '처리 중...' : '예약하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
