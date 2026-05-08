import { uid } from '../utils/uid'

export const createCard = (overrides = {}) => ({
  id:       uid(),
  name:     'Nueva pieza operativa',
  desc:     '',
  url:      '',

  columnId: null,
  rowId:    null,

  ownerId:  'o1',
  tagIds:   [],

  status:   'no_iniciado',

  blocker: {
    active:      false,
    description: '',
    area:        '',
    date:        '',
  },

  deps:    [],
  quarter: '',

  offsetX: 20,   // posición relativa al borde izquierdo de la columna
  offsetY: 20,   // posición relativa al borde superior de la fila
  ...overrides,
})
