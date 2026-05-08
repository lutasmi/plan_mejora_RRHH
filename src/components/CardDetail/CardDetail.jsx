import { useState, useEffect } from 'react'
import { STATUSES } from '../../constants/statuses'

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:        '#161b22',
  bgDeep:    '#0d1117',
  border:    '#21262d',
  borderMid: '#30363d',
  text:      '#e6edf3',
  textMid:   '#8b949e',
  textDim:   '#6e7681',   // subido de #484f58 → labels más legibles
  textGhost: '#30363d',
}

// ── Quarters ──────────────────────────────────────────────────────────────────
const QUARTERS = ['', ...['2025','2026','2027'].flatMap(y =>
  ['Q1','Q2','Q3','Q4'].map(q => `${y} ${q}`)
)]

// ── Detección de ciclos ───────────────────────────────────────────────────────
// ¿Añadir newDepId como dependencia de cardId crearía un ciclo?
// Ciclo si cardId es alcanzable desde newDepId siguiendo las deps existentes.
function wouldCreateCycle(cardId, newDepId, allCards) {
  if (cardId === newDepId) return true
  const visited = new Set()
  const queue   = [newDepId]
  while (queue.length) {
    const cur = queue.shift()
    if (cur === cardId) return true
    if (visited.has(cur)) continue
    visited.add(cur)
    const c = allCards.find(x => x.id === cur)
    ;(c?.deps ?? []).forEach(d => { if (!visited.has(d)) queue.push(d) })
  }
  return false
}

// ── Primitivos ────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '1.2px',
      color: T.textDim, textTransform: 'uppercase', marginBottom: 7,
    }}>
      {children}
    </div>
  )
}

// Punto de extensión: en el futuro estos dividers se convierten en cabeceras de acordeón
function Divider({ label }) {
  return (
    <div style={{ margin: '18px 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {label && (
        <>
          <span style={{ fontSize: 8, color: T.textGhost, letterSpacing: '1px', textTransform: 'uppercase' }}>
            {label}
          </span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </>
      )}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, multiline }) {
  const base = {
    width: '100%', boxSizing: 'border-box',
    background: T.bgDeep, border: `1px solid ${T.borderMid}`,
    borderRadius: 5, color: T.text, fontSize: 12,
    padding: '7px 9px', outline: 'none', fontFamily: 'inherit',
  }
  return multiline
    ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={{ ...base, resize: 'vertical' }} />
    : <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={base} />
}

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: '100%', boxSizing: 'border-box',
      background: T.bgDeep, border: `1px solid ${T.borderMid}`,
      borderRadius: 5, color: value ? T.text : T.textDim, fontSize: 12,
      padding: '7px 9px', outline: 'none', cursor: 'pointer',
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function ReadValue({ children, dim, color }) {
  return (
    <div style={{ fontSize: 12, color: color ?? (dim ? T.textGhost : T.textMid), lineHeight: 1.6 }}>
      {children || '—'}
    </div>
  )
}

