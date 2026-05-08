import { useState, useRef } from 'react'
import { COLUMNS } from '../../constants/columns'
import { uid } from '../../utils/uid'
import { downloadCSV, importCSV } from '../../utils/csv'

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:        '#161b22',
  bgDeep:    '#0d1117',
  border:    '#21262d',
  borderMid: '#30363d',
  text:      '#e6edf3',
  textMid:   '#8b949e',
  textDim:   '#6e7681',
  textGhost: '#30363d',
  danger:    '#f85149',
}

// Paleta de colores predefinidos para owners y tags
const COLOR_PALETTE = [
  '#f85149','#f0883e','#e3b341','#3fb950','#39d353',
  '#388bfd','#79c0ff','#bc8cff','#ff7b72','#6e7681',
]

// ── Primitivos ────────────────────────────────────────────────────────────────
function SectionHeader({ label, open, onToggle, count }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`,
        padding: '11px 16px', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: T.text, flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: 9, color: T.textGhost,
          background: '#21262d', borderRadius: 10, padding: '1px 7px' }}>
          {count}
        </span>
      )}
      <span style={{ fontSize: 9, color: T.textDim }}>{open ? '▲' : '▼'}</span>
    </button>
  )
}

function TextInput({ value, onChange, placeholder, style }) {
  return (
    <input
      type="text" value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: T.bgDeep, border: `1px solid ${T.borderMid}`,
        borderRadius: 5, color: T.text, fontSize: 12,
        padding: '5px 8px', outline: 'none', fontFamily: 'inherit',
        boxSizing: 'border-box', ...style,
      }}
    />
  )
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {COLOR_PALETTE.map(c => (
        <div
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 16, height: 16, borderRadius: '50%', background: c,
            cursor: 'pointer', flexShrink: 0,
            border: `2px solid ${value === c ? T.text : 'transparent'}`,
            boxSizing: 'border-box',
            boxShadow: value === c ? `0 0 0 1px ${c}` : 'none',
          }}
        />
      ))}
      {/* Input hex manual */}
      <input
        type="color" value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: 16, height: 16, padding: 0, border: 'none',
          borderRadius: '50%', cursor: 'pointer', background: 'none' }}
        title="Color personalizado"
      />
    </div>
  )
}

function DeleteBtn({ onClick, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? T.textGhost : T.textDim, fontSize: 14, padding: '0 4px',
        lineHeight: 1, flexShrink: 0,
        transition: 'color .12s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = T.danger }}
      onMouseLeave={e => { e.currentTarget.style.color = disabled ? T.textGhost : T.textDim }}
    >
      ×
    </button>
  )
}

function AddBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'none', border: `1px dashed ${T.borderMid}`,
      borderRadius: 5, color: T.textDim, fontSize: 11,
      padding: '5px 10px', cursor: 'pointer', width: '100%',
      marginTop: 8, justifyContent: 'center',
    }}>
      <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
      {label}
    </button>
  )
}

// ── Sección: Filas ────────────────────────────────────────────────────────────
function RowsSection({ rows, cards, onAdd, onUpdate, onDelete, onMove }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <SectionHeader label="Filas" open={open} onToggle={() => setOpen(o => !o)} count={rows.length} />
      {open && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 9, color: T.textGhost, marginBottom: 10 }}>
            Cada fila representa una fase operativa del ciclo de vida RRHH.
            Las tarjetas asignadas a una fila eliminada perderán su fase.
          </div>

          {rows.map((row, i) => {
            const cardCount = cards.filter(c => c.rowId === row.id).length
            const canDelete = cardCount === 0
            return (
              <div key={row.id} style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
              }}>
                {/* Reordenar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                  <button
                    onClick={() => onMove(i, i - 1)}
                    disabled={i === 0}
                    style={{ background: 'none', border: 'none', color: i === 0 ? T.textGhost : T.textDim,
                      cursor: i === 0 ? 'default' : 'pointer', fontSize: 8, padding: 0, lineHeight: 1 }}
                  >▲</button>
                  <button
                    onClick={() => onMove(i, i + 1)}
                    disabled={i === rows.length - 1}
                    style={{ background: 'none', border: 'none',
                      color: i === rows.length - 1 ? T.textGhost : T.textDim,
                      cursor: i === rows.length - 1 ? 'default' : 'pointer', fontSize: 8, padding: 0, lineHeight: 1 }}
                  >▼</button>
                </div>

                {/* Número */}
                <span style={{ fontSize: 10, color: T.textGhost, width: 16,
                  textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>

                {/* Nombre */}
                <TextInput
                  value={row.label}
                  onChange={v => onUpdate(row.id, 'label', v)}
                  placeholder="Nombre de fase"
                  style={{ flex: 1 }}
                />

                {/* Contador de tarjetas */}
                {cardCount > 0 && (
                  <span style={{ fontSize: 9, color: T.textGhost, flexShrink: 0 }}>
                    {cardCount}
                  </span>
                )}

                {/* Borrar */}
                <DeleteBtn
                  onClick={() => onDelete(row.id)}
                  disabled={!canDelete}
                  title={canDelete ? 'Eliminar fila' : `Tiene ${cardCount} tarjeta${cardCount > 1 ? 's' : ''} — vacíala primero`}
                />
              </div>
            )
          })}

          <AddBtn onClick={onAdd} label="Añadir fila" />
        </div>
      )}
    </div>
  )
}

// ── Sección: Owners ───────────────────────────────────────────────────────────
function OwnersSection({ owners, cards, onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <SectionHeader label="Owners" open={open} onToggle={() => setOpen(o => !o)} count={owners.length} />
      {open && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 9, color: T.textGhost, marginBottom: 10 }}>
            El primer owner no se puede eliminar — se usa como fallback para tarjetas sin asignar.
          </div>

          {owners.map((owner, i) => {
            const cardCount = cards.filter(c => c.ownerId === owner.id).length
            const canDelete = i > 0 && cardCount === 0
            const deleteTitle = i === 0
              ? 'Owner de fallback — no eliminable'
              : cardCount > 0
                ? `Asignado a ${cardCount} tarjeta${cardCount > 1 ? 's' : ''} — reasígnalas primero`
                : 'Eliminar owner'

            return (
              <div key={owner.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Dot de color */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%',
                    background: owner.color, flexShrink: 0 }} />

                  {/* Nombre */}
                  <TextInput
                    value={owner.name}
                    onChange={v => onUpdate(owner.id, 'name', v)}
                    placeholder="Nombre"
                    style={{ flex: 1 }}
                  />

                  {cardCount > 0 && (
                    <span style={{ fontSize: 9, color: T.textGhost, flexShrink: 0 }}>
                      {cardCount}
                    </span>
                  )}

                  <DeleteBtn onClick={() => onDelete(owner.id)} disabled={!canDelete} title={deleteTitle} />
                </div>

                {/* Color picker inline */}
                <div style={{ marginTop: 5, marginLeft: 16, paddingLeft: 6,
                  borderLeft: `2px solid ${owner.color}33` }}>
                  <ColorPicker value={owner.color} onChange={v => onUpdate(owner.id, 'color', v)} />
                </div>
              </div>
            )
          })}

          <AddBtn onClick={onAdd} label="Añadir owner" />
        </div>
      )}
    </div>
  )
}

// ── Sección: Etiquetas ────────────────────────────────────────────────────────
function TagsSection({ tags, cards, onAdd, onUpdate, onDelete }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <SectionHeader label="Etiquetas" open={open} onToggle={() => setOpen(o => !o)} count={tags.length} />
      {open && (
        <div style={{ padding: '12px 16px' }}>
          {tags.map(tag => {
            const cardCount = cards.filter(c => c.tagIds.includes(tag.id)).length
            const canDelete = cardCount === 0
            return (
              <div key={tag.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3,
                    background: tag.color, flexShrink: 0 }} />
                  <TextInput
                    value={tag.name}
                    onChange={v => onUpdate(tag.id, 'name', v)}
                    placeholder="Nombre de etiqueta"
                    style={{ flex: 1 }}
                  />
                  {cardCount > 0 && (
                    <span style={{ fontSize: 9, color: T.textGhost, flexShrink: 0 }}>
                      {cardCount}
                    </span>
                  )}
                  <DeleteBtn
                    onClick={() => onDelete(tag.id)}
                    disabled={!canDelete}
                    title={canDelete ? 'Eliminar etiqueta' : `Usada en ${cardCount} tarjeta${cardCount > 1 ? 's' : ''}`}
                  />
                </div>
                <div style={{ marginTop: 5, marginLeft: 16, paddingLeft: 6,
                  borderLeft: `2px solid ${tag.color}33` }}>
                  <ColorPicker value={tag.color} onChange={v => onUpdate(tag.id, 'color', v)} />
                </div>
              </div>
            )
          })}

          <AddBtn onClick={onAdd} label="Añadir etiqueta" />
        </div>
      )}
    </div>
  )
}

// ── Sección: Columnas (solo lectura) ─────────────────────────────────────────
function ColumnsSection() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <SectionHeader label="Columnas" open={open} onToggle={() => setOpen(o => !o)} count={COLUMNS.length} />
      {open && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 9, color: T.textGhost, marginBottom: 10 }}>
            Las columnas son fijas en este sprint. No editables.
          </div>
          {COLUMNS.map(col => (
            <div key={col.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 6, padding: '5px 8px', borderRadius: 5,
              background: col.color, border: `1px solid ${col.border}`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.hl }} />
              <span style={{ fontSize: 11, color: col.hl, fontWeight: 600 }}>{col.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sección: Seguridad ────────────────────────────────────────────────────────
function SecuritySection({ passEditor, onChangePass }) {
  const [open,    setOpen]    = useState(false)
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg,     setMsg]     = useState(null) // {type:'ok'|'err', text}

  const save = () => {
    if (newPass !== confirm) {
      setMsg({ type: 'err', text: 'Las contraseñas no coinciden' })
      return
    }
    onChangePass(newPass)
    setMsg({ type: 'ok', text: newPass ? 'Contraseña guardada' : 'Protección eliminada' })
    setNewPass(''); setConfirm('')
    setTimeout(() => setMsg(null), 2500)
  }

  return (
    <div>
      <SectionHeader label="Acceso editor" open={open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 9, color: T.textGhost, marginBottom: 12 }}>
            {passEditor
              ? '🔒 El modo editor está protegido con contraseña.'
              : '🔓 Sin contraseña — cualquiera puede editar.'}
            <br />Deja los campos vacíos para eliminar la protección.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="password" value={newPass}
              onChange={e => { setNewPass(e.target.value); setMsg(null) }}
              placeholder="Nueva contraseña"
              style={{ background: T.bgDeep, border: `1px solid ${T.borderMid}`,
                borderRadius: 5, color: T.text, fontSize: 12,
                padding: '6px 9px', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', width: '100%' }}
            />
            <input
              type="password" value={confirm}
              onChange={e => { setConfirm(e.target.value); setMsg(null) }}
              placeholder="Confirmar contraseña"
              style={{ background: T.bgDeep,
                border: `1px solid ${msg?.type === 'err' ? T.danger : T.borderMid}`,
                borderRadius: 5, color: T.text, fontSize: 12,
                padding: '6px 9px', outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box', width: '100%' }}
            />
            {msg && (
              <div style={{ fontSize: 10,
                color: msg.type === 'ok' ? '#3fb950' : T.danger }}>
                {msg.text}
              </div>
            )}
            <button onClick={save} style={{
              padding: '6px', borderRadius: 5, cursor: 'pointer',
              background: '#388bfd22', border: '1px solid #388bfd55',
              color: '#388bfd', fontSize: 11, fontWeight: 600,
            }}>
              Guardar contraseña
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sección: Datos ────────────────────────────────────────────────────────────
function DataSection({ cards, onImport }) {
  const [open,    setOpen]    = useState(false)
  const [mode,    setMode]    = useState('add')   // 'add' | 'replace'
  const [msg,     setMsg]     = useState(null)     // {type:'ok'|'err'|'warn', text}
  const [preview, setPreview] = useState(null)     // {cards, errors} antes de confirmar
  const fileRef = useRef(null)

  const handleExport = () => {
    downloadCSV(cards, `canvas-rrhh-${new Date().toISOString().slice(0,10)}.csv`)
  }

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const { cards: imported, errors } = importCSV(ev.target.result)
      setPreview({ cards: imported, errors })
      setMsg(null)
    }
    reader.readAsText(file, 'utf-8')
    // Reset input para que el mismo archivo se pueda reimportar
    e.target.value = ''
  }

  const handleConfirmImport = () => {
    if (!preview) return
    onImport(preview.cards, mode)
    const n = preview.cards.length
    const w = preview.errors.length
    setMsg({
      type: w > 0 ? 'warn' : 'ok',
      text: `${n} tarjeta${n!==1?'s':''} importada${n!==1?'s':''}${w>0?` · ${w} fila${w!==1?'s':''} ignorada${w!==1?'s':''}`:''}`
    })
    setPreview(null)
    setTimeout(() => setMsg(null), 4000)
  }

  const handleCancelPreview = () => setPreview(null)

  return (
    <div>
      <SectionHeader label="Datos" open={open} onToggle={() => setOpen(o => !o)} />
      {open && (
        <div style={{ padding: '12px 16px' }}>

          {/* Export */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: T.textGhost, marginBottom: 8 }}>
              Exporta todas las tarjetas a CSV. El archivo incluye posición, estado, bloqueo y dependencias.
            </div>
            <button onClick={handleExport} disabled={cards.length === 0} style={{
              width: '100%', padding: '7px', borderRadius: 5, cursor: cards.length ? 'pointer' : 'not-allowed',
              background: '#21262d', border: `1px solid ${T.borderMid}`,
              color: cards.length ? T.text : T.textGhost, fontSize: 11, fontWeight: 600,
            }}>
              ↓ Exportar CSV {cards.length > 0 && `(${cards.length} tarjeta${cards.length!==1?'s':''})`}
            </button>
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, margin: '12px 0' }} />

          {/* Import */}
          <div>
            <div style={{ fontSize: 9, color: T.textGhost, marginBottom: 8 }}>
              Importa tarjetas desde un CSV con el mismo formato que el export.
              Las columnas deben coincidir exactamente con la cabecera.
            </div>

            {/* Modo de importación */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
              {[['add','Añadir'],['replace','Reemplazar todo']].map(([val, lbl]) => (
                <button key={val} onClick={() => setMode(val)} style={{
                  flex: 1, padding: '5px', borderRadius: 5, cursor: 'pointer', fontSize: 10,
                  border: `1px solid ${mode===val ? '#388bfd55' : T.borderMid}`,
                  background: mode===val ? '#388bfd1a' : 'transparent',
                  color: mode===val ? '#388bfd' : T.textDim, fontWeight: mode===val ? 600 : 400,
                }}>{lbl}</button>
              ))}
            </div>

            {mode === 'replace' && (
              <div style={{ fontSize: 9, color: '#f0883e', marginBottom: 8,
                padding: '5px 8px', background: '#2d1a0022', borderRadius: 4,
                border: '1px solid #f0883e33' }}>
                ⚠ Reemplazar eliminará todas las tarjetas actuales
              </div>
            )}

            {/* Botón seleccionar archivo */}
            {!preview && (
              <>
                <input ref={fileRef} type="file" accept=".csv,text/csv"
                  onChange={handleFileChange} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} style={{
                  width: '100%', padding: '7px', borderRadius: 5, cursor: 'pointer',
                  background: 'transparent', border: `1px dashed ${T.borderMid}`,
                  color: T.textDim, fontSize: 11,
                }}>
                  ↑ Seleccionar archivo CSV
                </button>
              </>
            )}

            {/* Preview antes de confirmar */}
            {preview && (
              <div style={{ background: T.bgDeep, border: `1px solid ${T.borderMid}`,
                borderRadius: 5, padding: '10px 12px', marginTop: 6 }}>
                <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>
                  <strong>{preview.cards.length}</strong> tarjeta{preview.cards.length!==1?'s':''} listas para importar
                </div>
                {preview.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 9, color: '#f0883e', marginBottom: 2 }}>⚠ {e}</div>
                ))}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={handleCancelPreview} style={{
                    flex: 1, padding: '5px', borderRadius: 5, cursor: 'pointer',
                    background: 'transparent', border: `1px solid ${T.borderMid}`,
                    color: T.textDim, fontSize: 11,
                  }}>Cancelar</button>
                  <button onClick={handleConfirmImport}
                    disabled={preview.cards.length === 0}
                    style={{
                      flex: 2, padding: '5px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                      cursor: preview.cards.length ? 'pointer' : 'not-allowed',
                      background: '#388bfd22', border: '1px solid #388bfd55', color: '#388bfd',
                    }}>
                    Confirmar importación
                  </button>
                </div>
              </div>
            )}

            {/* Feedback post-import */}
            {msg && (
              <div style={{ marginTop: 8, fontSize: 10, padding: '5px 8px', borderRadius: 4,
                color: msg.type==='ok' ? '#3fb950' : '#f0883e',
                background: msg.type==='ok' ? '#23863622' : '#f0883e22',
                border: `1px solid ${msg.type==='ok' ? '#23863655' : '#f0883e44'}`,
              }}>
                {msg.type==='ok' ? '✓' : '⚠'} {msg.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SettingsPanel ─────────────────────────────────────────────────────────────
export default function SettingsPanel({ state, onClose, mut }) {
  // ── Filas ─────────────────────────────────────────────────────────────────
  const addRow = () =>
    mut(d => d.rows.push({ id: uid(), label: 'Nueva fase', h: 200 }))

  const updateRow = (id, field, value) =>
    mut(d => { const r = d.rows.find(r => r.id === id); if (r) r[field] = value })

  const deleteRow = id =>
    mut(d => { d.rows = d.rows.filter(r => r.id !== id) })

  const moveRow = (from, to) => {
    if (to < 0 || to >= state.rows.length) return
    mut(d => {
      const arr = [...d.rows]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      d.rows = arr
    })
  }

  // ── Owners ────────────────────────────────────────────────────────────────
  const addOwner = () =>
    mut(d => d.owners.push({ id: uid(), name: 'Nuevo owner', color: '#6e7681' }))

  const updateOwner = (id, field, value) =>
    mut(d => { const o = d.owners.find(o => o.id === id); if (o) o[field] = value })

  const deleteOwner = id =>
    mut(d => { d.owners = d.owners.filter(o => o.id !== id) })

  // ── Tags ──────────────────────────────────────────────────────────────────
  const addTag = () =>
    mut(d => d.tags.push({ id: uid(), name: 'Nueva etiqueta', color: '#6e7681' }))

  const updateTag = (id, field, value) =>
    mut(d => { const t = d.tags.find(t => t.id === id); if (t) t[field] = value })

  const deleteTag = id =>
    mut(d => { d.tags = d.tags.filter(t => t.id !== id) })

  // ── Import CSV ────────────────────────────────────────────────────────────
  const importCards = (newCards, mode) => {
    mut(d => {
      const cards = newCards.map(c => ({
        ...c,
        id: uid(),  // siempre IDs nuevos para evitar colisiones
      }))
      if (mode === 'replace') {
        d.cards = cards
      } else {
        d.cards = [...d.cards, ...cards]
      }
    })
  }

  // ── Contraseña ────────────────────────────────────────────────────────────
  const changePass = pass =>
    mut(d => { d.passEditor = pass })

  return (
    <div style={{
      width: 380, flexShrink: 0,
      background: T.bg, borderLeft: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Cabecera */}
      <div style={{
        padding: '10px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, letterSpacing: '3px', color: T.textGhost,
            textTransform: 'uppercase', marginBottom: 1 }}>Configuración</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Canvas</div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: T.textDim,
          cursor: 'pointer', fontSize: 18, padding: '0 0 0 4px', lineHeight: 1,
        }}>×</button>
      </div>

      {/* Secciones scrollables */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <RowsSection
          rows={state.rows}
          cards={state.cards}
          onAdd={addRow}
          onUpdate={updateRow}
          onDelete={deleteRow}
          onMove={moveRow}
        />
        <OwnersSection
          owners={state.owners}
          cards={state.cards}
          onAdd={addOwner}
          onUpdate={updateOwner}
          onDelete={deleteOwner}
        />
        <TagsSection
          tags={state.tags}
          cards={state.cards}
          onAdd={addTag}
          onUpdate={updateTag}
          onDelete={deleteTag}
        />
        <ColumnsSection />
        <SecuritySection
          passEditor={state.passEditor}
          onChangePass={changePass}
        />
        <DataSection cards={state.cards} onImport={importCards} />
        <div style={{ height: 28 }} />
      </div>
    </div>
  )
}
