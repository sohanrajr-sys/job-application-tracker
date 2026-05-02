import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RemindersClient } from '@/components/reminders/RemindersClient'

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: reminders }, { data: profile }, { data: applications }] = await Promise.all([
    supabase
      .from('reminders')
      .select('*, application:applications(company, title)')
      .eq('user_id', user.id)
      .order('remind_at', { ascending: true }),
    supabase.from('profiles').select('email').eq('id', user.id).single(),
    supabase.from('applications').select('id, company, title').eq('user_id', user.id),
  ])

  const emailEnabled = !!process.env.NEXT_PUBLIC_EMAIL_ENABLED

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
        <p className="text-gray-500 mt-1">
          {emailEnabled
            ? 'Email reminders are active'
            : 'Reminders saved — email delivery not configured'}
        </p>
      </div>
      <RemindersClient
        reminders={reminders ?? []}
        applications={applications ?? []}
        userEmail={profile?.email ?? ''}
        emailEnabled={emailEnabled}
      />
    </div>
  )
}
