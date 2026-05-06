import { COLUMNS } from './constants/columns'
import { DEFAULT_ROWS } from './constants/rows'
import Canvas from './components/Canvas/Canvas'

// Commit 01: scaffold visible.
// App muestra el canvas vacío con la estructura base correcta.
// Sin estado, sin persistencia, sin tarjetas — eso llega en commit 02.

export default function App() {
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
      </div>

      {/* Canvas con la estructura base */}
      <Canvas
        columns={COLUMNS}
        rows={DEFAULT_ROWS}
        canEdit={false}
      />

    </div>
  )
}
