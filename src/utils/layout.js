export const ROW_LABEL_W = 148
export const HDR_H       = 44
export const CARD_W      = 210
export const CARD_PADDING = 14
export const CARD_MIN_H  = 80   // altura mínima estimada de una tarjeta renderizada

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

export const totalCanvasW = columns =>
  ROW_LABEL_W + columns.reduce((s, c) => s + c.w, 0)

export const totalCanvasH = rows =>
  HDR_H + rows.reduce((s, r) => s + r.h, 0)

// Resuelve la posición absoluta en canvas de una tarjeta a partir de
// su columnId, rowId y offsets relativos.
// Devuelve { x, y } listos para usar en el transform del wrapper HTML.
export const resolveCardPos = (card, rows, columns) => {
  const ci = columns.findIndex(c => c.id === card.columnId)
  const ri = rows.findIndex(r => r.id === card.rowId)
  const colX = ci >= 0 ? getPillarX(columns, ci) : ROW_LABEL_W
  const rowY = ri >= 0 ? getRowY(rows, ri)        : HDR_H
  return {
    x: colX + (card.offsetX ?? 20),
    y: rowY + (card.offsetY ?? 20),
  }
}

// Expande la altura de las filas para acomodar tarjetas que sobresalen.
// Usa resolveCardPos en vez de card.x/y.
export const computedRows = (rows, cards, columns) =>
  rows.map((row, ri) => {
    const rowCards = cards.filter(c => c.rowId === row.id)
    if (!rowCards.length) return row
    const rowY0  = getRowY(rows, ri)
    let maxBottom = rowY0 + row.h
    rowCards.forEach(c => {
      if (!columns) return
      const { y } = resolveCardPos(c, rows, columns)
      maxBottom = Math.max(maxBottom, y + CARD_MIN_H + CARD_PADDING)
    })
    return { ...row, h: Math.max(row.h, maxBottom - rowY0) }
  })
