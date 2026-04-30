import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ExtensionSyncPayload } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

  const token = auth.slice(7)

  // Validate UUID format
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(token)) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
  }

  const { data: userId, error: tokenError } = await supabase.rpc('get_user_by_extension_token', { token })
  if (tokenError || !userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  let body: ExtensionSyncPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { company, title, url, platform, applied_at, status, bookmarked } = body
  if (!company || !title) {
    return NextResponse.json({ error: 'company and title required' }, { status: 400 })
  }

  const VALID_STATUSES = ['applied','screening','interview','offer','rejected','withdrawn','saved']
  const resolvedStatus = status && VALID_STATUSES.includes(status) ? status : 'applied'

  const { data, error } = await supabase
    .from('applications')
    .upsert(
      {
        user_id: userId, company, title, url, platform,
        applied_at: applied_at ?? new Date().toISOString(),
        source: 'extension',
        status: resolvedStatus,
        bookmarked: bookmarked ?? false,
      },
      { onConflict: 'user_id,url,title', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, ok: true }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
