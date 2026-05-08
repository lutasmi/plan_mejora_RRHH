// BFS completo upstream + downstream sobre el grafo de dependencias.
//
// El grafo es dirigido: card.deps = ["id_de_la_que_dependo"].
// Una flecha A → B significa "B depende de A" (A es prerequisito de B).
//
// getRelated(id, cards) devuelve un Set con:
//   - el propio nodo
//   - todos los ancestros (de los que este depende, recursivo)
//   - todos los descendientes (los que dependen de este, recursivo)

export function getRelated(id, cards) {
  if (!id || !cards?.length) return new Set()

  // Índices para BFS eficiente
  // deps[id]    = Set de ids de los que id depende   (upstream)
  // rdeps[id]   = Set de ids que dependen de id      (downstream)
  const deps  = {}
  const rdeps = {}
  cards.forEach(c => {
    deps[c.id]  = new Set(c.deps ?? [])
    rdeps[c.id] = rdeps[c.id] ?? new Set()
    ;(c.deps ?? []).forEach(d => {
      rdeps[d] = rdeps[d] ?? new Set()
      rdeps[d].add(c.id)
    })
  })

  const visited = new Set([id])
  const queue   = [id]

  while (queue.length) {
    const cur = queue.shift()
    // upstream: lo que cur necesita
    ;(deps[cur]  ?? new Set()).forEach(n => { if (!visited.has(n)) { visited.add(n); queue.push(n) } })
    // downstream: lo que necesita a cur
    ;(rdeps[cur] ?? new Set()).forEach(n => { if (!visited.has(n)) { visited.add(n); queue.push(n) } })
  }

  return visited
}
