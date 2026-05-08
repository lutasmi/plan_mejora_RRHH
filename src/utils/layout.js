// Constantes de layout del canvas
export const ROW_LABEL_W = 148
export const HDR_H = 44
export const CARD_W = 210
export const CARD_PADDING = 14

// X absoluta donde empieza la columna idx
export const getPillarX = (columns, idx) => {
  let x = ROW_LABEL_W
  for (let i = 0; i < idx; i++) x += columns[i].w
  return x
}

// Y absoluta donde empieza la fila idx
export const getRowY = (rows, idx) => {
  let y = HDR_H
  for (let i = 0; i < idx; i++) y += rows[i].h
  return y
}

// Ancho total del canvas
export const totalCanvasW = columns =>
  ROW_LABEL_W + columns.reduce((s, c) => s + c.w, 0)

// Alto total del canvas
export const totalCanvasH = rows =>
  HDR_H + rows.reduce((s, r) => s + r.h, 0)

// Expande la altura de las filas para acomodar tarjetas fuera del límite
export const computedRows = (rows, cards) =>
  rows.map((row, ri) => {
    const rowCards = cards.filter(c => c.rowId === row.id)
    if (!rowCards.length) return row
    const rowY = getRowY(rows, ri)
    let maxBottom = rowY + row.h
    rowCards.forEach(c => {
      maxBottom = Math.max(maxBottom, c.y + 120 + CARD_PADDING)
    })
    return { ...row, h: Math.max(row.h, maxBottom - rowY) }
  })
