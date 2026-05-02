import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApplicationsOverTime } from '@/components/charts/ApplicationsOverTime'
import { PlatformBreakdown } from '@/components/charts/PlatformBreakdown'
import { StatusFunnel } from '@/components/charts/StatusFunnel'
import { Briefcase, TrendingUp, Bookmark, Clock } from 'lucide-react'
import { subDays, format } from 'date-fns'
import ExtensionTokenCard from '@/components/layout/ExtensionTokenCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

  const [
    { data: applications },
    { data: profile },
    { data: recentApps },
  ] = await Promise.all([
    supabase.from('applications').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('applications')
      .select('*')
      .eq('user_id', user.id)
      .gte('applied_at', thirtyDaysAgo)
      .order('applied_at', { ascending: true }),
  ])

  const apps = applications ?? []

  const total = apps.length
  const bookmarked = apps.filter(a => a.bookmarked).length
  const thisWeek = apps.filter(a => new Date(a.applied_at) > subDays(new Date(), 7)).length
  const interviews = apps.filter(a => a.status === 'interview').length

  const dailyCounts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    dailyCounts[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0
  }
  ;(recentApps ?? []).forEach(a => {
    const day = format(new Date(a.applied_at), 'yyyy-MM-dd')
    if (day in dailyCounts) dailyCounts[day]++
  })
  const timeData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))

  const platformCounts: Record<string, number> = {}
  apps.forEach(a => { platformCounts[a.platform] = (platformCounts[a.platform] ?? 0) + 1 })
  const platformData = Object.entries(platformCounts).map(([platform, count]) => ({ platform, count }))

  const statusCounts: Record<string, number> = {}
  apps.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1 })
  const statusData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-zinc-400 mt-1">Here&apos;s your job search overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applied', value: total, icon: Briefcase, color: 'text-violet-400' },
          { label: 'This Week', value: thisWeek, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Interviews', value: interviews, icon: Clock, color: 'text-amber-400' },
          { label: 'Bookmarked', value: bookmarked, icon: Bookmark, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card
            key={label}
            className="bg-[#27272a] border-[#3f3f46] transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:shadow-black/40"
          >
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
            <CardTitle className="text-base text-zinc-100">Applications over 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationsOverTime data={timeData} />
          </CardContent>
        </Card>
        <Card className="bg-[#27272a] border-[#3f3f46]">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">By platform</CardTitle>
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
            <CardTitle className="text-base text-zinc-100">Status breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0
              ? <StatusFunnel data={statusData} />
              : <p className="text-sm text-zinc-500 py-16 text-center">No data yet</p>
            }
          </CardContent>
        </Card>
        <ExtensionTokenCard token={profile?.extension_token ?? ''} userId={user.id} />
      </div>
    </div>
  )
}
