'use client'

import { useState } from 'react'
import { Application, ApplicationStatus } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { AddApplicationDialog } from './AddApplicationDialog'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: 'bg-gray-100 text-gray-700',
  applied: 'bg-blue-100 text-blue-700',
  screening: 'bg-yellow-100 text-yellow-700',
  interview: 'bg-purple-100 text-purple-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-500',
}

interface Props {
  applications: Application[]
}

export function ApplicationsTable({ applications: initial }: Props) {
  const [apps, setApps] = useState(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  const filtered = apps.filter(a => {
    const matchSearch = !search ||
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  async function toggleBookmark(app: Application) {
    const supabase = createClient()
    const { error } = await supabase
      .from('applications')
      .update({ bookmarked: !app.bookmarked })
      .eq('id', app.id)
    if (error) { toast.error('Failed to update bookmark'); return }
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, bookmarked: !a.bookmarked } : a))
  }

  async function updateStatus(id: string, status: ApplicationStatus) {
    const supabase = createClient()
    const { error } = await supabase.from('applications').update({ status }).eq('id', id)
    if (error) { toast.error('Failed to update status'); return }
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    toast.success('Status updated')
  }

  function onAdded(app: Application) {
    setApps(prev => [app, ...prev])
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <Input
          placeholder="Search company or role..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(['saved','applied','screening','interview','offer','rejected','withdrawn'] as ApplicationStatus[]).map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AddApplicationDialog onAdded={onAdded} />
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  No applications yet
                </TableCell>
              </TableRow>
            ) : filtered.map(app => (
              <TableRow key={app.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{app.company}</TableCell>
                <TableCell>{app.title}</TableCell>
                <TableCell>
                  <span className="text-xs capitalize text-gray-500">{app.platform}</span>
                </TableCell>
                <TableCell>
                  <Select value={app.status} onValueChange={v => v && updateStatus(app.id, v as ApplicationStatus)}>
                    <SelectTrigger className="h-7 text-xs w-32 border-0 p-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                        {app.status}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {(['saved','applied','screening','interview','offer','rejected','withdrawn'] as ApplicationStatus[]).map(s => (
                        <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(app.applied_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleBookmark(app)}>
                      {app.bookmarked
                        ? <BookmarkCheck className="w-4 h-4 text-yellow-500" />
                        : <Bookmark className="w-4 h-4 text-gray-400" />}
                    </Button>
                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-gray-100"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
