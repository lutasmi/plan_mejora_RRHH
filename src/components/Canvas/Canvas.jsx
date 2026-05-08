import { useRef, useLayoutEffect, useState } from 'react'
import {
  getPillarX, getRowY, totalCanvasW, totalCanvasH, computedRows,
  ROW_LABEL_W, HDR_H, CARD_W,
} from '../../utils/layout'
import Card from '../Card/Card'

const bezier = (ax, ay, bx, by) => {
  const mx = (ax + bx) / 2
  return `M${ax},${ay} C${mx},${ay} ${mx},${by} ${bx},${by}`
}

function ZoomControls({ onZoom, onReset }) {
  const s = { width:28, height:28, background:'#161b22', border:'1px solid #30363d',
    color:'#8b949e', cursor:'pointer', borderRadius:4, fontWeight:700,
    display:'flex', alignItems:'center', justifyContent:'center' }
  return (
    <div style={{ position:'absolute', bottom:12, right:12, display:'flex', flexDirection:'column', gap:4, zIndex:10 }}>
      <button style={{...s, fontSize:15}} onClick={() => onZoom(1.2)}>+</button>
      <button style={{...s, fontSize:15}} onClick={() => onZoom(0.85)}>−</button>
      <button style={{...s, fontSize:9}}  onClick={onReset}>⌂</button>
    </div>
  )
}