// ── Selector de dependencias ──────────────────────────────────────────────────
function DepSelector({ candidates, selected, allCards, columns = [], cardId, onToggle }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const [cycleWarn, setCycleWarn] = useState(null) // id de la dep que causaría ciclo

  const count         = selected.length
  const selectedCards = selected.map(id => allCards.find(c => c.id === id)).filter(Boolean)
  const filtered      = candidates.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  const handleToggle = (depId) => {
    if (!selected.includes(depId) && wouldCreateCycle(cardId, depId, allCards)) {
      setCycleWarn(depId)
      setTimeout(() => setCycleWarn(null), 3000)
      return
    }
    setCycleWarn(null)
    onToggle(depId)
  }

  return (
    <div>
      {/* Chips de las ya seleccionadas — quitar con × sin abrir el selector */}
      {selectedCards.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 7 }}>
          {selectedCards.map(c => {
            const col = columns.find(col => col.id === c.columnId)
            return (
              <span key={c.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 9, padding: '3px 6px 3px 8px', borderRadius: 10,
                background: '#21262d', color: T.textMid, border: `1px solid ${T.borderMid}`,
              }}>
                {col && <span style={{ width: 5, height: 5, borderRadius: '50%',
                  background: col.hl, flexShrink: 0 }} />}
                <span style={{ maxWidth: 130, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <button onClick={() => onToggle(c.id)} style={{
                  background: 'none', border: 'none', color: T.textDim,
                  cursor: 'pointer', padding: 0, fontSize: 13, lineHeight: 1,
                  display: 'flex', alignItems: 'center',
                }}>×</button>
              </span>
            )
          })}
        </div>
      )}

      {/* Warning de ciclo */}
      {cycleWarn && (
        <div style={{
          fontSize: 10, color: '#f0883e', padding: '5px 9px', borderRadius: 5,
          background: '#2d1a0022', border: '1px solid #f0883e44', marginBottom: 7,
        }}>
          ⚠ Dependencia circular — esta conexión crearía un ciclo
        </div>
      )}

      {/* Trigger colapsable */}
      <button
        onClick={() => { setOpen(o => !o); setQuery(''); setCycleWarn(null) }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: T.bgDeep, border: `1px solid ${T.borderMid}`,
          borderRadius: open ? '5px 5px 0 0' : 5,
          padding: '6px 9px', cursor: 'pointer', color: T.textDim, fontSize: 11,
        }}
      >
        <span>{count === 0 ? 'Añadir dependencia…' : `${count} dependencia${count !== 1 ? 's' : ''}`}</span>
        <span style={{ fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          border: `1px solid ${T.borderMid}`, borderTop: 'none',
          borderRadius: '0 0 5px 5px', background: T.bgDeep,
        }}>
          <div style={{ padding: '6px 7px', borderBottom: `1px solid ${T.border}` }}>
            <input
              autoFocus type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 4, color: T.text, fontSize: 11,
                padding: '4px 7px', outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {candidates.length === 0 && (
              <div style={{ padding: '10px 9px', fontSize: 11, color: T.textGhost }}>
                No hay otras tarjetas
              </div>
            )}
            {candidates.length > 0 && filtered.length === 0 && (
              <div style={{ padding: '10px 9px', fontSize: 11, color: T.textGhost }}>
                Sin resultados para "{query}"
              </div>
            )}
            {filtered.map(c => {
              const active  = selected.includes(c.id)
              const isCycle = !active && wouldCreateCycle(cardId, c.id, allCards)
              const col     = columns.find(col => col.id === c.columnId)
              return (
                <label key={c.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 7, cursor: isCycle ? 'not-allowed' : 'pointer',
                  padding: '6px 9px', background: active ? T.bg : 'transparent',
                  borderBottom: `1px solid ${T.border}`,
                  opacity: isCycle ? 0.45 : 1,
                }}>
                  <input type="checkbox" checked={active}
                    onChange={() => handleToggle(c.id)}
                    disabled={isCycle}
                    style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, color: active ? T.text : T.textMid, lineHeight: 1.3 }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 9, marginTop: 1, display: 'flex', gap: 6 }}>
                      {col && <span style={{ color: col.hl }}>{col.label}</span>}
                      {isCycle && <span style={{ color: '#f0883e' }}>ciclo</span>}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── CardDetail ────────────────────────────────────────────────────────────────
