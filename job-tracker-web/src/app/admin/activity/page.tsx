import { createAdminClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

const EVENT_COLORS: Record<string, string> = {
  created: 'bg-emerald-950 text-emerald-300',
  status_changed: 'bg-violet-950 text-violet-300',
  bookmarked: 'bg-amber-950 text-amber-300',
  note_added: 'bg-zinc-700 text-zinc-300',
}

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

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Activity log</h1>
        <p className="text-zinc-400 mt-1">Last 200 events</p>
      </div>
      <div className="border border-[#3f3f46] rounded-lg overflow-hidden bg-[#27272a]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#18181b] hover:bg-[#18181b] border-b border-[#3f3f46]">
              <TableHead className="text-zinc-400">User</TableHead>
              <TableHead className="text-zinc-400">Application</TableHead>
              <TableHead className="text-zinc-400">Event</TableHead>
              <TableHead className="text-zinc-400">Change</TableHead>
              <TableHead className="text-zinc-400">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(events ?? []).map(e => (
              <TableRow key={e.id} className="border-b border-[#3f3f46] hover:bg-zinc-700/20 transition-colors">
                <TableCell className="text-xs font-mono text-zinc-500">
                  {(e as any).profile?.email ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-zinc-300">
                  {(e as any).application
                    ? `${(e as any).application.company} — ${(e as any).application.title}`
                    : '—'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_COLORS[e.event_type] ?? 'bg-zinc-700 text-zinc-300'}`}>
                    {e.event_type}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-zinc-500">
                  {e.old_value && e.new_value ? `${e.old_value} → ${e.new_value}` : e.new_value ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-zinc-500">
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
