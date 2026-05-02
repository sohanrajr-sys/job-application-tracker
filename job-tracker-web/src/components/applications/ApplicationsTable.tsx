'use client'

import { useEffect, useState } from 'react'
import { Application, ApplicationStatus } from '@/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { AddApplicationDialog } from './AddApplicationDialog'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: 'bg-zinc-700 text-zinc-300',
  applied: 'bg-violet-950 text-violet-300',
  screening: 'bg-amber-950 text-amber-300',
  interview: 'bg-emerald-950 text-emerald-300',
  offer: 'bg-green-950 text-green-300',
  rejected: 'bg-red-950 text-red-300',
  withdrawn: 'bg-zinc-800 text-zinc-500',
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

interface Props {
  applications: Application[]
}

export function ApplicationsTable({ applications: initial }: Props) {
  const [apps, setApps] = useState(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const isMobile = useIsMobile()
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
          className="max-w-xs bg-[#27272a] border-[#3f3f46] text-zinc-100 placeholder:text-zinc-500"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-40 bg-[#27272a] border-[#3f3f46] text-zinc-100">
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

      {isMobile ? (
        /* Card list on mobile */
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center py-12 text-zinc-500 text-sm">No applications yet</p>
          ) : filtered.map(app => (
            <div
              key={app.id}
              className="bg-[#27272a] border border-[#3f3f46] rounded-xl p-4 transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:shadow-black/40"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-zinc-50">{app.company}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', STATUS_COLORS[app.status])}>
                  {app.status}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mb-2">{app.title}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  {app.platform} · {format(new Date(app.applied_at), 'MMM d')}
                </span>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-zinc-700 transition-colors" onClick={() => toggleBookmark(app)}>
                    {app.bookmarked
                      ? <BookmarkCheck className="w-4 h-4 text-yellow-400" />
                      : <Bookmark className="w-4 h-4 text-zinc-500" />}
                  </button>
                  {app.url && (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-zinc-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-zinc-500" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table on desktop */
        <div className="border border-[#3f3f46] rounded-lg overflow-hidden bg-[#27272a]">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#18181b] hover:bg-[#18181b] border-b border-[#3f3f46]">
                <TableHead className="text-zinc-400">Company</TableHead>
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">Platform</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Applied</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                    No applications yet
                  </TableCell>
                </TableRow>
              ) : filtered.map(app => (
                <TableRow
                  key={app.id}
                  className="border-b border-[#3f3f46] hover:bg-zinc-700/20 transition-colors duration-150"
                >
                  <TableCell className="font-medium text-zinc-100">{app.company}</TableCell>
                  <TableCell className="text-zinc-300">{app.title}</TableCell>
                  <TableCell>
                    <span className="text-xs capitalize text-zinc-500">{app.platform}</span>
                  </TableCell>
                  <TableCell>
                    <Select value={app.status} onValueChange={v => v && updateStatus(app.id, v as ApplicationStatus)}>
                      <SelectTrigger className="h-7 text-xs w-32 border-0 p-0 bg-transparent">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[app.status])}>
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
                  <TableCell className="text-sm text-zinc-500">
                    {format(new Date(app.applied_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-zinc-700" onClick={() => toggleBookmark(app)}>
                        {app.bookmarked
                          ? <BookmarkCheck className="w-4 h-4 text-yellow-400" />
                          : <Bookmark className="w-4 h-4 text-zinc-500" />}
                      </Button>
                      {app.url && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-zinc-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-zinc-500" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
