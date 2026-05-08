// Estados válidos de una tarjeta.
// Una tarjeta solo puede estar en uno de estos 4 estados.

export const STATUSES = [
  { id: 'no_iniciado',  label: 'No iniciado',  color: '#6e7681' },
  { id: 'en_ejecucion', label: 'En ejecución', color: '#388bfd' },
  { id: 'bloqueado',    label: 'Bloqueado',    color: '#f85149' },
  { id: 'completado',   label: 'Completado',   color: '#3fb950' },
]

export const STATUS_IDS = STATUSES.map(s => s.id)

export const getStatus = id => STATUSES.find(s => s.id === id) ?? STATUSES[0]
