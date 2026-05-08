# Mapa de Transformación RRHH — Canvas Operativo

Canvas visual ejecutivo para el equipo de RRHH. Muestra el estado de transformación de las piezas operativas (Políticas, Procesos, Sistemas, Gobierno y Control) organizadas por fase del ciclo de vida.

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 18 + Vite 5 |
| Persistencia local | `localStorage` (clave `canvas-local-v3`) |
| Persistencia nube | Supabase (tabla `canvas_data`) |
| Deploy | Vercel |

## Estructura del proyecto

```
src/
├── components/
│   ├── Canvas/          ← Grid SVG + capa HTML de tarjetas
│   ├── Card/            ← Componente visual de tarjeta
│   ├── CardDetail/      ← Panel lateral de detalle
│   ├── Header/          ← Header con filtros y toggle de modo
│   ├── LoginModal/      ← Modal de contraseña editor
│   └── SettingsPanel/   ← Configuración: filas, owners, tags, CSV
├── constants/           ← Columnas, filas, estados, owners, tags
├── hooks/               ← useCanvas (estado + persistencia)
├── models/              ← createCard, initState
├── services/            ← persistence.js (Supabase + localStorage)
└── utils/               ← uid, layout, graph (BFS), csv
docs/
└── index-prototype.html ← Prototipo original (backup, no modificar)
```

## Variables de entorno

Crear `.env` en la raíz del proyecto (o configurar en Vercel):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Sin estas variables la app funciona en modo solo local (`localStorage`).

### Tabla Supabase

```sql
create table canvas_data (
  key   text primary key,
  value text not null
);
```

La clave usada es `canvas-v3`.

## Instalación local

```bash
npm install
cp .env.example .env   # añadir credenciales Supabase
npm run dev            # http://localhost:5173
npm run build          # build de producción en /dist
```

## Deploy en Vercel

1. Conectar el repositorio en vercel.com
2. Framework preset: **Vite**
3. Output directory: `dist`
4. Añadir variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

El archivo `vercel.json` ya está configurado para SPA routing.

## Modos de uso

| Modo | Acceso | Permisos |
|---|---|---|
| Público | Directo | Ver tarjetas, filtrar, iluminar flujos |
| Editor | Botón + contraseña opcional | Todo lo anterior + crear, editar, mover, configurar |

La contraseña del modo editor se configura desde Settings → Acceso editor.
Sin contraseña configurada, el acceso al modo editor es libre.

## Datos: export / import

Desde **Settings → Datos** (modo editor):

- **Exportar CSV** — descarga todas las tarjetas con todos sus campos
- **Importar CSV** — añade tarjetas (modo "Añadir") o reemplaza todas (modo "Reemplazar todo")
- El CSV usa `;` como separador de multi-valor (tagIds, deps) y RFC 4180 para campos con comas o comillas

## Modelo de tarjeta

```js
{
  id, name, desc, url,
  columnId,         // pol | pro | sis | gov
  rowId,            // id de fila configurable
  ownerId,          // id de owner configurable
  tagIds: [],       // array de ids de etiqueta
  status,           // no_iniciado | en_ejecucion | bloqueado | completado
  blocker: {
    active, description, area, date
  },
  deps: [],         // ids de tarjetas de las que esta depende
  quarter,          // '2026 Q1' etc.
  x, y              // posición en canvas
}
```
