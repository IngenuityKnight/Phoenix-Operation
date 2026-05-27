import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set([
  'https://noahbach.info',
  'https://www.noahbach.info',
  'https://phoenix-operation-rosy.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
])

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://noahbach.info'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// Tables allowed to be written through this endpoint
const ALLOWED_TABLES = new Set([
  'arrivals', 'meals', 'logistics_items',
  'itinerary_items', 'expenses', 'roster', 'house_info', 'ops_feed', 'presence',
  'settlements_paid',
])

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const CORS = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS })
  }

  let body: { action: string; table: string; record_id?: string; payload?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: CORS })
  }

  const { action, table, record_id, payload } = body

  // Validate inputs
  if (!action || !table) {
    return new Response('Missing action or table', { status: 400, headers: CORS })
  }
  if (!['insert', 'update', 'delete'].includes(action)) {
    return new Response('Invalid action', { status: 400, headers: CORS })
  }
  if (!ALLOWED_TABLES.has(table)) {
    return new Response('Table not allowed', { status: 403, headers: CORS })
  }
  if ((action === 'update' || action === 'delete') && !record_id) {
    return new Response('record_id required for update/delete', { status: 400, headers: CORS })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  const userAgent = req.headers.get('user-agent') ?? null

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Write audit entry first (non-blocking on failure — we still proceed with mutation)
  await supabase.from('audit_log').insert({
    ip_address: ip,
    user_agent: userAgent,
    action,
    table_name: table,
    record_id: record_id ?? null,
    payload: payload ?? null,
  })

  // Perform the actual mutation
  let result
  if (action === 'insert') {
    result = await supabase.from(table).insert(payload).select().single()
  } else if (action === 'update') {
    result = await supabase.from(table).update(payload).eq('id', record_id!).select().single()
  } else {
    result = await supabase.from(table).delete().eq('id', record_id!)
  }

  return new Response(JSON.stringify(result), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
