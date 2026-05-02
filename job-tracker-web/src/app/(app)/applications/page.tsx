import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplicationsTable } from '@/components/applications/ApplicationsTable'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Applications</h1>
        <p className="text-zinc-400 mt-1">{applications?.length ?? 0} total</p>
      </div>
      <ApplicationsTable applications={applications ?? []} />
    </div>
  )
}
