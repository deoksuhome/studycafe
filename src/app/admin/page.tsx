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

  // Fetch all reservations with profile info
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, profiles(username)')
    .order('date', { ascending: true })
    .order('start_slot', { ascending: true })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('username')

  return <AdminDashboard reservations={reservations || []} profiles={profiles || []} />
}
