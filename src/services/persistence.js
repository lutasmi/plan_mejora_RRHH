import { createClient } from '@supabase/supabase-js'

// Las credenciales se leen de variables de entorno Vite.
// Fallback a string vacío → Supabase falla silenciosamente → se usa localStorage.
// Esto permite trabajar sin .env y sin romper la app.
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

const sb = SUPA_URL && SUPA_KEY ? createClient(SUPA_URL, SUPA_KEY) : null

// v3 para evitar colisión con datos del prototipo anterior (v2)
const SKEY = 'canvas-v3'
const LKEY = 'canvas-local-v3'

// ── Load ──────────────────────────────────────────────────────────────────────
// Intenta Supabase primero. Si falla o no hay credenciales, usa localStorage.
// Devuelve { data, src } donde src es 'cloud' | 'local' | 'none'
export async function load() {
  if (sb) {
    try {
      const { data, error } = await sb
        .from('canvas_data')
        .select('value')
        .eq('key', SKEY)
        .single()

      if (!error && data?.value) {
        const parsed = JSON.parse(data.value)
        try { localStorage.setItem(LKEY, data.value) } catch (_) {}
        return { data: parsed, src: 'cloud' }
      }
    } catch (_) {}
  }

  try {
    const local = localStorage.getItem(LKEY)
    if (local) return { data: JSON.parse(local), src: 'local' }
  } catch (_) {}

  return { data: null, src: 'none' }
}

// ── Save ──────────────────────────────────────────────────────────────────────
// Guarda siempre en localStorage. Intenta también Supabase.
// Devuelve true si guardó en la nube, false si solo local.
export async function save(state) {
  const s = JSON.stringify(state)

  try { localStorage.setItem(LKEY, s) } catch (_) {}

  if (!sb) return false

  try {
    const { error } = await sb
      .from('canvas_data')
      .upsert({ key: SKEY, value: s }, { onConflict: 'key' })
    return !error
  } catch (_) {
    return false
  }
}
