import { createAdminClient } from '@/lib/supabase/server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default async function AdminUsersPage() {
  const supabase = await createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const userIds = (profiles ?? []).map(p => p.id)
  const { data: appCounts } = await supabase
    .from('applications')
    .select('user_id')
    .in('user_id', userIds)

  const countMap: Record<string, number> = {}
  ;(appCounts ?? []).forEach(a => { countMap[a.user_id] = (countMap[a.user_id] ?? 0) + 1 })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Users</h1>
        <p className="text-zinc-400 mt-1">{profiles?.length ?? 0} total</p>
      </div>
      <div className="border border-[#3f3f46] rounded-lg overflow-hidden bg-[#27272a]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#18181b] hover:bg-[#18181b] border-b border-[#3f3f46]">
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Role</TableHead>
              <TableHead className="text-zinc-400">Applications</TableHead>
              <TableHead className="text-zinc-400">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(profiles ?? []).map(p => (
              <TableRow key={p.id} className="border-b border-[#3f3f46] hover:bg-zinc-700/20 transition-colors">
                <TableCell className="font-mono text-sm text-zinc-300">{p.email}</TableCell>
                <TableCell className="text-zinc-100">{p.full_name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={p.role === 'admin' ? 'default' : 'secondary'}>
                    {p.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-100">{countMap[p.id] ?? 0}</TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {format(new Date(p.created_at), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
