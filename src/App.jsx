import { COLUMNS } from './constants/columns'
import { useCanvas } from './hooks/useCanvas'
import Canvas from './components/Canvas/Canvas'
import { createCard } from './models/card'
import { getPillarX, getRowY, CARD_W, CARD_PADDING } from './utils/layout'

// Commit 02: modelo de datos + persistencia.
// App usa useCanvas() para cargar/guardar estado real.
// Canvas recibe filas y anchos de columna desde el estado persistido.

export default function App() {
  const { state, mut, loading, saved, saveOk } = useCanvas()

  // ── Columnas: fijas en constantes + anchos persistibles en estado
  const columns = COLUMNS.map(c => ({
    ...c,
    w: state?.colWidths?.[c.id] ?? c.w,
  }))

  // ── Handlers de canvas
  const handleColumnResize = (id, w) =>
    mut(d => { d.colWidths[id] = w })

  const handleRowResize = (id, h) =>
    mut(d => { const r = d.rows.find(r => r.id === id); if (r) r.h = h })

  const handleAddCard = (x, y, columnId, rowId) => {
    const card = createCard({ x, y, columnId, rowId })
    mut(d => d.cards.push(card))
  }

  // ── Pantalla de carga
  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 12,
      background: '#0d1117',
    }}>
      <div style={{ fontSize: 11, color: '#484f58', letterSpacing: '3px' }}>
        CARGANDO…
      </div>
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header mínimo — se sustituye en commit 06 */}
      <div style={{
        background: '#161b22',
        borderBottom: '1px solid #21262d',
        padding: '7px 14px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '4px', color: '#388bfd', marginBottom: 1 }}>
            RRHH · CANVAS
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3', lineHeight: 1 }}>
            Mapa de Transformación{' '}
            <span style={{ fontSize: 9, color: '#30363d', fontWeight: 400 }}>v0.1</span>
          </div>
        </div>
        <span style={{
          fontSize: 8, padding: '2px 8px', borderRadius: 20,
          background: '#1f6feb22', color: '#1f6feb',
          border: '1px solid #1f6feb55', fontWeight: 700,
          marginLeft: 4,
        }}>
          PÚBLICO
        </span>
        {/* Indicador de guardado — visible mientras no hay header real */}
        <span style={{
          fontSize: 9, marginLeft: 'auto', color:
            saved ? (saveOk ? '#3fb950' : '#f0883e') : '#f0883e',
        }}>
          {saved ? (saveOk ? '☁ guardado' : '⚠ solo local') : '⏳ guardando…'}
        </span>
      </div>

      <Canvas
        columns={columns}
        rows={state.rows}
        canEdit={true}
        onAddCard={handleAddCard}
        onColumnResize={handleColumnResize}
        onRowResize={handleRowResize}
      />

    </div>
  )
}
