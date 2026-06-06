import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  let query = supabase.from('reservations').select('*')
  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json()
  const { seat_number, date, day_of_week, start_slot, end_slot } = body

  // Validate
  if (!seat_number || !date || !day_of_week || start_slot === undefined || end_slot === undefined) {
    return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
  }

  if (start_slot > end_slot) {
    return NextResponse.json({ error: '시작 시간이 종료 시간보다 늦을 수 없습니다.' }, { status: 400 })
  }

  // Check if user already has reservation for this day
  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  if (existing) {
    return NextResponse.json({ error: '이미 해당 날짜에 예약이 있습니다.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      user_id: user.id,
      seat_number,
      date,
      day_of_week,
      start_slot,
      end_slot,
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes('already reserved')) {
      return NextResponse.json({ error: '해당 좌석은 이미 예약되었습니다.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: '예약 ID가 필요합니다.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
