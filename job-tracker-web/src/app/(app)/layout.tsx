import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_done')
    .eq('id', user.id)
    .single()

  // First-time users go through extension setup before anything else
  if (!profile?.onboarding_done) redirect('/setup')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={profile?.role === 'admin'} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
