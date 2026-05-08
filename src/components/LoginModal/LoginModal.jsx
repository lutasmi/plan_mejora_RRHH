import { useState, useEffect } from 'react'

// Modal de acceso al modo editor.
// Si passEditor está vacío la llamada a onConfirm('') es inmediata — este modal
// no debería mostrarse en ese caso, pero lo maneja igualmente.

export default function LoginModal({ onConfirm, onCancel }) {
  const [pwd, setPwd]     = useState('')
  const [err, setErr]     = useState(false)
  const [shake, setShake] = useState(false)

  // Foco automático al montar
  useEffect(() => {
    const el = document.getElementById('login-pwd-input')
    if (el) el.focus()
  }, [])

  const submit = () => {
    const ok = onConfirm(pwd)
    if (!ok) {
      setErr(true)
      setShake(true)
      setTimeout(() => setShake(false), 400)
      setPwd('')
    }
  }

  const onKey = e => {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') onCancel()
    setErr(false)
  }

  return (
    // Overlay
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: '#00000088',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      {/* Panel */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 10,
        padding: '28px 28px 24px',
        width: 320,
        transform: shake ? 'translateX(6px)' : 'none',
        transition: shake ? 'none' : 'transform .12s',
      }}>
        {/* Icono */}
        <div style={{ fontSize: 22, textAlign: 'center', marginBottom: 12 }}>🔒</div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#e6edf3',
          textAlign: 'center', marginBottom: 4 }}>
          Modo editor
        </div>
        <div style={{ fontSize: 11, color: '#6e7681', textAlign: 'center', marginBottom: 20 }}>
          Introduce la contraseña para editar el canvas
        </div>

        <input
          id="login-pwd-input"
          type="password"
          value={pwd}
          onChange={e => { setPwd(e.target.value); setErr(false) }}
          onKeyDown={onKey}
          placeholder="Contraseña"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0d1117',
            border: `1px solid ${err ? '#f85149' : '#30363d'}`,
            borderRadius: 6, color: '#e6edf3', fontSize: 13,
            padding: '8px 11px', outline: 'none', marginBottom: 6,
            fontFamily: 'inherit',
          }}
        />

        {err && (
          <div style={{ fontSize: 10, color: '#f85149', marginBottom: 10 }}>
            Contraseña incorrecta
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: err ? 0 : 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '7px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: '1px solid #30363d',
            color: '#6e7681', fontSize: 12,
          }}>
            Cancelar
          </button>
          <button onClick={submit} style={{
            flex: 1, padding: '7px', borderRadius: 6, cursor: 'pointer',
            background: '#388bfd22', border: '1px solid #388bfd55',
            color: '#388bfd', fontSize: 12, fontWeight: 600,
          }}>
            Entrar
          </button>
        </div>
      </div>
    </div>
  )
}
