import { DEFAULT_ROWS } from '../constants/rows'
import { COLUMNS_DEFAULT as COLUMNS } from '../constants/columns'
import { DEFAULT_OWNERS } from '../constants/owners'
import { DEFAULT_TAGS } from '../constants/tags'

// Estado inicial del canvas: estructura base correcta, sin tarjetas ni dependencias.
// Las columnas son fijas (no se guardan en estado — se leen siempre de constants/columns.js).
// Filas, owners y etiquetas son configurables y sí se guardan en estado.

export const initState = () => ({
  rows:    DEFAULT_ROWS.map(r => ({ ...r })),
  owners:  DEFAULT_OWNERS.map(o => ({ ...o })),
  tags:    DEFAULT_TAGS.map(t => ({ ...t })),
  cards:   [],
  passEditor: '',
  colWidths:  Object.fromEntries(COLUMNS.map(c => [c.id, c.w])),
  colConfigs: {},   // { pol: { label?, hl? }, pro: { ... }, ... } — solo overrides
})
