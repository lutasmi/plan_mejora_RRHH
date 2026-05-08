import { uid } from '../utils/uid'

// Shape completo de una tarjeta según Product Definition v1.
//
// Sin: steps, bridges, publicado (booleano), completado (booleano), pillarId (renombrado a columnId)
// Con: status (enum), blocker (objeto), quarter (texto libre), columnId, rowId

export const createCard = (overrides = {}) => ({
  id:       uid(),
  name:     'Nueva pieza operativa',
  desc:     '',
  url:      '',

  columnId: null,          // id de columna (pol | pro | sis | gov)
  rowId:    null,          // id de fila

  ownerId:  'o1',          // referencia a owner
  tagIds:   [],            // array de ids de etiqueta

  status:   'no_iniciado', // no_iniciado | en_ejecucion | bloqueado | completado

  blocker: {               // bloqueo asociado a la tarjeta (no es el estado, es el objeto)
    active:      false,
    description: '',
    area:        '',
    date:        '',
  },

  deps:    [],             // ids de tarjetas de las que esta depende (salientes)

  quarter: '',             // campo libre: "2026 Q1", "2026 Q2", etc.

  x: 0,                   // posición en canvas
  y: 0,
  ...overrides,
})
