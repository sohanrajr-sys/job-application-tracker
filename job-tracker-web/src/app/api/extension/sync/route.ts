import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ExtensionSyncPayload } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Chrome extension background service workers bypass CORS via host_permissions.
// Restrict CORS to the app origin — blocks arbitrary websites from using stolen tokens.
const CORS_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? 'https://application-tracker.vercel.app'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Vary': 'Origin',
}

const FIELD_MAX = { company: 200, title: 200, url: 2000, platform: 50 } as const

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401, headers: CORS_HEADERS })
  }

  const token = auth.slice(7)

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(token)) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 401, headers: CORS_HEADERS })
  }

  const { data: userId, error: tokenError } = await supabase.rpc('get_user_by_extension_token', { token })
  if (tokenError || !userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS })
  }

  let body: ExtensionSyncPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS_HEADERS })
  }

  const { company, title, url, platform, applied_at, status, bookmarked } = body

  if (!company || !title) {
    return NextResponse.json({ error: 'company and title required' }, { status: 400, headers: CORS_HEADERS })
  }

  // Field length limits — prevent oversized payloads reaching the DB
  if (company.length > FIELD_MAX.company) {
    return NextResponse.json({ error: `company must be ≤${FIELD_MAX.company} chars` }, { status: 400, headers: CORS_HEADERS })
  }
  if (title.length > FIELD_MAX.title) {
    return NextResponse.json({ error: `title must be ≤${FIELD_MAX.title} chars` }, { status: 400, headers: CORS_HEADERS })
  }
  if (url && url.length > FIELD_MAX.url) {
    return NextResponse.json({ error: `url must be ≤${FIELD_MAX.url} chars` }, { status: 400, headers: CORS_HEADERS })
  }
  if (platform && platform.length > FIELD_MAX.platform) {
    return NextResponse.json({ error: `platform must be ≤${FIELD_MAX.platform} chars` }, { status: 400, headers: CORS_HEADERS })
  }

  // Sanitize applied_at — reject future dates and anything before 2000
  const now = new Date()
  let resolvedAppliedAt: string
  if (applied_at) {
    const d = new Date(applied_at)
    if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d > now) {
      resolvedAppliedAt = now.toISOString()
    } else {
      resolvedAppliedAt = d.toISOString()
    }
  } else {
    resolvedAppliedAt = now.toISOString()
  }

  const VALID_STATUSES = ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn', 'saved']
  const resolvedStatus = status && VALID_STATUSES.includes(status) ? status : 'applied'

  const { data, error } = await supabase
    .from('applications')
    .upsert(
      {
        user_id: userId,
        company: company.trim(),
        title: title.trim(),
        url: url ?? null,
        platform: platform ?? 'other',
        applied_at: resolvedAppliedAt,
        source: 'extension',
        status: resolvedStatus,
        bookmarked: bookmarked ?? false,
      },
      { onConflict: 'user_id,url,title', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }

  return NextResponse.json({ id: data.id, ok: true }, { headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
