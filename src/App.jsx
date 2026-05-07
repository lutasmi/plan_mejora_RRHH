import { useState } from 'react'
import { COLUMNS } from './constants/columns'
import { useCanvas } from './hooks/useCanvas'
import Canvas from './components/Canvas/Canvas'
import { createCard } from './models/card'

export default function App() {
  const { state, mut, loading, saved, saveOk } = useCanvas()
  const [selCard, setSelCard] = useState(null)
  const [hlCard,  setHlCard]  = useState(null)

  const columns = COLUMNS.map(c => ({ ...c, w: state?.colWidths?.[c.id] ?? c.w }))

  const getRelated = id => {
    if (!id || !state) return new Set()
    const s = new Set([id])
    const card = state.cards.find(c => c.id === id)
    if (!card) return s
    ;(card.deps ?? []).forEach(d => s.add(d))
    state.cards.forEach(c => { if ((c.deps ?? []).includes(id)) s.add(c.id) })
    return s
  }
  const related = getRelated(hlCard)

  const handleColumnResize = (id, w) => mut(d => { d.colWidths[id] = w })
  const handleRowResize    = (id, h) => mut(d => { const r = d.rows.find(r => r.id === id); if (r) r.h = h })

  const handleAddCard = (x, y, columnId, rowId) => {
    // ── DIAGNÓSTICO 3: ¿createCard devuelve los valores correctos? ──────────
    const card = createCard({ x, y, columnId, rowId })
    console.log('[DIAG-3] createCard →', {
      id: card.id, x: card.x, y: card.y,
      columnId: card.columnId, rowId: card.rowId,
      name: card.name, status: card.status,
    })

    // ── DIAGNÓSTICO 2: ¿el array cards tiene la tarjeta después de mut? ─────
    mut(d => {
      console.log('[DIAG-2] state.cards ANTES de push:', Array.isArray(d.cards), d.cards?.length)
      if (!Array.isArray(d.cards)) {
        console.error('[DIAG-2] ¡d.cards NO es array!', typeof d.cards, d.cards)
        d.cards = []   // reparar en caliente para no romper el flujo
      }
      d.cards.push(card)
      console.log('[DIAG-2] state.cards DESPUÉS de push:', d.cards.length)
    })

    setSelCard(card.id)
  }

  const handleMoveCard   = (id, x, y) => mut(d => { const c = d.cards.find(c => c.id === id); if (c) { c.x = x; c.y = y } })
  const handleSelectCard = id => { setSelCard(id); if (!id) setHlCard(null) }
  const handleHlCard     = id => setHlCard(prev => prev === id ? null : id)

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0d1117' }}>
      <div style={{ fontSize:11, color:'#484f58', letterSpacing:'3px' }}>CARGANDO…</div>
    </div>
  )

  // ── DIAGNÓSTICO 1: ¿qué tiene localStorage en este momento? ──────────────
  try {
    const raw = localStorage.getItem('canvas-local-v3')
    const parsed = raw ? JSON.parse(raw) : null
    console.log('[DIAG-1] localStorage canvas-local-v3 →',
      parsed
        ? { cards: parsed.cards?.length, rows: parsed.rows?.length, hasCardsProp: 'cards' in parsed }
        : 'null/vacío'
    )
  } catch(e) {
    console.error('[DIAG-1] localStorage parse error:', e.message)
  }

  // ── DIAGNÓSTICO 4: ¿Canvas recibe cards? ─────────────────────────────────
  console.log('[DIAG-4] App render → state.cards:', Array.isArray(state.cards), state.cards?.length, state.cards)

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ background:'#161b22', borderBottom:'1px solid #21262d', padding:'7px 14px', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
        <div>
          <div style={{ fontSize:8, letterSpacing:'4px', color:'#388bfd', marginBottom:1 }}>RRHH · CANVAS</div>
          <div style={{ fontSize:15, fontWeight:700, color:'#e6edf3', lineHeight:1 }}>
            Mapa de Transformación <span style={{ fontSize:9, color:'#30363d', fontWeight:400 }}>v0.1</span>
          </div>
        </div>
        <span style={{ fontSize:8, padding:'2px 8px', borderRadius:20, background:'#23863622', color:'#3fb950', border:'1px solid #23863655', fontWeight:700, marginLeft:4 }}>
          EDITOR
        </span>
        {/* Contador de tarjetas en estado */}
        <span style={{ fontSize:9, padding:'1px 6px', borderRadius:10, background:'#21262d', color:'#8b949e', fontFamily:'monospace' }}>
          cards: {state.cards?.length ?? '?'}
        </span>
        <span style={{ fontSize:9, marginLeft:'auto', color: saved ? (saveOk ? '#3fb950' : '#f0883e') : '#f0883e' }}>
          {saved ? (saveOk ? '☁ guardado' : '⚠ solo local') : '⏳ guardando…'}
        </span>
      </div>

      <Canvas
        columns={columns}
        rows={state.rows}
        cards={state.cards}
        owners={state.owners}
        tags={state.tags}
        canEdit={true}
        selCard={selCard}
        hlCard={hlCard}
        related={related}
        onSelectCard={handleSelectCard}
        onHlCard={handleHlCard}
        onMoveCard={handleMoveCard}
        onAddCard={handleAddCard}
        onColumnResize={handleColumnResize}
        onRowResize={handleRowResize}
      />
    </div>
  )
}
