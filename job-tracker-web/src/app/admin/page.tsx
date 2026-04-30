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

  // Apps over time (last 30 days)
  const appDailyCounts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    appDailyCounts[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0
  }
  apps.forEach(a => {
    const day = format(new Date(a.applied_at), 'yyyy-MM-dd')
    if (day in appDailyCounts) appDailyCounts[day]++
  })
  const appsOverTime = Object.entries(appDailyCounts).map(([date, count]) => ({ date, count }))

  // New users over time (last 30 days)
  const userDailyCounts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    userDailyCounts[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0
  }
  profiles.forEach(p => {
    const day = format(new Date(p.created_at), 'yyyy-MM-dd')
    if (day in userDailyCounts) userDailyCounts[day]++
  })
  const usersOverTime = Object.entries(userDailyCounts).map(([date, count]) => ({ date, count }))

  // Platform breakdown (all users)
  const platformCounts: Record<string, number> = {}
  apps.forEach(a => { platformCounts[a.platform] = (platformCounts[a.platform] ?? 0) + 1 })
  const platformData = Object.entries(platformCounts).map(([platform, count]) => ({ platform, count }))

  // Status breakdown (all users)
  const statusCounts: Record<string, number> = {}
  apps.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1 })
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  // Top 10 users by app count
  const userAppCount: Record<string, number> = {}
  apps.forEach(a => { userAppCount[a.user_id] = (userAppCount[a.user_id] ?? 0) + 1 })
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
  const topUsers = Object.entries(userAppCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ ...profileMap[id], appCount: count }))

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
        <p className="text-gray-500 mt-1">Platform-wide overview</p>
      </div>

      {/* Stat cards */}
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

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications per day (all users, 30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsOverTime data={appsOverTime} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New user signups (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsOverTime data={usersOverTime} />
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform breakdown (all users)</CardTitle>
          </CardHeader>
          <CardContent>
            {platformData.length > 0
              ? <PlatformBreakdown data={platformData} />
              : <p className="text-sm text-gray-400 py-16 text-center">No data yet</p>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status breakdown (all users)</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0
              ? <StatusFunnel data={statusData} />
              : <p className="text-sm text-gray-400 py-16 text-center">No data yet</p>
            }
          </CardContent>
        </Card>
      </div>

      {/* Top users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top users by applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t overflow-hidden rounded-b-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((u, i) => (
                  <TableRow key={u.id ?? i}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{u.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-400 font-mono">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role ?? 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{u.appCount}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {topUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400 py-8">
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
        <a href="/admin/users" className="text-sm text-blue-600 hover:underline">View all users →</a>
        <a href="/admin/activity" className="text-sm text-blue-600 hover:underline">View activity log →</a>
      </div>
    </div>
  )
}
