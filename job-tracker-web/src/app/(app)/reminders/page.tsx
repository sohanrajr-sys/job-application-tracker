import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RemindersClient } from '@/components/reminders/RemindersClient'

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: reminders }, { data: applications }] = await Promise.all([
    supabase
      .from('reminders')
      .select('*, application:applications(company, title)')
      .eq('user_id', user.id)
      .order('remind_at', { ascending: true }),
    supabase.from('applications').select('id, company, title').eq('user_id', user.id),
  ])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <p className="text-gray-500 mt-1">Set reminders for follow-ups and interviews</p>
      </div>
      <RemindersClient
        reminders={reminders ?? []}
        applications={applications ?? []}
      />
    </div>
  )
}
