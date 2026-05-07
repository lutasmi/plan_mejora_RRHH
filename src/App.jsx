import { useState } from 'react'
import { COLUMNS } from './constants/columns'
import { useCanvas } from './hooks/useCanvas'
import Canvas from './components/Canvas/Canvas'
import { createCard } from './models/card'
import { getRelated } from './utils/graph'

export default function App() {
  const { state, mut, loading, saved, saveOk } = useCanvas()
  const [selCard, setSelCard] = useState(null)
  const [hlCard,  setHlCard]  = useState(null)

  const columns = COLUMNS.map(c => ({ ...c, w: state?.colWidths?.[c.id] ?? c.w }))

  // BFS completo upstream + downstream (commit 04)
  const related = getRelated(hlCard, state?.cards ?? [])

  const handleColumnResize = (id, w) => mut(d => { d.colWidths[id] = w })
  const handleRowResize    = (id, h) => mut(d => { const r = d.rows.find(r => r.id === id); if (r) r.h = h })

  const handleAddCard = (x, y, columnId, rowId) => {
    const card = createCard({ x, y, columnId, rowId })
    mut(d => { d.cards.push(card) })
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

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header provisional — se sustituye en commit 06 */}
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
