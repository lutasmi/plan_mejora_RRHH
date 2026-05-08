// ── Columnas del canvas ───────────────────────────────────────────────────────
// Los IDs nunca cambian — las tarjetas referencian por ID.
// Label y color de acento (hl) son configurables por el usuario.
// color (fondo) y border se derivan automáticamente de hl.

// ── Derivación de colores ─────────────────────────────────────────────────────
// Dado un color de acento hex, deriva fondo (color) y borde (border)
// mezclando con el fondo base del canvas (#0d1117) a distintas opacidades.
// Garantiza legibilidad sin exposición de parámetros al usuario.

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHex(n) { return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0') }

// Mezcla hl con el bg oscuro del canvas a una opacidad dada
const BG = [13, 17, 23] // #0d1117
function blendWithBg(hl, alpha) {
  const [r, g, b] = hexToRgb(hl)
  return '#' + [r, g, b].map((c, i) => toHex(BG[i] + (c - BG[i]) * alpha)).join('')
}

// color  → fondo de columna: hl al 12% sobre bg oscuro
// border → línea de columna: hl al 32% sobre bg oscuro
export function deriveColumnColors(hl) {
  return {
    hl,
    color:  blendWithBg(hl, 0.12),
    border: blendWithBg(hl, 0.32),
  }
}

// ── Paleta de acentos permitidos ──────────────────────────────────────────────
// 8 colores distintos, todos legibles sobre fondos oscuros.
export const COLUMN_ACCENTS = [
  '#388bfd', // azul
  '#3fb950', // verde
  '#f0883e', // naranja
  '#f85149', // rojo
  '#bc8cff', // morado
  '#79c0ff', // azul claro
  '#e3b341', // amarillo
  '#ff7b72', // coral
]

// ── Columnas base (por defecto, sin configuración de usuario) ─────────────────
export const COLUMNS_DEFAULT = [
  { id: 'pol', label: 'Políticas',         hl: '#388bfd', w: 280 },
  { id: 'pro', label: 'Procesos',          hl: '#3fb950', w: 280 },
  { id: 'sis', label: 'Sistemas',          hl: '#f0883e', w: 280 },
  { id: 'gov', label: 'Gobierno y Control',hl: '#f85149', w: 280 },
]

// COLUMNS sigue exportado para compatibilidad con código existente que no necesita
// configuración dinámica (statuses, etc.) — devuelve columnas con colores derivados.
export const COLUMNS = COLUMNS_DEFAULT.map(c => ({ ...c, ...deriveColumnColors(c.hl) }))

// ── resolveColumns ────────────────────────────────────────────────────────────
// Merge defaults + overrides del estado persistido.
// colConfigs shape: { pol: { label?: string, hl?: string }, ... }
// Devuelve array completo con color y border derivados.
export function resolveColumns(colConfigs = {}, colWidths = {}) {
  return COLUMNS_DEFAULT.map(def => {
    const override = colConfigs?.[def.id] ?? {}
    const hl       = override.hl    ?? def.hl
    const label    = override.label ?? def.label
    const w        = colWidths?.[def.id] ?? def.w
    return { id: def.id, label, w, ...deriveColumnColors(hl) }
  })
}