export default function CardDetail({ card, allCards, columns = [], owners, tags, rows, canEdit, onUpdate, onDelete, onClose }) {
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (card) setDraft(JSON.parse(JSON.stringify(card)))
    else      setDraft(null)
  }, [card?.id])

  if (!card || !draft) return null

  const column = columns.find(c => c.id === draft.columnId)
  const owner  = owners.find(o => o.id === draft.ownerId)
  const status = STATUSES.find(s => s.id === draft.status) ?? STATUSES[0]

  const set = (field, value) => {
    const next = { ...draft, [field]: value }
    setDraft(next)
    onUpdate(next)
  }
  const setBlocker = (field, value) => {
    const next = { ...draft, blocker: { ...draft.blocker, [field]: value } }
    setDraft(next)
    onUpdate(next)
  }
  const toggleDep = depId => {
    const cur = draft.deps ?? []
    set('deps', cur.includes(depId) ? cur.filter(d => d !== depId) : [...cur, depId])
  }
  const toggleTag = tagId => {
    const cur = draft.tagIds ?? []
    set('tagIds', cur.includes(tagId) ? cur.filter(t => t !== tagId) : [...cur, tagId])
  }

  const depCandidates = allCards.filter(c => c.id !== card.id)
  const rowLabel      = rows.find(r => r.id === draft.rowId)?.label

  return (
    <div style={{
      width: 360,          // ← aumentado de 320 (12.5%)
      flexShrink: 0,
      background: T.bg,
      borderLeft: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>

      {/* Cabecera */}
      <div style={{
        padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <div style={{ width: 3, height: 20, borderRadius: 2,
          background: column?.hl ?? T.textDim, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: column?.hl ?? T.textDim, fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 1 }}>
            {column?.label ?? '—'}
          </div>
          <div style={{ fontSize: 10, color: T.textDim,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rowLabel ?? 'Sin fase'}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: T.textDim,
          cursor: 'pointer', fontSize: 18, padding: '0 0 0 4px', lineHeight: 1,
        }}>×</button>
      </div>

      {/* Cuerpo scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px' }}>

        {/* ── BLOQUE: IDENTIDAD ────────────────────────────────────────── */}

        <div style={{ marginBottom: 16 }}>
          {canEdit
            ? <><SectionLabel>Nombre</SectionLabel>
                <TextInput value={draft.name} onChange={v => set('name', v)} placeholder="Nombre de la pieza" />
              </>
            : <div style={{ fontSize: 16, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>
                {draft.name}
              </div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Descripción</SectionLabel>
          {canEdit
            ? <TextInput multiline value={draft.desc} onChange={v => set('desc', v)}
                placeholder="Contexto, alcance, objetivo…" />
            : <ReadValue dim={!draft.desc}>{draft.desc}</ReadValue>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Enlace</SectionLabel>
          {canEdit
            ? <TextInput value={draft.url} onChange={v => set('url', v)} placeholder="https://…" />
            : draft.url
              ? <a href={draft.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 12, color: '#388bfd', wordBreak: 'break-all' }}>{draft.url}</a>
              : <ReadValue dim>—</ReadValue>}
        </div>

        <Divider label="Estado" />

        {/* ── BLOQUE: ESTADO ───────────────────────────────────────────── */}

        <div style={{ marginBottom: 16 }}>
          {canEdit
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {STATUSES.map(s => {
                  const active = draft.status === s.id
                  return (
                    <button key={s.id} onClick={() => set('status', s.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '7px 11px', borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${active ? s.color : T.borderMid}`,
                      background: active ? s.color + '28' : 'transparent',
                      color: active ? s.color : T.textDim,
                      fontWeight: active ? 700 : 400, fontSize: 12,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: active ? s.color : T.borderMid,
                        boxShadow: active ? `0 0 6px ${s.color}88` : 'none',
                      }} />
                      {s.label}
                      {active && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            : <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 12px', borderRadius: 6,
                background: status.color + '22', border: `1px solid ${status.color}55` }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.color,
                  boxShadow: `0 0 5px ${status.color}88` }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: status.color }}>{status.label}</span>
              </div>}
        </div>

        {/* Bloqueo */}
        <div style={{ marginBottom: 4 }}>
          <SectionLabel>Bloqueo</SectionLabel>
          {canEdit
            ? <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  padding: '8px 11px', borderRadius: 6, marginBottom: draft.blocker.active ? 8 : 0,
                  background: draft.blocker.active ? '#1a0d0d' : T.bgDeep,
                  border: `1px solid ${draft.blocker.active ? '#f8514944' : T.borderMid}`,
                }}>
                  <input type="checkbox" checked={draft.blocker.active}
                    onChange={e => setBlocker('active', e.target.checked)} />
                  <span style={{ fontSize: 12, fontWeight: draft.blocker.active ? 600 : 400,
                    color: draft.blocker.active ? '#f85149' : T.textDim }}>
                    {draft.blocker.active ? '⚠ Tiene bloqueo' : 'Tiene bloqueo'}
                  </span>
                </label>
                {draft.blocker.active && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <TextInput value={draft.blocker.description} onChange={v => setBlocker('description', v)}
                      placeholder="Descripción del bloqueo" />
                    <TextInput value={draft.blocker.area} onChange={v => setBlocker('area', v)}
                      placeholder="Área bloqueante" />
                    <input type="date" value={draft.blocker.date}
                      onChange={e => setBlocker('date', e.target.value)}
                      style={{ background: T.bgDeep, border: `1px solid ${T.borderMid}`, borderRadius: 5,
                        color: T.text, fontSize: 12, padding: '7px 9px', outline: 'none',
                        width: '100%', boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>
            : draft.blocker.active
              ? <div style={{ padding: '8px 11px', borderRadius: 6,
                  background: '#1a0d0d', border: '1px solid #f8514933' }}>
                  <div style={{ fontSize: 12, color: '#f85149', fontWeight: 600, marginBottom: 3 }}>
                    ⚠ {draft.blocker.description || 'Bloqueo activo'}
                  </div>
                  {draft.blocker.area && <div style={{ fontSize: 11, color: T.textMid }}>Área: {draft.blocker.area}</div>}
                  {draft.blocker.date && <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{draft.blocker.date}</div>}
                </div>
              : <ReadValue dim>Sin bloqueo</ReadValue>}
        </div>

        <Divider label="Clasificación" />

        {/* ── BLOQUE: CLASIFICACIÓN ────────────────────────────────────── */}

        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Etiquetas</SectionLabel>
          {canEdit
            ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {tags.map(t => {
                  const active = draft.tagIds.includes(t.id)
                  return (
                    <button key={t.id} onClick={() => toggleTag(t.id)} style={{
                      fontSize: 9, padding: '3px 9px', borderRadius: 10, fontWeight: 600,
                      cursor: 'pointer',
                      border: `1px solid ${active ? t.color + '88' : T.borderMid}`,
                      background: active ? t.color + '28' : 'transparent',
                      color: active ? t.color : T.textDim,
                    }}>{t.name}</button>
                  )
                })}
              </div>
            : draft.tagIds.length > 0
              ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {tags.filter(t => draft.tagIds.includes(t.id)).map(t => (
                    <span key={t.id} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10,
                      fontWeight: 600, background: t.color + '22', color: t.color,
                      border: `1px solid ${t.color}33` }}>{t.name}</span>
                  ))}
                </div>
              : <ReadValue dim>—</ReadValue>}
        </div>

        {/* Owner */}
        <div style={{ marginBottom: 10 }}>
          <SectionLabel>Owner</SectionLabel>
          {canEdit
            ? <Sel value={draft.ownerId ?? ''} onChange={v => set('ownerId', v)}
                options={owners.map(o => ({ value: o.id, label: o.name }))} />
            : <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%',
                  background: owner?.color ?? T.textDim }} />
                <span style={{ fontSize: 11, color: owner?.color ?? T.textMid }}>{owner?.name ?? '—'}</span>
              </div>}
        </div>

        {/* Columna + Fase */}
        {canEdit
          ? <>
              <div style={{ marginBottom: 10 }}>
                <SectionLabel>Columna</SectionLabel>
                <Sel value={draft.columnId ?? ''} onChange={v => set('columnId', v)}
                  options={[{ value:'', label:'—' }, ...columns.map(c => ({ value: c.id, label: c.label }))]} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <SectionLabel>Fase</SectionLabel>
                <Sel value={draft.rowId ?? ''} onChange={v => set('rowId', v)}
                  options={[{ value:'', label:'—' }, ...rows.map(r => ({ value: r.id, label: r.label }))]} />
              </div>
            </>
          : <div style={{ marginBottom: 10 }}>
              <SectionLabel>Ubicación</SectionLabel>
              <div style={{ fontSize: 11, color: T.textDim }}>
                {column?.label ?? '—'} · {rowLabel ?? 'Sin fase'}
              </div>
            </div>}

        {/* Quarter */}
        <div style={{ marginBottom: 4 }}>
          <SectionLabel>Quarter objetivo</SectionLabel>
          {canEdit
            ? <Sel value={draft.quarter ?? ''} onChange={v => set('quarter', v)}
                options={QUARTERS.map(q => ({ value: q, label: q || '—' }))} />
            : <ReadValue dim={!draft.quarter}>{draft.quarter}</ReadValue>}
        </div>

        <Divider label="Dependencias" />

        {/* ── BLOQUE: DEPENDENCIAS ─────────────────────────────────────── */}
        <div style={{ marginBottom: 4 }}>
          {canEdit
            ? <DepSelector
                candidates={depCandidates}
                selected={draft.deps}
                allCards={allCards}
                columns={columns}
                cardId={card.id}
                onToggle={toggleDep}
              />
            : draft.deps.length > 0
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {draft.deps.map(depId => {
                    const dep = allCards.find(c => c.id === depId)
                    if (!dep) return null
                    const col = columns.find(c => c.id === dep.columnId)
                    return (
                      <div key={depId} style={{ display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 11, color: T.textMid }}>
                        <span style={{ color: T.textGhost }}>→</span>
                        <span>{dep.name}</span>
                        {col && <span style={{ fontSize: 9, color: col.hl }}>({col.label})</span>}
                      </div>
                    )
                  })}
                </div>
              : <ReadValue dim>Sin dependencias</ReadValue>}
        </div>

        {/* Eliminar — bajo perfil */}
        {canEdit && (
          <>
            <Divider />
            <button
              onClick={() => { onDelete(card.id); onClose() }}
              style={{
                width: '100%', padding: '6px', borderRadius: 5, cursor: 'pointer',
                background: 'transparent', border: `1px solid ${T.border}`,
                color: T.textDim, fontSize: 10,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f8514955'; e.currentTarget.style.color = '#f85149' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim }}
            >
              Eliminar tarjeta
            </button>
          </>
        )}

        <div style={{ height: 28 }} />
      </div>
    </div>
  )
}
