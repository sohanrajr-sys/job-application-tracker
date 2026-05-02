'use client'

import { useState } from 'react'
import { Reminder } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Bell, BellOff, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Props {
  reminders: (Reminder & { application?: { company: string; title: string } | null })[]
  applications: { id: string; company: string; title: string }[]
}

export function RemindersClient({ reminders: initial, applications }: Props) {
  const [reminders, setReminders] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    message: '',
    remind_at: '',
    application_id: 'none',
  })

  async function addReminder(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not logged in'); setLoading(false); return }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        ...form,
        application_id: form.application_id === 'none' ? null : form.application_id,
        user_id: user.id,
        email_to: '',
      })
      .select('*, application:applications(company, title)')
      .single()

    if (error) {
      toast.error('Failed to add reminder')
    } else {
      setReminders(prev => [...prev, data as Reminder])
      setShowForm(false)
      setForm({ title: '', message: '', remind_at: '', application_id: 'none' })
      toast.success('Reminder set')
    }
    setLoading(false)
  }

  async function deleteReminder(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('reminders').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setReminders(prev => prev.filter(r => r.id !== id))
    toast.success('Reminder deleted')
  }

  const upcoming = reminders.filter(r => !r.sent && new Date(r.remind_at) > new Date())
  const past = reminders.filter(r => r.sent || new Date(r.remind_at) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-700">Upcoming ({upcoming.length})</h2>
        <Button size="sm" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> New reminder
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={addReminder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Follow up on application" />
                </div>
                <div className="space-y-2">
                  <Label>Date & time</Label>
                  <Input required type="datetime-local" value={form.remind_at} onChange={e => setForm(f => ({ ...f, remind_at: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Linked application (optional)</Label>
                <Select value={form.application_id} onValueChange={v => setForm(f => ({ ...f, application_id: v ?? 'none' }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {applications.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.company} — {a.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save reminder'}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {upcoming.length === 0 && <p className="text-sm text-gray-400">No upcoming reminders</p>}
        {upcoming.map(r => (
          <Card key={r.id}>
            <CardContent className="py-4 flex items-start justify-between">
              <div className="flex gap-3">
                <Bell className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{r.title}</p>
                  {r.application && (
                    <p className="text-xs text-gray-500">{r.application.company} — {r.application.title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(r.remind_at), 'MMM d, yyyy h:mm a')}</p>
                  {r.message && <p className="text-xs text-gray-600 mt-1">{r.message}</p>}
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteReminder(r.id)}>
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {past.length > 0 && (
        <>
          <h2 className="font-semibold text-gray-500 text-sm">Past ({past.length})</h2>
          <div className="space-y-2 opacity-60">
            {past.map(r => (
              <Card key={r.id}>
                <CardContent className="py-3 flex items-start gap-3">
                  <BellOff className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{r.title}</p>
                    <p className="text-xs text-gray-400">{format(new Date(r.remind_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
