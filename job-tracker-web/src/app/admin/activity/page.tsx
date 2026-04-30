import { createAdminClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default async function AdminActivityPage() {
  const supabase = await createAdminClient()

  const { data: events } = await supabase
    .from('application_events')
    .select(`
      *,
      application:applications(company, title),
      profile:profiles(email)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const EVENT_COLORS: Record<string, string> = {
    created: 'bg-green-100 text-green-700',
    status_changed: 'bg-blue-100 text-blue-700',
    bookmarked: 'bg-yellow-100 text-yellow-700',
    note_added: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity log</h1>
        <p className="text-gray-500 mt-1">Last 200 events</p>
      </div>
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>User</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(events ?? []).map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs font-mono text-gray-500">
                  {(e as any).profile?.email ?? '—'}
                </TableCell>
                <TableCell className="text-sm">
                  {(e as any).application
                    ? `${(e as any).application.company} — ${(e as any).application.title}`
                    : '—'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_COLORS[e.event_type] ?? ''}`}>
                    {e.event_type}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {e.old_value && e.new_value ? `${e.old_value} → ${e.new_value}` : e.new_value ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-gray-400">
                  {format(new Date(e.created_at), 'MMM d, HH:mm')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