export default function Canvas({
  columns, rows: rawRows, cards = [], owners = [], tags = [],
  canEdit = false,
  selCard = null, hlCard = null, related = new Set(),
  hasFilter = false, isVisible = () => true,
  onSelectCard, onHlCard, onMoveCard, onAddCard, onColumnResize, onRowResize,
}) {
  const containerRef = useRef(null)
  const drag = useRef(null)
  const [vp, setVp] = useState({ x: ROW_LABEL_W, y: 0, scale: 1 })

  const rows = computedRows(rawRows, cards)
  const TW   = totalCanvasW(columns) + 200
  const TH   = totalCanvasH(rows)    + 200

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = e => {
      e.preventDefault()
      const f = e.deltaY < 0 ? 1.12 : 0.9
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setVp(v => {
        const ns = Math.min(3, Math.max(0.1, v.scale * f))
        const r  = ns / v.scale
        return { scale: ns, x: mx - (mx - v.x) * r, y: my - (my - v.y) * r }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const toCanvas = (sx, sy) => ({ x: (sx - vp.x) / vp.scale, y: (sy - vp.y) / vp.scale })

  // SVG: pan + col/row resize
  const onBgDown = e => {
    drag.current = { type:'pan', startX:e.clientX, startY:e.clientY, ox:vp.x, oy:vp.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onBgMove = e => {
    if (!drag.current) return
    const { type } = drag.current
    if (type === 'pan') {
      setVp(v => ({ ...v, x: drag.current.ox + (e.clientX - drag.current.startX), y: drag.current.oy + (e.clientY - drag.current.startY) }))
    } else if (type === 'col-resize') {
      onColumnResize?.(drag.current.id, Math.max(180, drag.current.origW + (e.clientX - drag.current.startX) / vp.scale))
    } else if (type === 'row-resize') {
      onRowResize?.(drag.current.id, Math.max(120, drag.current.origH + (e.clientY - drag.current.startY) / vp.scale))
    }
  }
  const onBgUp = () => { drag.current = null }

  const onBgDbl = e => {
    if (!canEdit || !onAddCard) return
    const rect = containerRef.current.getBoundingClientRect()
    const { x: cx, y: cy } = toCanvas(e.clientX - rect.left, e.clientY - rect.top)
    const ci = columns.findIndex((col, i) => { const px = getPillarX(columns, i); return cx >= px && cx < px + col.w })
    let rowY = HDR_H, foundRow = null
    for (const row of rows) { if (cy >= rowY && cy < rowY + row.h) { foundRow = row; break } rowY += row.h }
    onAddCard(cx, cy, columns[ci]?.id ?? null, foundRow?.id ?? null)
  }

  // Card drag
  const cardDragStart = (e, card) => {
    if (!canEdit) return
    e.stopPropagation()
    // NO setPointerCapture aquí — solo registramos el inicio.
    // setPointerCapture se hace solo si hay movimiento real (umbral 5px).
    // Si no hay movimiento, onContainerUp lo trata como click → llama onSelectCard.
    drag.current = { type:'card', id:card.id, startX:e.clientX, startY:e.clientY, ox:card.x, oy:card.y, dragging:false }
  }
  const onContainerMove = e => {
    if (!drag.current || drag.current.type !== 'card') return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY
    if (!drag.current.dragging) {
      // Activar drag solo al superar umbral de 5px
      if (Math.sqrt(dx*dx + dy*dy) < 5) return
      drag.current.dragging = true
      containerRef.current?.setPointerCapture?.(e.pointerId)
    }
    onMoveCard?.(drag.current.id,
      drag.current.ox + dx / vp.scale,
      drag.current.oy + dy / vp.scale)
  }
  const onContainerUp = e => {
    if (drag.current?.type === 'card' && !drag.current.dragging) {
      // Movimiento menor al umbral → fue un click, no un drag
      onSelectCard?.(drag.current.id)
    }
    drag.current = null
  }

  // Flechas de dependencia — sin bridges
  const arrows = []
  cards.forEach(card => {
    ;(card.deps ?? []).forEach(depId => {
      const dep = cards.find(c => c.id === depId)
      if (!dep) return
      const isHl = Boolean(hlCard && related.has(depId) && related.has(card.id))
      arrows.push({
        key: `${depId}:${card.id}`,
        ax: dep.x + CARD_W, ay: dep.y + 40,
        bx: card.x,         by: card.y + 40,
        vis: isVisible(card) && isVisible(dep),
        isHl,
      })
    })
  })

  return (
    <div
      ref={containerRef}
      style={{ flex:1, overflow:'hidden', position:'relative', background:'#0d1117' }}
      onPointerMove={onContainerMove}
      onPointerUp={onContainerUp}
      onPointerCancel={onContainerUp}
    >
      {/* SVG: grid + flechas */}
      <svg
        style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', cursor:'grab' }}
        onPointerDown={onBgDown} onPointerMove={onBgMove} onPointerUp={onBgUp}
        onDoubleClick={onBgDbl}
        onClick={e => { if (['svg','rect','line','text','g'].includes(e.target.tagName)) onSelectCard?.(null) }}
      >
        <defs>
          <marker id="arr"    markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1.5 L7,4 L0,6.5 Z" fill="#1f4a7a" opacity="0.9" />
          </marker>
          <marker id="arr-hl" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1.5 L7,4 L0,6.5 Z" fill="#f0883e" />
          </marker>
        </defs>
        <g transform={`translate(${vp.x},${vp.y}) scale(${vp.scale})`}>

          {rows.map((row, ri) => {
            const ry = getRowY(rows, ri)
            return (
              <g key={row.id}>
                <rect x={0} y={ry} width={TW} height={row.h} fill={ri%2===0?'#0d1117':'#0f131a'} />
                <rect x={0} y={ry} width={ROW_LABEL_W-1} height={row.h} fill="#161b22" />
                <line x1={ROW_LABEL_W-1} y1={ry} x2={ROW_LABEL_W-1} y2={ry+row.h} stroke="#21262d" strokeWidth={1} />
                <text x={ROW_LABEL_W/2} y={ry+row.h/2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight={600} fill="#484f58" style={{userSelect:'none'}}>
                  {row.label}
                </text>
                <line x1={0} y1={ry+row.h} x2={TW} y2={ry+row.h} stroke="#21262d" strokeWidth={1} />
                {canEdit && (
                  <rect x={0} y={ry+row.h-5} width={ROW_LABEL_W-1} height={10}
                    fill="transparent" style={{cursor:'row-resize'}}
                    onPointerDown={e => { e.stopPropagation(); drag.current = { type:'row-resize', id:row.id, startY:e.clientY, origH:row.h }; e.currentTarget.setPointerCapture(e.pointerId) }}
                  />
                )}
              </g>
            )
          })}

          {columns.map((col, ci) => {
            const px = getPillarX(columns, ci)
            return (
              <g key={col.id}>
                <rect x={px} y={0} width={col.w} height={TH} fill={col.color} opacity={0.4} />
                <rect x={px} y={0} width={col.w} height={HDR_H} fill={col.color} />
                <line x1={px} y1={HDR_H} x2={px+col.w} y2={HDR_H} stroke={col.border} strokeWidth={1.5} />
                <text x={px+col.w/2} y={HDR_H/2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={12} fontWeight={700} fill={col.hl} style={{userSelect:'none'}}>
                  {col.label}
                </text>
                <line x1={px+col.w} y1={0} x2={px+col.w} y2={TH} stroke={col.border} strokeWidth={1} />
                {canEdit && (
                  <rect x={px+col.w-5} y={0} width={10} height={TH}
                    fill="transparent" style={{cursor:'col-resize'}}
                    onPointerDown={e => { e.stopPropagation(); drag.current = { type:'col-resize', id:col.id, startX:e.clientX, origW:col.w }; e.currentTarget.setPointerCapture(e.pointerId) }}
                  />
                )}
              </g>
            )
          })}

          {arrows.map(a => {
            const dim = Boolean(hlCard && !a.isHl)
            return (
              <path key={a.key}
                d={bezier(a.ax, a.ay, a.bx, a.by)}
                stroke={a.isHl ? '#f0883e' : '#1f4a7a'}
                strokeWidth={a.isHl ? 2 : 1} fill="none"
                strokeOpacity={dim ? 0.04 : a.vis ? 0.3 : 0.08}
                markerEnd={a.isHl ? 'url(#arr-hl)' : 'url(#arr)'}
              />
            )
          })}

        </g>
      </svg>

      {/* HTML cards layer */}
      <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', overflow:'hidden' }}>
        {cards.map(card => {
          const owner    = owners.find(o => o.id === card.ownerId) ?? owners[0]
          const cardTags = tags.filter(t => card.tagIds.includes(t.id))
          const sx = card.x * vp.scale + vp.x
          const sy = card.y * vp.scale + vp.y
          return (
            <div key={card.id}
              style={{
                position:'absolute', left:0, top:0,
                transform:`translate(${sx}px,${sy}px) scale(${vp.scale})`,
                transformOrigin:'top left',
                width: CARD_W,
                pointerEvents:'auto',
                cursor: canEdit ? 'grab' : 'pointer',
              }}
              onPointerDown={e => { cardDragStart(e, card) }}
            >
              <Card
                card={card}
                owner={owner}
                tags={cardTags}
                isSel={selCard === card.id}
                isHl={Boolean(hlCard && related.has(card.id))}
                isDim={Boolean(hlCard && !related.has(card.id))}
                isFiltered={hasFilter && !isVisible(card)}
                canEdit={canEdit}
                onSelect={onSelectCard}
                onHlCard={onHlCard}
                onDragStart={cardDragStart}
              />
            </div>
          )
        })}
      </div>

      {canEdit && (
        <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)',
          fontSize:9, color:'#21262d', letterSpacing:'1px', pointerEvents:'none', whiteSpace:'nowrap' }}>
          Doble clic en el fondo para añadir · Arrastra para mover · Rueda para zoom
        </div>
      )}
      <ZoomControls
        onZoom={f => setVp(v => ({ ...v, scale: Math.min(3, Math.max(0.1, v.scale*f)) }))}
        onReset={() => setVp({ x: ROW_LABEL_W, y: 0, scale: 1 })}
      />
    </div>
  )
}
