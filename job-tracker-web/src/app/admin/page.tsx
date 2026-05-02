import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, Briefcase, Bell, TrendingUp } from 'lucide-react'
import { subDays, format } from 'date-fns'
import { ApplicationsOverTime } from '@/components/charts/ApplicationsOverTime'
import { PlatformBreakdown } from '@/components/charts/PlatformBreakdown'
import { StatusFunnel } from '@/components/charts/StatusFunnel'

export default async function AdminDashboard() {
  const supabase = await createAdminClient()
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const [
    { count: totalUsers },
    { count: totalApps },
    { count: todayApps },
    { count: pendingReminders },
    { data: allApps },
    { data: allProfiles },
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
    supabase.from('applications')
      .select('applied_at, platform, status, user_id'),
    supabase.from('profiles')
      .select('id, email, full_name, created_at, role'),
  ])

  const apps = allApps ?? []
  const profiles = allProfiles ?? []

  const appDailyCounts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    appDailyCounts[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0
  }
  apps.forEach(a => {
    const day = format(new Date(a.applied_at), 'yyyy-MM-dd')
    if (day in appDailyCounts) appDailyCounts[day]++
  })
  const appsOverTime = Object.entries(appDailyCounts).map(([date, count]) => ({ date, count }))

  const userDailyCounts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    userDailyCounts[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0
  }
  profiles.forEach(p => {
    const day = format(new Date(p.created_at), 'yyyy-MM-dd')
    if (day in userDailyCounts) userDailyCounts[day]++
  })
  const usersOverTime = Object.entries(userDailyCounts).map(([date, count]) => ({ date, count }))

  const platformCounts: Record<string, number> = {}
  apps.forEach(a => { platformCounts[a.platform] = (platformCounts[a.platform] ?? 0) + 1 })
  const platformData = Object.entries(platformCounts).map(([platform, count]) => ({ platform, count }))

  const statusCounts: Record<string, number> = {}
  apps.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1 })
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  const userAppCount: Record<string, number> = {}
  apps.forEach(a => { userAppCount[a.user_id] = (userAppCount[a.user_id] ?? 0) + 1 })
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
  const topUsers = Object.entries(userAppCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ ...profileMap[id], appCount: count }))

  const stats = [
    { label: 'Total users', value: totalUsers ?? 0, icon: Users, color: 'text-violet-400' },
    { label: 'Total applications', value: totalApps ?? 0, icon: Briefcase, color: 'text-emerald-400' },
    { label: 'Applications today', value: todayApps ?? 0, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'Pending reminders', value: pendingReminders ?? 0, icon: Bell, color: 'text-yellow-400' },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Admin</h1>
        <p className="text-zinc-400 mt-1">Platform-wide overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-[#27272a] border-[#3f3f46] transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:shadow-black/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">{label}</p>
                  <p className="text-3xl font-bold text-zinc-50">{value}</p>
                </div>
                <Icon className={`w-8 h-8 opacity-80 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#27272a] border-[#3f3f46]">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Applications per day (all users, 30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsOverTime data={appsOverTime} />
          </CardContent>
        </Card>
        <Card className="bg-[#27272a] border-[#3f3f46]">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">New user signups (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsOverTime data={usersOverTime} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#27272a] border-[#3f3f46]">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Platform breakdown (all users)</CardTitle>
          </CardHeader>
          <CardContent>
            {platformData.length > 0
              ? <PlatformBreakdown data={platformData} />
              : <p className="text-sm text-zinc-500 py-16 text-center">No data yet</p>
            }
          </CardContent>
        </Card>
        <Card className="bg-[#27272a] border-[#3f3f46]">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Status breakdown (all users)</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0
              ? <StatusFunnel data={statusData} />
              : <p className="text-sm text-zinc-500 py-16 text-center">No data yet</p>
            }
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#27272a] border-[#3f3f46]">
        <CardHeader>
          <CardTitle className="text-base text-zinc-100">Top users by applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-[#3f3f46] overflow-hidden rounded-b-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#18181b] hover:bg-[#18181b] border-b border-[#3f3f46]">
                  <TableHead className="text-zinc-400">User</TableHead>
                  <TableHead className="text-zinc-400">Role</TableHead>
                  <TableHead className="text-zinc-400">Applications</TableHead>
                  <TableHead className="text-zinc-400">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((u, i) => (
                  <TableRow key={u.id ?? i} className="border-b border-[#3f3f46] hover:bg-zinc-700/20 transition-colors">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{u.full_name ?? '—'}</p>
                        <p className="text-xs text-zinc-500 font-mono">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role ?? 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-100">{u.appCount}</TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {topUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                      No applications yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <a href="/admin/users" className="text-sm text-violet-400 hover:underline">View all users →</a>
        <a href="/admin/activity" className="text-sm text-violet-400 hover:underline">View activity log →</a>
      </div>
    </div>
  )
}
