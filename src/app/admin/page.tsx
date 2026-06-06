import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const [{ data: reservations }, { data: profiles }] = await Promise.all([
    supabase.from('reservations').select('*').order('date', { ascending: true }).order('start_slot', { ascending: true }),
    supabase.from('profiles').select('*').order('username'),
  ])

  // attach username to each reservation
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]))
  const reservationsWithProfile = (reservations || []).map(r => ({
    ...r,
    profiles: profileMap[r.user_id] || null,
  }))

  return <AdminDashboard reservations={reservationsWithProfile} profiles={profiles || []} />
}
