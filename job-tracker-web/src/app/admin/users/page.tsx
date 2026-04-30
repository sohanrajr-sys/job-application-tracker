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
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">{profiles?.length ?? 0} total</p>
      </div>
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(profiles ?? []).map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.email}</TableCell>
                <TableCell>{p.full_name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={p.role === 'admin' ? 'default' : 'secondary'}>
                    {p.role}
                  </Badge>
                </TableCell>
                <TableCell>{countMap[p.id] ?? 0}</TableCell>
                <TableCell className="text-sm text-gray-500">
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
