'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, RefreshCw, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  token: string
  userId: string
}

export default function ExtensionTokenCard({ token: initialToken, userId }: Props) {
  const [token, setToken] = useState(initialToken)
  const [copied, setCopied] = useState(false)
  const [rotating, setRotating] = useState(false)

  async function copyToken() {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    toast.success('Token copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function rotateToken() {
    setRotating(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('rotate_extension_token', { user_id: userId })
    if (error || !data) {
      // fallback: generate UUID client side and update
      const newToken = crypto.randomUUID()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ extension_token: newToken })
        .eq('id', userId)
      if (updateError) {
        toast.error('Failed to rotate token')
      } else {
        setToken(newToken)
        toast.success('Token rotated — update your extension')
      }
    } else {
      setToken(data)
      toast.success('Token rotated — update your extension')
    }
    setRotating(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Extension token</CardTitle>
        <CardDescription>Paste this in your Chrome extension to link your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input value={token} readOnly className="font-mono text-xs" />
          <Button size="icon" variant="outline" onClick={copyToken}>
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-gray-500" onClick={rotateToken} disabled={rotating}>
          <RefreshCw className={`w-3 h-3 mr-1 ${rotating ? 'animate-spin' : ''}`} />
          Rotate token
        </Button>
      </CardContent>
    </Card>
  )
}
