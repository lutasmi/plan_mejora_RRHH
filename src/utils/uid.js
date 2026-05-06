// Genera un id corto único. Suficiente para uso cliente sin backend.
export const uid = () => Math.random().toString(36).slice(2, 9)
