# Sprint 01 — Foundation Refactor 

## Objetivo

Reestructurar el prototipo actual respetando estrictamente el documento `product-definition-v1.md`.

NO rediseñar el producto.
NO añadir nuevas funcionalidades fuera del alcance definido.
NO convertir la herramienta en un gestor de tareas.

---

# Objetivos del sprint

## 1. Reestructuración técnica

Migrar el proyecto desde un único HTML a una estructura React + Vite ordenada.

Separar:

- componentes
- estilos
- modelo de datos
- persistencia
- constantes
- utilidades

---

## 2. Mantener stack actual

Mantener:

- React
- Supabase
- Vercel
- localStorage

NO introducir:

- backend nuevo
- Redux
- TypeScript
- librerías UI pesadas
- autenticación compleja
- frameworks adicionales

---

## 3. Ajustar modelo funcional

Actualizar columnas definitivas:

- Políticas
- Procesos
- Sistemas
- Gobierno y Control

Eliminar columna:
- Eficiencia

---

## 4. Modelo de tarjeta

Separar claramente:

- estado
- bloqueo
- owner
- etiquetas

Estados válidos:

- no iniciado
- en ejecución
- bloqueado
- completado

---

## 5. Dependencias

Mantener dependencias visibles pero suaves visualmente.

Al seleccionar una tarjeta:
- iluminar upstream
- iluminar downstream
- suavizar resto del canvas

---

## 6. Mantener filosofía visual

La vista principal debe seguir siendo:

- limpia
- visual
- ejecutiva
- enfocada a conversación

NO añadir:
- subtareas visibles
- listas operativas
- exceso de detalle
- dashboards complejos
- Gantt

---

## 7. Resultado esperado

El resultado del sprint debe ser:

- mismo producto conceptual
- código ordenado
- arquitectura mantenible
- modelo preparado para evolucionar
- canvas más claro visualmente

NO debe cambiar la esencia del producto.