// ── CSV export / import de tarjetas ──────────────────────────────────────────
//
// Formato: una fila por tarjeta, columnas fijas.
// Los campos multi-valor (tagIds, deps) se serializan con "|" como separador.
// Los campos de texto se encierran en comillas dobles; las comillas internas
// se escapan duplicándolas (""), que es el estándar RFC 4180.

const SEP = ','

// ── Export ────────────────────────────────────────────────────────────────────

const HEADERS = [
  'id','nombre','descripcion','url',
  'columna_id','fila_id','owner_id',
  'status','bloqueado','bloqueo_desc','bloqueo_area','bloqueo_fecha',
  'quarter','tag_ids','dep_ids','offsetX','offsetY',
]

function esc(v) {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(SEP) || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

// exportCSV(cards, columns)
// columns: array resuelto de resolveColumns() — se usa para añadir
// columna_label al CSV (informativo, el import usa columna_id como clave).
export function exportCSV(cards, columns = []) {
  const colById = Object.fromEntries(columns.map(c => [c.id, c]))
  const rows = [HEADERS.join(SEP)]
  for (const c of cards) {
    rows.push([
      c.id,
      c.name,
      c.desc,
      c.url,
      c.columnId ?? '',
      c.rowId    ?? '',
      c.ownerId  ?? '',
      c.status,
      c.blocker?.active ? '1' : '0',
      c.blocker?.description ?? '',
      c.blocker?.area        ?? '',
      c.blocker?.date        ?? '',
      c.quarter ?? '',
      (c.tagIds ?? []).join('|'),
      (c.deps   ?? []).join('|'),
      String(Math.round(c.offsetX ?? 20)),
      String(Math.round(c.offsetY ?? 20)),
    ].map(esc).join(SEP))
  }
  return rows.join('\n')
}

export function downloadCSV(cards, columns = [], filename = 'canvas-rrhh.csv') {
  const content = exportCSV(cards, columns)
  const blob    = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href        = url
  a.download    = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Import ────────────────────────────────────────────────────────────────────
// Parseo RFC 4180 mínimo: soporta comillas con escape doble.

function parseCSVLine(line) {
  const fields = []
  let i = 0, field = '', inQ = false
  while (i < line.length) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i += 2; continue }
        inQ = false; i++; continue
      }
      field += ch; i++
    } else {
      if (ch === '"') { inQ = true; i++; continue }
      if (ch === SEP) { fields.push(field); field = ''; i++; continue }
      field += ch; i++
    }
  }
  fields.push(field)
  return fields
}

// Devuelve { cards, errors }
// cards: tarjetas válidas listas para merge en el estado
// errors: array de strings con problemas encontrados (filas ignoradas)
export function importCSV(text, { reuseIds = false } = {}) {
  const lines  = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  if (lines.length < 2) return { cards: [], errors: ['El archivo está vacío o solo tiene cabecera'] }

  const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const idx    = Object.fromEntries(header.map((h, i) => [h, i]))

  const get = (row, key) => row[idx[key]] ?? ''

  const valid  = HEADERS.every(h => idx[h] !== undefined)
  if (!valid) {
    const missing = HEADERS.filter(h => idx[h] === undefined)
    return { cards: [], errors: [`Cabecera inválida. Faltan columnas: ${missing.join(', ')}`] }
  }

  const cards  = []
  const errors = []

  for (let li = 1; li < lines.length; li++) {
    const row  = parseCSVLine(lines[li])
    const name = get(row, 'nombre').trim()
    if (!name) { errors.push(`Fila ${li + 1}: nombre vacío — ignorada`); continue }

    // Lee offsetX/offsetY; acepta también x/y de CSVs exportados antes de este cambio
    const offsetX = parseFloat(get(row, 'offsetX') || get(row, 'x')) || 20
    const offsetY = parseFloat(get(row, 'offsetY') || get(row, 'y')) || 20

    const tagIds = get(row, 'tag_ids').split('|').map(s => s.trim()).filter(Boolean)
    const deps   = get(row, 'dep_ids').split('|').map(s => s.trim()).filter(Boolean)

    const STATUS_IDS = ['no_iniciado','en_ejecucion','bloqueado','completado']
    const statusRaw  = get(row, 'status').trim()
    const status     = STATUS_IDS.includes(statusRaw) ? statusRaw : 'no_iniciado'

    cards.push({
      id:       reuseIds && get(row, 'id').trim() ? get(row, 'id').trim() : undefined, // App asignará uid
      name,
      desc:     get(row, 'descripcion'),
      url:      get(row, 'url'),
      columnId: get(row, 'columna_id')  || null,
      rowId:    get(row, 'fila_id')     || null,
      ownerId:  get(row, 'owner_id')    || 'o1',
      status,
      blocker: {
        active:      get(row, 'bloqueado') === '1',
        description: get(row, 'bloqueo_desc'),
        area:        get(row, 'bloqueo_area'),
        date:        get(row, 'bloqueo_fecha'),
      },
      quarter:  get(row, 'quarter'),
      tagIds,
      deps,
      offsetX, offsetY,
    })
  }

  return { cards, errors }
}
