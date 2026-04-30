import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Briefcase, Bell, TrendingUp } from 'lucide-react'
import { subDays } from 'date-fns'

export default async function AdminDashboard() {
  const supabase = await createAdminClient()

  const [
    { count: totalUsers },
    { count: totalApps },
    { count: todayApps },
    { count: pendingReminders },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('applications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', subDays(new Date(), 1).toISOString()),
    supabase.from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('sent', false)
      .lte('remind_at', new Date().toISOString()),
  ])

  const stats = [
    { label: 'Total users', value: totalUsers ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Total applications', value: totalApps ?? 0, icon: Briefcase, color: 'text-green-500' },
    { label: 'Applications today', value: todayApps ?? 0, icon: TrendingUp, color: 'text-purple-500' },
    { label: 'Pending reminders', value: pendingReminders ?? 0, icon: Bell, color: 'text-yellow-500' },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-500 mt-1">Platform overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-3xl font-bold">{value}</p>
                </div>
                <Icon className={`w-8 h-8 opacity-80 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-4">
        <a href="/admin/users" className="text-sm text-blue-600 hover:underline">View all users →</a>
        <a href="/admin/activity" className="text-sm text-blue-600 hover:underline">View all activity →</a>
      </div>
    </div>
  )
}
