import { useState } from 'react'
import { resolveColumns } from './constants/columns'
import { useCanvas } from './hooks/useCanvas'
import Canvas from './components/Canvas/Canvas'
import CardDetail from './components/CardDetail/CardDetail'
import Header from './components/Header/Header'
import LoginModal from './components/LoginModal/LoginModal'
import SettingsPanel from './components/SettingsPanel/SettingsPanel'
import { createCard } from './models/card'
import { getRelated } from './utils/graph'

export default function App() {
  const { state, mut, loading, saved, saveOk } = useCanvas()

  // ── Modo ──────────────────────────────────────────────────────────────────
  const [mode,      setMode]      = useState('public')
  const [showLogin, setShowLogin] = useState(false)
  const isEditor = mode === 'editor'

  const handleEnterEditor = () => {
    if (!state?.passEditor) setMode('editor')
    else setShowLogin(true)
  }
  const handleLogin = pwd => {
    if (pwd === state.passEditor) { setMode('editor'); setShowLogin(false); return true }
    return false
  }
  const handleExitEditor = () => { setMode('public'); setSelCard(null); setShowSettings(false) }

  // ── Settings ──────────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false)

  // Al abrir settings cerramos el panel de tarjeta
  const handleOpenSettings = () => { setSelCard(null); setShowSettings(true) }

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({ statuses: [], ownerIds: [], tagIds: [] })

  const toggleFilter = (type, value) =>
    setFilters(f => ({
      ...f,
      [type]: f[type].includes(value) ? f[type].filter(v => v !== value) : [...f[type], value],
    }))
  const clearFilters = () => setFilters({ statuses: [], ownerIds: [], tagIds: [] })

  const isVisible = card => {
    if (filters.statuses.length && !filters.statuses.includes(card.status))              return false
    if (filters.ownerIds.length && !filters.ownerIds.includes(card.ownerId))             return false
    if (filters.tagIds.length   && !filters.tagIds.some(t => card.tagIds.includes(t)))  return false
    return true
  }
  const hasFilter = filters.statuses.length > 0 || filters.ownerIds.length > 0 || filters.tagIds.length > 0

  // ── Selección / highlight ─────────────────────────────────────────────────
  const [selCard, setSelCard] = useState(null)
  const [hlCard,  setHlCard]  = useState(null)

  const columns      = resolveColumns(state?.colConfigs, state?.colWidths)
  const related      = getRelated(hlCard, state?.cards ?? [])
  const selectedCard = state?.cards.find(c => c.id === selCard) ?? null

  // ── Handlers canvas ───────────────────────────────────────────────────────
  const handleColumnResize = (id, w) => mut(d => { d.colWidths[id] = w })
  const handleUpdateColumn = (id, field, value) =>
    mut(d => {
      if (!d.colConfigs) d.colConfigs = {}
      if (!d.colConfigs[id]) d.colConfigs[id] = {}
      d.colConfigs[id][field] = value
    })
  const handleRowResize    = (id, h) => mut(d => { const r = d.rows.find(r => r.id === id); if (r) r.h = h })

  const handleAddCard = (columnId, rowId, offsetX = 20, offsetY = 20) => {
    const card = createCard({ columnId, rowId, offsetX, offsetY })
    mut(d => { d.cards.push(card) })
    setSelCard(card.id)
    setShowSettings(false)
  }

  const handleMoveCard = (id, offsetX, offsetY) =>
    mut(d => { const c = d.cards.find(c => c.id === id); if (c) { c.offsetX = offsetX; c.offsetY = offsetY } })
  const handleSelectCard = id => {
    setSelCard(id)
    if (id) setShowSettings(false) // cerrar settings al seleccionar tarjeta
    if (!id) setHlCard(null)
  }
  const handleHlCard = id => setHlCard(prev => prev === id ? null : id)

  // ── Handlers CardDetail ───────────────────────────────────────────────────
  const handleUpdateCard = updated =>
    mut(d => {
      const i = d.cards.findIndex(c => c.id === updated.id)
      if (i === -1) return
      const prev = d.cards[i]
      // Reset offset si cambia la celda lógica — evita que la tarjeta quede fuera
      if (updated.columnId !== prev.columnId || updated.rowId !== prev.rowId) {
        updated = { ...updated, offsetX: 20, offsetY: 20 }
      }
      d.cards[i] = updated
    })

  const handleDeleteCard = id => {
    mut(d => {
      d.cards = d.cards.filter(c => c.id !== id)
      d.cards.forEach(c => { c.deps = (c.deps ?? []).filter(dep => dep !== id) })
    })
    setSelCard(null)
    setHlCard(null)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'#0d1117' }}>
      <div style={{ fontSize:11, color:'#484f58', letterSpacing:'3px' }}>CARGANDO…</div>
    </div>
  )

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

      <Header
        mode={mode}
        onEnterEditor={handleEnterEditor}
        onExitEditor={handleExitEditor}
        filters={filters}
        onToggle={toggleFilter}
        onClear={clearFilters}
        owners={state.owners}
        tags={state.tags}
        saved={saved}
        saveOk={saveOk}
        onOpenSettings={handleOpenSettings}
      />

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <Canvas
          columns={columns}
          rows={state.rows}
          cards={state.cards}
          owners={state.owners}
          tags={state.tags}
          canEdit={isEditor}
          selCard={selCard}
          hlCard={hlCard}
          related={related}
          hasFilter={hasFilter}
          isVisible={isVisible}
          onSelectCard={handleSelectCard}
          onHlCard={handleHlCard}
          onMoveCard={handleMoveCard}
          onAddCard={handleAddCard}
          onColumnResize={handleColumnResize}
          onRowResize={handleRowResize}
        />

        {/* Panel derecho: CardDetail o Settings — nunca ambos */}
        {showSettings && isEditor
          ? <SettingsPanel
              state={state}
              columns={columns}
              mut={mut}
              onUpdateColumn={handleUpdateColumn}
              onClose={() => setShowSettings(false)}
            />
          : selectedCard
            ? <CardDetail
                card={selectedCard}
                allCards={state.cards}
                columns={columns}
                owners={state.owners}
                tags={state.tags}
                rows={state.rows}
                canEdit={isEditor}
                onUpdate={handleUpdateCard}
                onDelete={handleDeleteCard}
                onClose={() => setSelCard(null)}
              />
            : null
        }
      </div>

      {showLogin && (
        <LoginModal
          onConfirm={handleLogin}
          onCancel={() => setShowLogin(false)}
        />
      )}

    </div>
  )
}
