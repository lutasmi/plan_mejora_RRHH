import { useRef, useLayoutEffect, useState } from 'react'
import {
  getPillarX, getRowY,
  totalCanvasW, totalCanvasH,
  ROW_LABEL_W, HDR_H,
} from '../../utils/layout'

// ── Zoom controls ─────────────────────────────────────────────────────────────
function ZoomControls({ onZoom, onReset }) {
  const btn = {
    width: 28, height: 28, background: '#161b22',
    border: '1px solid #30363d', color: '#8b949e',
    cursor: 'pointer', borderRadius: 4, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  return (
    <div style={{
      position: 'absolute', bottom: 12, right: 12,
      display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10,
    }}>
      <button style={{ ...btn, fontSize: 15 }} onClick={() => onZoom(1.2)}>+</button>
      <button style={{ ...btn, fontSize: 15 }} onClick={() => onZoom(0.85)}>−</button>
      <button style={{ ...btn, fontSize: 9  }} onClick={onReset}>⌂</button>
    </div>
  )
}

// ── Canvas ────────────────────────────────────────────────────────────────────
export default function Canvas({
  columns,
  rows,
  canEdit = false,
  onAddCard,
  onColumnResize,
  onRowResize,
  children, // tarjetas (commits futuros)
}) {
  const containerRef = useRef(null)
  const drag = useRef(null)
  const [vp, setVp] = useState({ x: ROW_LABEL_W, y: 0, scale: 1 })

  const TW = totalCanvasW(columns) + 200
  const TH = totalCanvasH(rows) + 200

  // ── Wheel zoom (non-passive, necesita addEventListener)
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleWheel = e => {
      e.preventDefault()
      const f = e.deltaY < 0 ? 1.12 : 0.9
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setVp(v => {
        const ns = Math.min(3, Math.max(0.1, v.scale * f))
        const r = ns / v.scale
        return { scale: ns, x: mx - (mx - v.x) * r, y: my - (my - v.y) * r }
      })
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  // ── Coordenadas canvas desde screen
  const toCanvas = (sx, sy) => ({
    x: (sx - vp.x) / vp.scale,
    y: (sy - vp.y) / vp.scale,
  })

  // ── Pointer handlers sobre SVG (pan + resize)
  const onBgDown = e => {
    drag.current = { type: 'pan', startX: e.clientX, startY: e.clientY, ox: vp.x, oy: vp.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onBgMove = e => {
    if (!drag.current) return
    const { type } = drag.current
    if (type === 'pan') {
      setVp(v => ({
        ...v,
        x: drag.current.ox + (e.clientX - drag.current.startX),
        y: drag.current.oy + (e.clientY - drag.current.startY),
      }))
    } else if (type === 'col-resize') {
      const dx = (e.clientX - drag.current.startX) / vp.scale
      onColumnResize?.(drag.current.id, Math.max(180, drag.current.origW + dx))
    } else if (type === 'row-resize') {
      const dy = (e.clientY - drag.current.startY) / vp.scale
      onRowResize?.(drag.current.id, Math.max(120, drag.current.origH + dy))
    }
  }

  const onBgUp = () => { drag.current = null }

  // ── Doble clic en fondo para añadir tarjeta
  const onBgDbl = e => {
    if (!canEdit || !onAddCard) return
    const rect = containerRef.current.getBoundingClientRect()
    const { x: cx, y: cy } = toCanvas(e.clientX - rect.left, e.clientY - rect.top)

    const ci = columns.findIndex((_, i) => {
      const px = getPillarX(columns, i)
      return cx >= px && cx < px + columns[i].w
    })

    let rowY = HDR_H
    let foundRow = null
    for (const row of rows) {
      if (cy >= rowY && cy < rowY + row.h) { foundRow = row; break }
      rowY += row.h
    }

    onAddCard(cx, cy, columns[ci]?.id ?? null, foundRow?.id ?? null)
  }

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#0d1117' }}
    >
      {/* ── SVG layer: grid + arrows */}
      <svg
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          cursor: drag.current?.type === 'pan' ? 'grabbing' : 'grab',
        }}
        onPointerDown={onBgDown}
        onPointerMove={onBgMove}
        onPointerUp={onBgUp}
        onDoubleClick={onBgDbl}
      >
        <g transform={`translate(${vp.x},${vp.y}) scale(${vp.scale})`}>

          {/* ── Filas */}
          {rows.map((row, ri) => {
            const ry = getRowY(rows, ri)
            return (
              <g key={row.id}>
                <rect x={0} y={ry} width={TW} height={row.h} fill={ri % 2 === 0 ? '#0d1117' : '#0f131a'} />
                {/* Área label izquierda */}
                <rect x={0} y={ry} width={ROW_LABEL_W - 1} height={row.h} fill="#161b22" />
                <line x1={ROW_LABEL_W - 1} y1={ry} x2={ROW_LABEL_W - 1} y2={ry + row.h} stroke="#21262d" strokeWidth={1} />
                <text
                  x={ROW_LABEL_W / 2} y={ry + row.h / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight={600} fill="#484f58"
                  style={{ userSelect: 'none' }}
                >
                  {row.label}
                </text>
                {/* Borde inferior */}
                <line x1={0} y1={ry + row.h} x2={TW} y2={ry + row.h} stroke="#21262d" strokeWidth={1} />
                {/* Handle resize fila */}
                {canEdit && (
                  <rect
                    x={0} y={ry + row.h - 5}
                    width={ROW_LABEL_W - 1} height={10}
                    fill="transparent"
                    style={{ cursor: 'row-resize' }}
                    onPointerDown={e => {
                      e.stopPropagation()
                      drag.current = { type: 'row-resize', id: row.id, startY: e.clientY, origH: row.h }
                      e.currentTarget.setPointerCapture(e.pointerId)
                    }}
                  />
                )}
              </g>
            )
          })}

          {/* ── Columnas */}
          {columns.map((col, ci) => {
            const cx = getPillarX(columns, ci)
            return (
              <g key={col.id}>
                {/* Fondo columna (tinted) */}
                <rect x={cx} y={0} width={col.w} height={TH} fill={col.color} opacity={0.4} />
                {/* Header columna */}
                <rect x={cx} y={0} width={col.w} height={HDR_H} fill={col.color} />
                <line x1={cx} y1={HDR_H} x2={cx + col.w} y2={HDR_H} stroke={col.border} strokeWidth={1.5} />
                <text
                  x={cx + col.w / 2} y={HDR_H / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={12} fontWeight={700} fill={col.hl}
                  style={{ userSelect: 'none' }}
                >
                  {col.label}
                </text>
                {/* Borde derecho */}
                <line x1={cx + col.w} y1={0} x2={cx + col.w} y2={TH} stroke={col.border} strokeWidth={1} />
                {/* Handle resize columna */}
                {canEdit && (
                  <rect
                    x={cx + col.w - 5} y={0}
                    width={10} height={TH}
                    fill="transparent"
                    style={{ cursor: 'col-resize' }}
                    onPointerDown={e => {
                      e.stopPropagation()
                      drag.current = { type: 'col-resize', id: col.id, startX: e.clientX, origW: col.w }
                      e.currentTarget.setPointerCapture(e.pointerId)
                    }}
                  />
                )}
              </g>
            )
          })}

          {/* ── Slot para flechas (commits futuros) */}

        </g>
      </svg>

      {/* ── HTML cards layer (commits futuros) */}
      {children}

      {/* ── Hint en modo editor */}
      {canEdit && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 9, color: '#21262d',
          letterSpacing: '1px', pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          Doble clic en el fondo para añadir · Arrastra para mover · Rueda para zoom
        </div>
      )}

      <ZoomControls
        onZoom={f => setVp(v => ({ ...v, scale: Math.min(3, Math.max(0.1, v.scale * f)) }))}
        onReset={() => setVp({ x: ROW_LABEL_W, y: 0, scale: 1 })}
      />
    </div>
  )
}
