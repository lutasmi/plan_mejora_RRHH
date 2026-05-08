import { useState } from 'react'
import { STATUSES } from '../../constants/statuses'

export default function Header({
  mode, onEnterEditor, onExitEditor,
  filters, onToggle, onClear,
  owners, tags,
  saved, saveOk,
  onOpenSettings,
}) {
  const [filterOpen, setFilterOpen] = useState(false)
  const isEditor   = mode === 'editor'
  const filterCount = filters.statuses.length + filters.ownerIds.length + filters.tagIds.length

  const pill = (active, color) => ({
    fontSize: 9, padding: '3px 9px', borderRadius: 10, fontWeight: 600,
    cursor: 'pointer', border: `1px solid ${active ? color + '88' : '#30363d'}`,
    background: active ? color + '28' : 'transparent',
    color: active ? color : '#6e7681', whiteSpace: 'nowrap', flexShrink: 0,
  })

  const saveColor = saved ? (saveOk ? '#3fb950' : '#f0883e') : '#f0883e'
  const saveLabel = saved ? (saveOk ? '☁ guardado' : '⚠ solo local') : '⏳ guardando…'

  return (
    <div style={{ background: '#161b22', borderBottom: '1px solid #21262d', flexShrink: 0 }}>
      {/* Fila 1 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px' }}>
        {/* Logo */}
        <div>
          <div style={{ fontSize: 8, letterSpacing: '4px', color: '#388bfd', marginBottom: 1 }}>RRHH · CANVAS</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', lineHeight: 1 }}>Mapa de Transformación</div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Filtros */}
        <button
          onClick={() => setFilterOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: filterOpen ? '#21262d' : 'transparent',
            border: `1px solid ${filterCount > 0 ? '#388bfd55' : '#30363d'}`,
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
            color: filterCount > 0 ? '#388bfd' : '#6e7681', fontSize: 11,
          }}
        >
          <span>Filtros</span>
          {filterCount > 0 && (
            <span style={{ background: '#388bfd', color: '#0d1117', borderRadius: '50%',
              width: 16, height: 16, fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {filterCount}
            </span>
          )}
          <span style={{ fontSize: 8 }}>{filterOpen ? '▲' : '▼'}</span>
        </button>

        {/* Settings (solo editor) */}
        {isEditor && (
          <button
            onClick={onOpenSettings}
            title="Configuración"
            style={{
              background: 'none', border: '1px solid #30363d',
              borderRadius: 6, padding: '4px 9px', cursor: 'pointer',
              color: '#6e7681', fontSize: 13, lineHeight: 1,
            }}
          >
            ⚙
          </button>
        )}

        {/* Modo */}
        {isEditor
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 8, padding: '2px 9px', borderRadius: 20, fontWeight: 700,
                background: '#23863622', color: '#3fb950', border: '1px solid #23863655' }}>
                EDITOR
              </span>
              <button onClick={onExitEditor} style={{
                background: 'none', border: 'none', color: '#484f58', fontSize: 10, cursor: 'pointer', padding: 0,
              }}>
                Vista pública
              </button>
            </div>
          : <button onClick={onEnterEditor} style={{
              background: 'transparent', border: '1px solid #30363d',
              borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              color: '#6e7681', fontSize: 11,
            }}>
              Modo editor
            </button>
        }

        {/* Guardado */}
        <span style={{ fontSize: 9, color: saveColor, minWidth: 80, textAlign: 'right' }}>
          {saveLabel}
        </span>
      </div>

      {/* Fila 2: filtros */}
      {filterOpen && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px 8px', borderTop: '1px solid #21262d', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 8, color: '#484f58', letterSpacing: '1px',
            textTransform: 'uppercase', flexShrink: 0 }}>Estado</span>
          {STATUSES.map(s => (
            <button key={s.id} onClick={() => onToggle('statuses', s.id)}
              style={pill(filters.statuses.includes(s.id), s.color)}>{s.label}</button>
          ))}
          <div style={{ width: 1, height: 16, background: '#21262d', flexShrink: 0 }} />
          <span style={{ fontSize: 8, color: '#484f58', letterSpacing: '1px',
            textTransform: 'uppercase', flexShrink: 0 }}>Owner</span>
          {owners.map(o => (
            <button key={o.id} onClick={() => onToggle('ownerIds', o.id)}
              style={pill(filters.ownerIds.includes(o.id), o.color)}>{o.name}</button>
          ))}
          <div style={{ width: 1, height: 16, background: '#21262d', flexShrink: 0 }} />
          <span style={{ fontSize: 8, color: '#484f58', letterSpacing: '1px',
            textTransform: 'uppercase', flexShrink: 0 }}>Tag</span>
          {tags.map(t => (
            <button key={t.id} onClick={() => onToggle('tagIds', t.id)}
              style={pill(filters.tagIds.includes(t.id), t.color)}>{t.name}</button>
          ))}
          {filterCount > 0 && (
            <>
              <div style={{ flex: 1 }} />
              <button onClick={onClear} style={{ background: 'none', border: 'none',
                color: '#484f58', fontSize: 10, cursor: 'pointer', padding: '0 4px' }}>
                Limpiar filtros
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
