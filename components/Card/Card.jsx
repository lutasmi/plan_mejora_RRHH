import { getStatus } from '../../constants/statuses'
import { COLUMNS } from '../../constants/columns'

// Tarjeta visual del canvas.
// Responsabilidad: renderizar el estado visual de una pieza operativa.
// El drag lo inicia llamando a onDragStart — la lógica de movimiento vive en Canvas.
//
// Sin: steps, progress bar, bridges.
// Con: status badge, blocker signal, owner dot, column badge, tags, link icon, ◎ button.

export default function Card({
  card,
  owner,
  tags,
  isSel,
  isHl,
  isDim,
  isFiltered,
  canEdit,
  onSelect,
  onHlCard,
  onDragStart,
}) {
  const status  = getStatus(card.status)
  const column  = COLUMNS.find(c => c.id === card.columnId)
  const blocked = card.status === 'bloqueado' || card.blocker?.active
  const done    = card.status === 'completado'

  // ── Colores dinámicos de la tarjeta
  const bgColor = done    ? '#0d1f12'
                : blocked ? '#1a0d0d'
                :           '#161b22'

  const borderColor = isSel    ? (column?.hl   ?? '#388bfd')
                    : isHl     ? '#f0883e'
                    : done     ? '#238636'
                    : blocked  ? '#f85149'
                    :             (column?.border ?? '#21262d')

  const borderWidth = isSel || isHl ? '1.5px' : '1.5px'

  const titleColor  = done  ? '#3fb950'
                    : isHl  ? '#f0883e'
                    :          '#e6edf3'

  const opacity = isFiltered ? 0.06 : isDim ? 0.15 : 1

  const boxShadow = isSel
    ? `0 0 0 2px ${column?.hl ?? '#388bfd'}55, 0 8px 24px #00000088`
    : isHl
    ? '0 0 0 2px #f0883e55'
    : '0 2px 8px #00000055'

  return (
    <div
      style={{
        background: bgColor,
        border: `${borderWidth} solid ${borderColor}`,
        borderTop: `3px solid ${owner?.color ?? '#6e7681'}`,
        borderRadius: 7,
        padding: '9px 10px 8px',
        opacity,
        boxShadow,
        transition: 'opacity .18s, box-shadow .15s',
        cursor: canEdit ? 'grab' : 'pointer',
        userSelect: 'none',
      }}
      onPointerDown={e => {
        if (canEdit) onDragStart(e, card)
      }}
      onClick={e => {
        e.stopPropagation()
        onSelect(card.id)
      }}
    >
      {/* ── Fila 1: título + botón ◎ */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', marginBottom: 5 }}>
        <div style={{
          flex: 1, fontSize: 12, fontWeight: 600,
          color: titleColor, lineHeight: 1.35,
        }}>
          {done && '✓ '}{card.name}
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onHlCard(card.id) }}
          title="Iluminar flujo"
          style={{
            background: 'none',
            border: `1px solid ${isHl ? '#f0883e' : '#21262d'}`,
            color: isHl ? '#f0883e' : '#30363d',
            cursor: 'pointer',
            width: 18, height: 18,
            borderRadius: 3,
            fontSize: 9, padding: 0, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ◎
        </button>
      </div>

      {/* ── Column badge */}
      {column && (
        <div style={{
          fontSize: '8px', padding: '1px 5px', borderRadius: 3,
          background: column.color, color: column.hl,
          border: `1px solid ${column.border}`,
          display: 'inline-block', marginBottom: 5, fontWeight: 600,
        }}>
          {column.label}
        </div>
      )}

      {/* ── Owner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: tags.length ? 4 : 0 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: owner?.color ?? '#6e7681', flexShrink: 0,
        }} />
        <span style={{ fontSize: 10, color: owner?.color ?? '#6e7681', fontWeight: 500 }}>
          {owner?.name ?? '—'}
        </span>
      </div>

      {/* ── Tags */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 5, marginTop: 3 }}>
          {tags.map(t => (
            <span key={t.id} style={{
              fontSize: '8px', padding: '1px 5px', borderRadius: 10,
              background: t.color + '22', color: t.color,
              border: `1px solid ${t.color}33`, fontWeight: 500,
            }}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Fila inferior: status + blocker signal + link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
        <span style={{
          fontSize: '8px', padding: '1px 6px', borderRadius: 10,
          background: status.color + '22', color: status.color,
          border: `1px solid ${status.color}33`, fontWeight: 600,
        }}>
          {status.label}
        </span>

        {/* Señal de bloqueo */}
        {card.blocker?.active && card.status !== 'bloqueado' && (
          <span style={{ fontSize: 9, color: '#f85149' }} title={card.blocker.description}>
            ⚠
          </span>
        )}

        {/* Enlace */}
        {card.url && (
          <a
            href={card.url} target="_blank" rel="noreferrer"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            style={{ marginLeft: 'auto', fontSize: 9, color: '#388bfd', textDecoration: 'none' }}
          >
            🔗
          </a>
        )}
      </div>
    </div>
  )
}
