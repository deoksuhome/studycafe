'use client'

import { useState } from 'react'
import { Reservation, Profile } from '@/lib/types'
import { TIME_SLOTS } from '@/lib/constants'

interface Props {
  reservations: (Reservation & { profiles?: Profile })[]
  profiles: Profile[]
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function AdminDashboard({ reservations: initialReservations, profiles }: Props) {
  const [reservations, setReservations] = useState(initialReservations)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState(generatePassword())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdUsers, setCreatedUsers] = useState<{ username: string; password: string }[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')

    const res = await fetch('/api/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()
    if (!res.ok) {
      setCreateError(data.error || '계정 생성에 실패했습니다.')
    } else {
      setCreatedUsers(prev => [...prev, { username, password }])
      setUsername('')
      setPassword(generatePassword())
    }
    setCreating(false)
  }

  async function handleDeleteReservation(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/reservations?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setReservations(prev => prev.filter(r => r.id !== id))
    }
    setDeleting(null)
  }

  function downloadCSV() {
    if (createdUsers.length === 0) return
    const header = '아이디,비밀번호'
    const rows = createdUsers.map(u => `${u.username},${u.password}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_accounts.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function getTimeLabel(r: Reservation) {
    const slots = TIME_SLOTS[r.day_of_week as 'saturday' | 'sunday']
    return `${slots[r.start_slot].start} - ${slots[r.end_slot].end}`
  }

  const dayLabel = (d: string) => d === 'saturday' ? '토요일' : '일요일'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">관리자 대시보드</h1>
            <p className="text-xs text-gray-500">스터디카페 예약 시스템</p>
          </div>
          <a href="/" className="text-sm text-blue-600 hover:text-blue-800">← 예약 현황</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Create Student Account */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">학생 계정 생성</h2>
          <form onSubmit={handleCreateUser} className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-sm text-gray-600 block mb-1">아이디</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="student01"
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">비밀번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-28"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
                >
                  재생성
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg text-sm"
            >
              {creating ? '생성 중...' : '계정 생성'}
            </button>
          </form>
          {createError && (
            <p className="text-red-500 text-sm mt-2">{createError}</p>
          )}
        </section>

        {/* Created Users List */}
        {createdUsers.length > 0 && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">이번 세션 생성된 계정</h2>
              <button
                onClick={downloadCSV}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium"
              >
                CSV 다운로드
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500">아이디</th>
                    <th className="text-left py-2 px-3 text-gray-500">비밀번호</th>
                  </tr>
                </thead>
                <tbody>
                  {createdUsers.map((u, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-mono">{u.username}</td>
                      <td className="py-2 px-3 font-mono">{u.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-orange-600 mt-2">⚠️ 비밀번호는 지금만 확인 가능합니다. 반드시 저장해두세요.</p>
          </section>
        )}

        {/* Student Profiles */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">등록된 학생 ({profiles.filter(p => p.role === 'student').length}명)</h2>
          <div className="flex flex-wrap gap-2">
            {profiles.filter(p => p.role === 'student').map(p => (
              <span key={p.id} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                {p.username}
              </span>
            ))}
          </div>
        </section>

        {/* All Reservations */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">모든 예약 ({reservations.length}건)</h2>
          {reservations.length === 0 ? (
            <p className="text-gray-400 text-sm">예약 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500">학생</th>
                    <th className="text-left py-2 px-3 text-gray-500">날짜</th>
                    <th className="text-left py-2 px-3 text-gray-500">요일</th>
                    <th className="text-left py-2 px-3 text-gray-500">좌석</th>
                    <th className="text-left py-2 px-3 text-gray-500">시간</th>
                    <th className="text-left py-2 px-3 text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map(r => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{r.profiles?.username || '-'}</td>
                      <td className="py-2 px-3 text-gray-600">{r.date}</td>
                      <td className="py-2 px-3 text-gray-600">{dayLabel(r.day_of_week)}</td>
                      <td className="py-2 px-3 text-gray-600">{r.seat_number}번</td>
                      <td className="py-2 px-3 text-gray-600">{getTimeLabel(r)}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => handleDeleteReservation(r.id)}
                          disabled={deleting === r.id}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          {deleting === r.id ? '삭제 중...' : '삭제'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
