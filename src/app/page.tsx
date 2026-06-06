import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReservationBoard from '@/components/ReservationBoard'
import LogoutButton from '@/components/LogoutButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const username = profile?.username || user.email?.split('@')[0] || '사용자'
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">스터디카페 예약</h1>
            <p className="text-xs text-gray-500">{username}님</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <a
                href="/admin"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                관리자
              </a>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <ReservationBoard userId={user.id} username={username} isAdmin={isAdmin} />
      </main>
    </div>
  )
}
