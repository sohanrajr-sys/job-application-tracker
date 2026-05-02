import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_done')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_done) redirect('/setup')

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex min-h-screen bg-[#18181b]">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto pb-14 md:pb-0">
        {children}
      </main>
      <MobileBottomNav isAdmin={isAdmin} />
    </div>
  )
}
