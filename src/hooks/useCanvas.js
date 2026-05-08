import { useState, useEffect, useRef } from 'react'
import { load, save } from '../services/persistence'
import { initState } from '../models/initState'

// Hook central del canvas.
// Gestiona el estado global, la carga inicial y el guardado con debounce.
//
// Devuelve:
//   state    — estado completo del canvas (null mientras carga)
//   mut(fn)  — mutación inmutable: fn recibe un draft clonado y lo modifica in-place
//   loading  — true durante la carga inicial
//   saved    — false mientras hay cambios pendientes de guardar
//   saveOk   — false si el último guardado fue solo localStorage (sin nube)

export function useCanvas() {
  const [state,   setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved,   setSaved]   = useState(true)
  const [saveOk,  setSaveOk]  = useState(true)
  const saveTimer = useRef(null)

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    load().then(({ data }) => {
      setState(data ?? initState())
      setLoading(false)
    })
  }, [])

  // ── Debounce save: se dispara cada vez que state cambia ────────────────────
  useEffect(() => {
    if (!state || loading) return
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      save(state).then(ok => {
        setSaved(true)
        setSaveOk(ok)
      })
    }, 900)
    return () => clearTimeout(saveTimer.current)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guardado de emergencia antes de cerrar pestaña ─────────────────────────
  useEffect(() => {
    const flush = () => {
      if (state) {
        try { localStorage.setItem('canvas-local-v3', JSON.stringify(state)) } catch (_) {}
      }
    }
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [state])

  // ── Mutación inmutable ─────────────────────────────────────────────────────
  // fn recibe una copia profunda del estado y lo modifica in-place.
  // Mismo patrón que el prototipo original.
  const mut = fn => {
    setState(s => {
      const draft = JSON.parse(JSON.stringify(s))
      fn(draft)
      return draft
    })
  }

  return { state, mut, loading, saved, saveOk }
}
