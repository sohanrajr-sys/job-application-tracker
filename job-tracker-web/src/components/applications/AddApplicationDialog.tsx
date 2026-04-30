'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Application, ApplicationStatus } from '@/types'

interface Props {
  onAdded: (app: Application) => void
}

export function AddApplicationDialog({ onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    company: '', title: '', url: '', platform: 'other', status: 'applied' as ApplicationStatus
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setLoading(false); return }

    const { data, error } = await supabase
      .from('applications')
      .insert({ ...form, user_id: user.id, source: 'manual' })
      .select()
      .single()

    if (error) {
      toast.error('Failed to add application')
    } else {
      toast.success('Application added')
      onAdded(data as Application)
      setOpen(false)
      setForm({ company: '', title: '', url: '', platform: 'other', status: 'applied' })
    }
    setLoading(false)
  }

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" /> Add manually
      </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role title</Label>
              <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Job URL</Label>
            <Input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Input value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ApplicationStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['saved','applied','screening','interview','offer','rejected','withdrawn'] as ApplicationStatus[]).map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add application'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
