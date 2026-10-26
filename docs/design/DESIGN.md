# Guía de diseño — Dashboard de ventas (Propuesta B · Suave)

> **Para Claude Code:** este archivo es la fuente de verdad visual del proyecto. Antes de crear o modificar cualquier pantalla o componente de UI, sigue estas reglas. Usa siempre los tokens de `tokens.css` (o el preset de Tailwind `tailwind.preset.js`); **nunca escribas valores hex, tamaños o sombras sueltos** que no estén aquí. Si necesitas algo que no existe, crea el token primero y documéntalo en este archivo.

---

## 1. Principios

1. **Claro y sereno.** Fondo blanco, paneles en gris muy claro `#F6F8FA`. Nada de superficies negras o grafito: el negro solo se usa para texto.
2. **El rojo es acción y énfasis, no decoración.** Botones principales, el dato destacado de un gráfico, alertas. Máximo un bloque grande rojo por vista.
3. **El amarillo marca "hoy / en curso / abierto".** Siempre con texto negro encima.
4. **Números grandes y ligeros.** Las cifras clave mandan; las etiquetas son pequeñas, en mayúsculas y grises.
5. **Todo es redondo.** Píldoras para controles, tarjetas con radios generosos.
6. **Legible y táctil.** Objetivos táctiles ≥ 44 px, contraste AA, nunca información solo por color.

---

## 2. Color

### 2.1 Tokens

| Token | Hex | Uso |
|---|---|---|
| `--color-red` | `#FF443B` | Rojo de marca. Marcas gráficas: barras destacadas, anillos, puntos de notificación, logo, flechas de tendencia. **No poner texto blanco pequeño encima.** |
| `--color-red-strong` | `#D92D25` | Botones primarios (texto blanco), texto/enlaces rojos, iconos activos, píldora "Tarjeta". |
| `--color-red-hover` | `#B3221B` | Hover de enlaces y botones rojos; texto rojo sobre `--color-red-tint`. |
| `--color-red-tint` | `#FFE6E4` | Fondo de chips de alerta ("3 EN COLA"), fondos de icono de alerta. |
| `--color-red-wash` | `#FFF7F6` | Fondo de campos en estado de error (casillas del PIN). |
| `--color-yellow` | `#FFC93C` | Acento: "hoy", "abierta", píldora "Efectivo", avatar. **Siempre con texto `--color-ink`.** |
| `--color-yellow-tint` | `#FFF4CF` | Fondos de icono informativo / tareas no urgentes. |
| `--color-ink` | `#1C1C1E` | Texto principal, títulos, cifras. |
| `--color-ink-2` | `#45484D` | Texto secundario fuerte, items de navegación inactivos, pestañas inactivas. |
| `--color-muted` | `#6B6F76` | Etiquetas, overlines, fechas, ejes de gráfico, línea de meta punteada. |
| `--color-panel` | `#F6F8FA` | Paneles: sidebar, rail, cabecera móvil, tarjetas, inputs, pista de barras de progreso. |
| `--color-surface` | `#FFFFFF` | Fondo de página y elementos elevados dentro de un panel (botones secundarios, filas, sub‑tarjetas). |
| `--color-line` | `#E4E6EA` | Divisores, líneas de cuadrícula, separadores entre KPIs. |
| `--color-line-strong` | `#C9CDD3` | Línea base de gráficos, barras neutras de gráfico, puntos inactivos. |
| `--color-line-soft` | `#ECEEF1` | Bordes sutiles (barra de navegación móvil). |
| `--color-ring` | `#D6D9DE` | Borde de chips sobre panel, pista punteada del anillo. |

### 2.2 Contraste verificado (WCAG 2.1)

| Primer plano | Fondo | Ratio | Veredicto |
|---|---|---|---|
| `#FFFFFF` | `#D92D25` | 4.82 | ✅ AA texto normal — **usar para botones** |
| `#FFFFFF` | `#FF443B` | 3.42 | ⚠️ Solo texto ≥ 24 px o iconos. **No en botones.** |
| `#D92D25` | `#FFFFFF` | 4.82 | ✅ Enlaces/texto rojo |
| `#D92D25` | `#F6F8FA` | 4.53 | ✅ Justo AA |
| `#B3221B` | `#FFE6E4` | 5.60 | ✅ Chips de alerta |
| `#1C1C1E` | `#FFC93C` | 11.08 | ✅ Todo lo amarillo |
| `#1C1C1E` | `#FF443B` | 4.98 | ✅ Texto negro sobre rojo de marca (badges) |
| `#1C1C1E` | `#F6F8FA` | 15.98 | ✅ |
| `#45484D` | `#F6F8FA` | 8.62 | ✅ |
| `#6B6F76` | `#FFFFFF` | 5.05 | ✅ |
| `#6B6F76` | `#F6F8FA` | 4.74 | ✅ |
| `#FFC93C` | `#FFFFFF` | 1.54 | ❌ **Nunca** texto amarillo |
| `#FF443B` | `#FFFFFF` | 3.42 | ❌ Nunca texto pequeño en `--color-red`; usa `--color-red-strong` |

### 2.3 Reglas

- Texto rojo → siempre `--color-red-strong`, nunca `--color-red`.
- Botón con texto blanco → fondo `--color-red-strong`.
- Amarillo → solo como relleno, con texto `--color-ink`.
- Panel sobre página blanca: `--color-panel`. Elemento elevado dentro de un panel: `--color-surface` (blanco) + sombra `--shadow-raised` si es interactivo.
- No usar degradados, ni negros/grafitos como fondo.

---

## 3. Tipografía

Fuentes (Google Fonts):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@300;400;500;600&display=swap" rel="stylesheet">
```

- **Inter Tight** (`--font-display`): títulos, cifras/KPIs, números grandes. Tracking negativo.
- **Inter** (`--font-ui`): todo lo demás (navegación, cuerpo, botones, etiquetas).

| Rol | Fuente | Peso | Tamaño / interlínea | Tracking | Uso |
|---|---|---|---|---|---|
| `display` | Inter Tight | 600 | 32 / 1.1 (tablet 27, móvil 23) [decisión del usuario: fuentes más pequeñas] | -0.9px | Saludo de página |
| `kpi-xl` | Inter Tight | 400 | 44 / 1 | -1.6px | Cifra héroe en móvil |
| `kpi` | Inter Tight | 400 | 36 / 1 (tablet 29, móvil 24) | -1.2px | KPIs de cabecera |
| `stat` | Inter Tight | 500 | 28 / 1.1 | -0.8px | Cifras en tarjetas (7h 12m, 3:20) |
| `card-title-lg` | Inter Tight | 400 | 21 / 1.15 | -0.5px | Título "editorial" de tarjeta |
| `h2` | Inter | 700 | 15 / 1.3 | 0 | Título de tarjeta |
| `value` | Inter Tight | 600 | 17 / 1.2 | 0 | Montos en mini‑tarjetas |
| `brand` | Inter Tight | 600 | 17 / 1 | -0.4px | Marca "Argos" del panel lateral |
| `body` | Inter | 400–600 | 14 / 1.45 (tablet 13) | 0 | Texto general, botones (600) |
| `caption` | Inter | 400 | 12–13 / 1.45 | 0 | Subtítulos, fechas, leyendas |
| `overline` | Inter | 600 | 11 / 1.3 (tablet/móvil 10) | 0.8–1.2px, MAYÚSCULAS | Etiquetas de KPI, de sección |

Escala reducida [decisión del usuario: fuentes más pequeñas]: PREVALECE sobre la guía de Downloads (DESIGN (2).md: display 40, kpi 44, h2 17…) en este punto; el usuario pidió títulos moderados como en su imagen de referencia. Token nuevo `--text-avatar` (700 13 px, iniciales del avatar). Ningún tamaño de fuente va suelto fuera de tokens (única excepción: 16 px del input invisible del PIN, para evitar el zoom de iOS).

Reglas: cifras con `font-variant-numeric: tabular-nums` en tablas y listas. Máximo 2 pesos por tarjeta.

---

## 4. Espaciado, radios y sombras

**Base 4 px.** Escala: `4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32`.

| Contexto | Valor |
|---|---|
| Padding de página (web) | 16 px exterior, 24 px gap entre sidebar y contenido |
| Gap entre tarjetas | 18 px web · 14–16 px tablet · 12–14 px móvil |
| Padding de tarjeta | 20×22 px web · 18×20 px tablet · 16–18 px móvil |
| Gap interno (filas, chips) | 8–12 px |

| Radio | Valor | Uso |
|---|---|---|
| `--radius-pill` | 9999px | Botones, chips, pestañas, inputs, barras de progreso, nav items |
| `--radius-panel` | 28px | Sidebar web |
| `--radius-card` | 24px (tablet/móvil 22px) | Tarjetas |
| `--radius-header-mobile` | 0 0 32px 32px | Cabecera móvil |
| `--radius-inner` | 16px (14px compacto) | Sub‑tarjetas y filas dentro de tarjetas |
| `--radius-icon` | 10px | Contenedores de icono cuadrados |
| Barras de gráfico | 10px 10px 4px 4px | Top redondeado, base casi recta |

| Sombra | Valor | Uso |
|---|---|---|
| `--shadow-active` | `0 1px 2px rgba(28,28,30,.05), 0 6px 16px rgba(28,28,30,.06)` | Item de navegación activo |
| `--shadow-raised` | `0 2px 8px rgba(28,28,30,.08)` | Pestaña activa, botones blancos sobre panel |
| `--shadow-cta` | `0 10px 22px -10px rgba(217,45,37,.6)` | Botón circular rojo flotante |
| `--shadow-floating` | `0 12px 30px rgba(28,28,30,.08)` | Barra de navegación inferior móvil |

Las tarjetas **no** llevan sombra: se separan por color (`panel` sobre blanco).

---

Tamaños de componentes base (`--size-*`) y `--color-scrim` (fondo del modal) viven en `tokens.css`.

---

## 5. Layout responsivo

| Breakpoint | Navegación | Contenido |
|---|---|---|
| **Web ≥ 1280 px** | Sidebar `--color-panel`, ancho 236 px, radio 28, con etiquetas, sección "MENÚ" [decisión del usuario, DESIGN (2).md] ("GESTIÓN" y tarjeta de caja no existen en el Módulo 1) y sin perfil al pie (el perfil vive en la barra superior) | Barra superior común a web, tablet y móvil [decisión del usuario, DESIGN (2).md]: fecha y hora en vivo a la izquierda, buscador, acción primaria de la página (slot), notificaciones y a la derecha el perfil con menú desplegable (§6.16). Buscador y campana van visibles pero deshabilitados (`aria-disabled`, `title="Próximamente"`) hasta que exista su backend. Debajo, el selector de tienda del operador (el de compañía vive en el panel lateral, bajo el logo: botón con avatar de iniciales, «COMPAÑÍA ACTIVA» y nombre; popover «CAMBIAR COMPAÑÍA» con nombre y código, verificación en la activa y «Gestionar compañías»; riel: solo avatar; móvil: avatar en la barra superior) [decisión del usuario] → cabecera de la página (`.topbar`) → saludo + píldoras de pago + KPIs → grilla de 3 columnas (1fr · 1fr · 2fr) |
| **Tablet 768–1279 px** | Rail de iconos 84 px a todo el alto, `--color-panel`; activo = círculo blanco 52 px con icono rojo y `--shadow-active`; botón "Nueva venta" rojo, sin avatar al pie | Barra superior con el perfil solo avatar + chevron (§6.16) → cabecera 64 px (saludo + KPIs a la derecha) → fila de píldoras 56 px → 3 columnas (250 · 250 · resto) |
| **Móvil < 768 px** | Barra inferior flotante: píldora blanca 68 px, borde `--color-line-soft`, `--shadow-floating`; activo = píldora `--color-panel` con icono rojo + etiqueta; botón central rojo 52 px | Cabecera `--color-panel` con radio inferior 32 que agrupa saludo, cifra héroe, KPIs y píldoras → tarjetas apiladas |

En web, usa `flex-wrap` (sidebar `flex: 1 1 236px`, contenido `flex: 999 1 560px; min-width: 0`) para que el sidebar se apile en pantallas estrechas. Tablas anchas dentro de un contenedor con `overflow-x: auto`.

---

## 6. Componentes

### 6.1 Botones
| Variante | Estilo |
|---|---|
| **Primario** | Fondo `--color-red-strong`, texto blanco 600, alto 40 en escritorio, 44 con puntero táctil (`pointer: coarse`) y en móvil, radio pill, padding 0 16–18px [decisión del usuario, DESIGN (2).md] (la guía decía 44 / 48). Icono opcional a la izquierda (18 px). |
| **Secundario** | Fondo blanco sobre panel (o `--color-panel` sobre blanco), texto `--color-ink` 600, alto 40–44, radio pill. |
| **Icono** | Círculo 44 px. Blanco sobre panel con `--shadow-raised`, o `--color-panel` sobre blanco. Siempre `aria-label`. |
| **CTA circular** | Círculo 52 px, `--color-red-strong`, icono blanco 22 px, `--shadow-cta`. |
| **Filtro** | Círculo 40 px blanco con icono `--color-red-strong`. |

Hover: rojo → `--color-red-hover` con texto blanco; blanco → `--color-panel` con texto ink [mi decisión: se fija el color del texto en hover, focus-visible y active porque el `a:hover` global lo volvía rojo sobre rojo]. Los botones solo-icono llevan `aria-label` y `title` (tooltip nativo) con el mismo texto.

### 6.2 Navegación
- **Item sidebar:** alto 40 (era 46), radio pill, padding 0 14px, gap 12, icono 18 px (era 19) [decisión del usuario, DESIGN (2).md]. Inactivo `--color-ink-2` 500. Activo: fondo blanco, texto `--color-ink` 600, icono `--color-red-strong`, punto rojo 7 px a la derecha, `--shadow-active`.
- **Badge de contador:** 22 px, pill, fondo `--color-red-tint`, texto `--color-red-hover` 700 12 px.
- **Punto de notificación:** 7–8 px `--color-red`.
- **Overline de sección:** `overline` en `--color-muted`.

### 6.3 KPI de cabecera
Cifra `kpi` con flecha de tendencia (`--color-red`, 15–18 px, trazo 2.4) a la izquierda; debajo, overline alineado a la derecha. Separados por `border-left: 1px solid var(--color-line)` y padding 0 18–20 px.

### 6.4 Píldoras de reparto de pago
Overline arriba + píldora 30–32 px de alto, ancho fijo 88–110 px, texto 12 px 700 con el porcentaje:
- Efectivo → `--color-yellow` / texto ink
- Tarjeta → `--color-red-strong` / texto blanco
- Transferencia → `--color-panel` / texto ink

### 6.5 Barra de meta
Pista `--color-panel` (blanca si está dentro de un panel), alto 30–32, radio pill. Relleno `--color-red` con padding 3–4 px y una etiqueta blanca interna (`76%`, texto ink 700 12 px). Siempre `role="progressbar"` con `aria-valuenow/min/max`.

### 6.6 Tarjeta (panel)
Fondo `--color-panel`, radio card, sin borde ni sombra. Cabecera: `h2` a la izquierda y chip o botón secundario a la derecha.

Variantes:
- **Estado (turno de caja):** icono en círculo 36–40 px `--color-red-tint` + `--color-red-strong`; chip blanco "EN TURNO"; overlines muted; cifra `stat`.
- **Editorial (pedidos pendientes):** título `card-title-lg` en 2 líneas, chip de alerta, dos botones icono blancos y paginador de puntos (activo rojo, inactivos `--color-line-strong`).

### 6.7 Chips
| Tipo | Estilo |
|---|---|
| Neutro | Fondo blanco, texto ink, 10–12 px 600, padding 4–6px 10–12px, tracking 0.8px |
| Alerta | Fondo `--color-red-tint`, texto `--color-red-hover` 700 |
| Abierto / hoy | Fondo `--color-yellow`, texto ink 700 |
| Sobre gráfico | Blanco, borde 1px `--color-ring`, texto ink 700 |

### 6.8 Fila de tarea / lista
Fondo blanco dentro de panel, radio inner, padding 10–12, gap 10–12. Icono circular 32–36 px: urgente `--color-red-tint` + `--color-red-strong`; normal `--color-yellow-tint` + ink. Título 600, subtítulo `caption` muted. Menú "⋯" como botón icono 44 px transparente.

### 6.9 Acordeón
Botones a todo el ancho, alto 48–52, texto 600, chevron 15–16 px a la derecha (abierto: chevron arriba en `--color-red-strong`). Separador `--color-line`. Usar `aria-expanded`.

### 6.10 Pestañas segmentadas
Contenedor sin fondo, gap 4–6. Activa: fondo blanco, texto ink 700, `--shadow-raised`. Inactiva: transparente, `--color-ink-2`. Alto 36, radio pill. `role="tablist"` / `role="tab"` / `aria-selected`.

### 6.11 Anillo de tiempo
SVG rotado -90°: pista punteada `--color-ring` (dasharray 3 6) + arco en `--color-red` en 4 segmentos (`pathLength="400"`, `stroke-dasharray="60 40"`, trazo 8, `linecap: round`). Centro: círculo blanco con cifra `stat` y overline "MIN / CLIENTE".

### 6.12 Inputs
Buscador: alto 40 (44 táctil), radio pill, fondo `--color-panel` (sin borde), icono lupa 18 px a 14 px del borde, padding izquierdo 40 px. Siempre con `<label>` (puede estar visualmente oculto).

### 6.16 Perfil y menú desplegable [decisión del usuario, DESIGN (2).md]
El perfil va **arriba a la derecha** (nunca en el sidebar ni en el rail). En el operador la barra conserva el cambiador de tienda.
- **Disparador:** `<button>` con `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` y `aria-label="Perfil de …"`. Separado del resto de la barra por `border-left: 1px solid var(--color-line)` y padding-left 14 px. Web: avatar + nombre (600) + rol (`caption` muted) + chevron; tablet: avatar + chevron; móvil: solo avatar. Abierto: fondo `--color-panel` y chevron girado 180°.
- **Menú:** `role="menu"`, alineado a la derecha, `top: calc(100% + 10px)`, ancho `--size-menu` (272), fondo blanco, borde `1px --color-line-soft`, `--radius-card`, padding 8, `--shadow-menu`.
  - Cabecera: avatar + nombre (600) + `usuario · rol` (`caption` muted), divisor `--color-line-soft`. El usuario solo existe para operadores; administradores y superadmin muestran su correo.
  - Opciones (`role="menuitem"`, alto `--size-control`, radio inner, hover `--color-panel`), con icono en círculo de `--size-icon-circle` (32): "Ver perfil" (enlace a `/perfil`) y "Cerrar sesión" (icono sobre `--color-red-tint`, texto `--color-red-strong` 600; siempre la última).
- **Comportamiento:** abre y cierra con clic en el disparador; se cierra con clic fuera, Escape y al elegir una opción; al abrir el foco pasa a la primera opción y al cerrar vuelve al disparador; ↑/↓, Inicio y Fin mueven el foco. La confirmación por caja abierta de la guía no aplica al Módulo 1 (no hay caja).

### 6.13 Avatar
Círculo 40–48 px, fondo `--color-yellow`, iniciales ink 700 13 px (`--text-avatar`), `role="img"` + `aria-label` con el nombre.

### 6.14 Campo de PIN (6 casillas)
Para el acceso con PIN **no se usa teclado numérico en pantalla**: se muestran 6 casillas y el sistema abre su propio teclado numérico.

- **Estructura:** un **único** `<input>` real (`type="password"`, `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength="6"`, `autocomplete="one-time-code"`, `font-size: 16px` para evitar el zoom en iOS) colocado de forma invisible (`opacity: 0`, `position: absolute; inset: 0`) encima de 6 casillas decorativas (`aria-hidden="true"`). Así se puede pegar el PIN, funciona el autocompletado y los lectores de pantalla leen un solo campo. No uses 6 inputs separados.
- **Etiqueta:** `<label for>` "PIN" + texto de ayuda enlazado con `aria-describedby` ("Faltan 2 dígitos." / "PIN completo.").
- **Casillas:** grilla de 6 columnas iguales, gap 10 px (móvil) / 12 px (web); alto 60 px (móvil) / 68 px (web); radio 14 / 16 px; fondo blanco sobre `--color-panel`.
  - Vacía: borde `1.5px solid var(--color-line)`.
  - Activa (la siguiente por rellenar): borde `2px solid var(--color-red-strong)` + `box-shadow: 0 0 0 4px var(--color-red-tint)` + cursor vertical rojo 2×26 px.
  - Llena: borde `1.5px solid var(--color-line-strong)` y un punto `--color-ink` de 12 px (o el dígito en Inter Tight 26–28 px si "Mostrar" está activo).
  - Error: todas con borde `2px solid var(--color-red-strong)` y fondo `--color-red-wash`; mensaje con `role="alert"` en `--color-red-hover` con icono. Al volver a escribir se quita el error. En este sistema el texto es siempre el mismo mensaje genérico y **nunca indica los intentos que quedan** (`screens/MODULO-1-PANTALLAS.md`, A-05).
- **Mostrar / Ocultar:** botón de texto rojo (`--color-red-strong`, 13 px 600) a la derecha de la etiqueta, con icono de ojo y `aria-pressed`.
- **Validación:** filtrar todo lo que no sea dígito (`value.replace(/\D/g, '')`) y cortar a 6.
- **Botón "Entrar":** desactivado hasta que haya usuario y 6 dígitos (fondo `--color-line`, texto `--color-muted`); activo en `--color-red-strong` con texto blanco, alto 56 px, radio pill. Debajo o encima, el enlace "¿Olvidaste tu PIN?".

### 6.15 Carga (placeholders)
Tres patrones, según lo que se espera. Las clases están en `tokens.css`.

| Situación | Patrón | Clase |
|---|---|---|
| Se carga el **contenido** de una pantalla o tarjeta | Placeholder con la misma forma y tamaño del contenido final | `.skeleton` (+ `.skeleton-text`, `.skeleton-title`, `.skeleton-circle`, `.skeleton-pill`); `.skeleton-on-panel` dentro de un panel |
| Se ejecuta una **acción** (guardar, entrar, cambiar PIN) | Indicador dentro del botón, que queda desactivado y cambia su texto ("Entrando…") | `.spinner` |
| Se **navega** entre pantallas | Barra roja fina arriba | `.route-progress` |

Reglas:
- El placeholder replica el diseño final (mismas alturas, anchos y número de filas) para que al llegar el contenido nada se mueva.
- No mostrar placeholders si la carga dura menos de 150 ms: espera ese tiempo antes de pintarlos para evitar parpadeos.
- El contenedor lleva `aria-busy="true"` y un texto `.sr-only` "Cargando…". Al terminar, se quita `aria-busy`.
- El brillo recorre en bucle solo mientras se carga. Con `prefers-reduced-motion` el placeholder se queda quieto, el spinner gira más lento y la barra de ruta queda fija.
- Sobre blanco usa `--skeleton-on-surface`; dentro de un panel, `--skeleton-on-panel`. Nunca grises sueltos.
- En Next.js cada ruta con datos lleva su `loading.tsx` con el placeholder de su propia pantalla.

---

### Tokens de estado y de componentes (guía ampliada)
Estados `--color-success|warning|danger|info` con `-tint` y `-border` (y `--color-warning-text`, `--color-danger-text`, `--color-warning-dot`); campos `--color-placeholder`, `--color-disabled-bg|text`, `--color-field-error-bg` (= `--color-red-wash`), `--color-row-selected`, `--color-hover`, `--color-overlay`; `--focus-ring` (botones, enlaces) y `--focus-ring-field` (campos); radios `--radius-dialog|popover|toast|textarea|option|checkbox|alert|alert-compact|tooltip`; sombras `--shadow-popover|toast|dialog|tooltip|card-open`; tamaños `--size-control-lg|field|option|checkbox|switch-*|badge|chip-filter|tag|counter|table-head|table-row|step*|icon-circle-lg|icon-circle-xl|toast|popover-max`; capas `--z-*`. Todos en `tokens.css`.

> **[decisión del usuario] Densidad:** las alturas de 40/44/48/52 px de esta guía se aplican con `--size-control` (40; 44 táctil/móvil) y `--size-field` (= `--size-control`), no con 48 fijo; los pesos tipográficos mantienen la escala reducida de §3. Donde el texto diga "48 px" para un campo, lee `--size-field`.

### 6.17 Campos de texto
- **Anatomía:** etiqueta (14 px 600, siempre visible encima; "(opcional)" en `--color-muted` si aplica) → campo → texto de ayuda o error (13 px). Nunca uses el placeholder como etiqueta.
- **Campo:** alto `--size-field`, radio pill, borde `1.5px solid var(--color-line)`, fondo blanco, padding 0 18 px, texto 15 px (16 px en móvil), placeholder `--color-placeholder`.
- **Estados:**
  | Estado | Estilo |
  |---|---|
  | Normal | borde `--color-line` |
  | Con valor | borde `--color-line-strong` |
  | Foco | borde `2px --color-red-strong` + `box-shadow: var(--focus-ring-field)` |
  | Error | borde `2px --color-danger`, fondo `--color-field-error-bg`, mensaje `--color-danger-text` 600 con icono, `aria-invalid="true"` + `aria-describedby` |
  | Desactivado | fondo `--color-panel`, borde `--color-line-soft`, texto `--color-disabled-text` |
  | Solo lectura | fondo `--color-panel`, sin borde, texto ink |
- **Variantes:**
  - *Búsqueda:* icono a la izquierda (padding 44 px), atajo "⌘ K" a la derecha en chip `--color-panel`.
  - *Contraseña:* botón ojo de 40 px dentro, a la derecha, con `aria-label` "Mostrar/Ocultar contraseña" y `aria-pressed`.
  - *Moneda:* prefijo "$" en `--color-muted` + sufijo "USD" en chip `--color-panel`; `inputmode="decimal"`; números `tabular-nums`.
  - *Cantidad:* botones − (panel) y + (rojo) de 40 px dentro del campo; valor centrado 600.
  - *Fecha:* formato dd/mm/aaaa, icono de calendario a la derecha.
  - *Teléfono:* prefijo de país en chip `--color-panel` dentro del campo.
  - *Área de texto:* radio `--radius-textarea` (16 px), padding 14×18, mínimo 3 líneas, contador "n/200" a la derecha bajo el campo.
- Valida al salir del campo (blur) y al enviar, no en cada tecla. El mensaje de error dice cómo arreglarlo ("Escribe al menos 3 caracteres").

### 6.18 Casillas, radio e interruptores
- **Checkbox:** 22 px, radio `--radius-checkbox` (7 px). Sin marcar: blanco con borde `1.5px --color-line-strong`. Marcado: relleno `--color-red-strong` con check blanco. Indeterminado: relleno rojo con guion blanco. Desactivado: `--color-panel` + borde `--color-line`, texto `--color-disabled-text`.
- **Radio:** 22 px circular. Seleccionado: borde `2px --color-red-strong` + punto interior rojo de 10 px.
- **Switch:** pista 48×28, perilla blanca 22 px con sombra suave. Activo: pista `--color-red-strong`, perilla a la derecha. Inactivo: pista `--color-line-strong`. Usa `<button role="switch" aria-checked>`.
- Toda la fila (etiqueta + control) es clicable, alto mínimo 44 px. Agrupa con `<fieldset>` + `<legend>`.
- Hasta 7 opciones excluyentes → radio. Más → select.

### 6.19 Select
- **Disparador:** igual que un campo de texto (48 px, pill) + chevron 16 px a la derecha que gira 180° al abrir. `aria-haspopup="listbox"`, `aria-expanded`.
- **Lista desplegable:** `role="listbox"`, fondo blanco, borde `1px --color-line-soft`, radio `--radius-popover` (20 px), padding 6 px, `--shadow-popover`, a 8 px bajo el disparador, máx. ~320 px de alto con scroll.
- **Opciones:** `role="option"`, alto 44 px, radio `--radius-option` (12 px), padding 0 12 px. Hover: `--color-panel`. Seleccionada: `--color-panel`, texto 600 y check `--color-red-strong` a la derecha (`aria-selected="true"`). Desactivada: `--color-disabled-text` + subtítulo con el motivo.
- **Grupos:** encabezado overline 11 px `--color-muted` (padding 10 12 4).
- Teclado: ↑/↓ mueve, Enter elige, Esc cierra, escribir una letra salta a la opción. Más de 10 opciones → añade búsqueda (combobox).
- Estados del disparador (normal, con valor, error, desactivado) iguales que 6.17.

### 6.20 Multiselect
- **Disparador:** contenedor de alto mínimo 48 px, radio 26 px, que crece en altura; muestra las elecciones como **etiquetas** (alto 30 px, `--color-panel`, 13 px 600, botón ✕ de 24 px con `aria-label="Quitar …"`). Máximo 3 visibles + etiqueta "+N" (``--color-hover``, `--color-ink-2`, sin ✕). Vacío: placeholder "Elige una o varias".
- **Panel:** como el select, más:
  1. Buscador interno (alto 40, pill, `--color-panel`).
  2. Opciones con checkbox (6.18) + etiqueta + dato secundario a la derecha ("24 productos"). `aria-multiselectable="true"`.
  3. Mensaje "Sin resultados para "…"" cuando el filtro no encuentra nada.
  4. Pie con borde superior: "Limpiar" (botón Texto) y "Aplicar (n)" (Primario pequeño).
- El panel no se cierra al marcar opciones; se cierra con "Aplicar", Esc o clic fuera.

### 6.21 Alertas en línea
Para mensajes dentro de la página que necesitan atención.
- Contenedor: padding 18 px, radio 20 px, gap 14 px, fondo `--color-*-tint` y borde `1px --color-*-border` del tipo.
- Icono en círculo de 32 px: info = blanco con borde `--color-line-strong` + icono ink; éxito = `--color-success` + check blanco; aviso = `--color-warning` + "!" ink; error = `--color-danger` + ✕ blanco.
- Título 600–700 ink, texto `--color-ink-2`, acción opcional como enlace 600 en el color de texto del tipo (`--color-success`, `--color-warning-text`, `--color-danger-text`, ink para info). Botón ✕ de 36 px para cerrar.
- `role="alert"` para error; `role="status"` para el resto.
- **Compacta** (dentro de formularios/tarjetas): una línea, padding 10×14, radio 14 px, fondo tint, punto de 8 px del color del tipo, texto 13 px 500 ink.

### 6.22 Banner de página
Franja a todo el ancho arriba del contenido, para estados que afectan a toda la app (sin conexión, caja cerrada, prueba gratuita). Fondo tint del tipo, icono en círculo de 28 px, texto con la parte clave en negrita y un botón blanco pequeño a la derecha. Máximo un banner a la vez.

### 6.23 Notificaciones flotantes (toast)
- Abajo a la derecha (móvil: centrado, encima de la barra inferior), apiladas con gap 10 px, ancho 360–400 px, máximo 3.
- Fondo blanco, radio `--radius-toast` (18 px), `--shadow-toast`, padding 12 px. Icono en círculo de 30 px (colores de 6.21), título 600 + texto 12 px muted, acción como botón Texto ("Deshacer", "Reintentar", "Ver"), ✕ de 32 px.
- Duración: 5 s (éxito/info); los de error no desaparecen solos. Pausa al pasar el ratón. `role="status"` / `role="alert"`.

### 6.24 Diálogos
- **Cuándo:** solo para decisiones que bloquean (confirmar, anular, formularios cortos). Para avisos usa alertas o toasts.
- **Fondo:** `--color-overlay`. **Caja:** blanca, radio `--radius-dialog` (28 px), padding 28 px, `--shadow-dialog`, ancho 420 px (confirmación) a 480–560 px (formulario).
- **Contenido:** icono en círculo de 48 px (amarillo tint para avisos, rojo tint para destructivos) → título en pregunta (Inter Tight 24 px 600) → texto 15 px `--color-ink-2` → contenido opcional (resumen en caja `--color-panel` radio 16, o campos) → acciones alineadas a la derecha, gap 10 px: Secundario ("Cancelar"/"Mantener venta") + Primario con el verbo exacto ("Cerrar turno", "Anular venta").
- **Destructivo:** `role="alertdialog"`, explica la consecuencia y que no se puede deshacer (en negrita); pide motivo si aplica.
- **Formulario de página [decisión del usuario]:** ancho `--size-form` (480 px, 100% en móvil), definido solo en `FormShell`.
- **Con formulario:** cabecera con título 22 px + botón ✕ de 40 px (`--color-panel`), pie con borde superior `--color-line-soft`.
- **Accesibilidad:** `role="dialog"` + `aria-modal="true"` + `aria-labelledby` / `aria-describedby`; foco atrapado dentro; el foco inicial va al primer campo o al botón seguro (Cancelar) en los destructivos; Esc cierra; al cerrar, el foco vuelve al botón que lo abrió; el scroll de la página se bloquea.
- **Móvil:** se abre como **hoja inferior**: radio 28 px solo arriba, asa de 40×5 px `--color-ring`, opciones grandes (52 px) y botón principal a todo el ancho (52 px).

### 6.25 Insignias y chips
- **Insignia de estado:** alto 26 px, pill, padding 0 10 px, 12 px 600, punto de 6 px. Éxito "Pagado" (`--color-success-tint` / `--color-success`), Aviso "Pendiente" (`--color-warning-tint` / `--color-warning-text`, punto `--color-warning-dot`), Error "Anulado" (`--color-danger-tint` / `--color-danger-text`), Neutro "Borrador" (``--color-hover`` / `--color-ink-2`), Nuevo (`--color-yellow` / ink).
- **Contador:** 22 px, pill, `--color-red-strong` con texto blanco 12 px 700.
- **Chip de filtro:** alto 36 px, pill, 13 px 600. Inactivo: blanco con borde `1.5px --color-ring`. Activo: `--color-red-tint` / `--color-red-hover` con check. `aria-pressed`.
- **Chip quitable:** `--color-panel` con botón ✕ de 28 px.

### 6.26 Navegación secundaria
- **Migas de pan:** `<nav aria-label="Migas de pan">` + `<ol>`, 14 px; enlaces `--color-ink-2`, separador chevron 14 px `--color-line-strong`, página actual ink 600 con `aria-current="page"`.
- **Paginación:** botones circulares de 40 px; anterior/siguiente en `--color-panel`; página actual `--color-red-strong` con texto blanco y `aria-current="page"`; "…" para saltos. A la izquierda "Mostrando 11–20 de 186" en `--color-muted`.
- **Tooltip:** fondo blanco, borde `1px --color-line-soft`, radio 12 px, sombra `--shadow-tooltip`, texto 13 px 500, flecha de 10 px. Aparece tras 400 ms de hover o con foco; `role="tooltip"` enlazado con `aria-describedby`. Nunca contenido esencial solo en un tooltip.
- **Avatar:** 32 / 40 / 48 px, iniciales 700. Colores: `--color-yellow`, `--color-red-tint` (texto `--color-red-hover`), `--color-panel`. Grupo: superpuestos −10 px con borde blanco de 2 px y "+N" en ``--color-hover``.

### 6.27 Tabla, carga y estado vacío
- **Tabla:** encabezados overline 11 px `--color-muted`, celdas 14 px con padding 12 px, divisores `--color-line-soft`, números alineados a la derecha con `tabular-nums`, estado como insignia (6.25), acciones con botón "⋯" de 40 px (`aria-label` con el id de la fila). Hover de fila: `--color-panel`. Dentro de un contenedor con `overflow-x: auto`.
- **Barra de progreso:** alto 8 px, pista `--color-panel`, relleno `--color-red`; etiqueta y porcentaje encima. `role="progressbar"`.
- **Spinner:** 24 px, borde 3 px `--color-red-tint` con lado superior `--color-red-strong`, giro 0.8 s, con texto "Cargando…" (`role="status"`).
- **Skeleton:** bloques ``--color-hover`` / ``--skeleton-on-surface`` con la forma del contenido final (círculo para avatar, píldoras para texto). Usar si la carga supera 300 ms.
- **Estado vacío:** centrado, icono en círculo de 64 px (blanco sobre panel, icono rojo), título Inter Tight 20 px 600, una frase en `--color-muted` y, si aplica, el botón primario que resuelve el vacío ("Nueva venta").

---

> Las secciones 6.28–6.33 son los **componentes de navegación y datos**. Maquetas en `components/mockups/`.

### 6.28 Tabs
Tres variantes; todas con `role="tablist"` / `role="tab"` + `aria-selected` / `role="tabpanel"`, y flechas ←/→ para moverse entre pestañas (tabindex móvil: solo la activa es tabulable).

| Variante | Cuándo | Estilo |
|---|---|---|
| **Subrayado** | Secciones de una misma página (detalle de producto, perfil) | Pestañas de texto 15 px, gap 22 px, alto 44, sobre una línea inferior `1px --color-line`. Inactiva: `--color-ink-2` 500. Activa: ink 700 + barra inferior de 3 px `--color-red-strong` (radio 3 px arriba). Contador opcional: píldora 20 px (``--color-hover``/`--color-ink-2`; activa `--color-red-tint`/`--color-red-hover`). |
| **Segmentado** | Cambiar vista o periodo (Hoy/Semana/Mes), máx. 4 opciones cortas | Contenedor ``--color-hover`` pill, padding 4 px; activa blanca ink 700 con `--shadow-raised`. Alto 36. |
| **En tarjeta** | Dentro de un panel gris (gráficos) | Sin contenedor; activa blanca con `--shadow-raised`; punto de color de 8 px opcional que identifica la serie. |

Si no caben, la fila hace scroll horizontal (nunca dos líneas de pestañas). En móvil, el subrayado ocupa todo el ancho con scroll.

### 6.29 Breadcrumbs
Amplía 6.26.
- **Simple:** enlaces `--color-ink-2` (hover: ink + subrayado), separador chevron 14 px `--color-line-strong`, actual ink 600 con `aria-current="page"`.
- **Con inicio:** el primer nivel es un botón circular de 32 px (`--color-panel`) con icono de casa y `aria-label="Inicio"`.
- **Colapsado:** con más de 4 niveles se muestran el primero, "…" y los dos últimos. "…" es un botón pill 28 px (`--color-panel`, 700) que abre un menú (estilo 6.16) con los niveles ocultos.
- **Móvil:** solo un enlace "‹ Nivel anterior" (chevron rojo, texto ink 600, alto 44).

### 6.30 Steps (pasos)
Para procesos de 3–5 pasos (venta, apertura de caja, alta de producto). `<ol>` con `aria-current="step"` en el paso actual.
- **Círculo:** 36 px horizontal / 30 px vertical, número 13–14 px 700.
  | Estado | Estilo |
  |---|---|
  | Completado | relleno `--color-red-strong`, check blanco |
  | Actual | blanco, borde `2px --color-red-strong`, número rojo, halo `0 0 0 4px var(--color-red-tint)`; título ink 700 |
  | Pendiente | `--color-panel`, borde `1.5px --color-line`, número `--color-muted`; título `--color-muted` 500 |
  | Error | `--color-danger-tint`, borde `2px --color-danger`, "!" `--color-danger-text`; título y subtítulo en `--color-danger-text` ("Pago rechazado") |
- **Conector:** línea de 2 px (horizontal entre círculos con margen 12 px; vertical bajo el círculo). Roja hasta el último paso completado; `--color-line` después.
- **Horizontal:** columnas iguales; título 14 px + subtítulo 12 px `--color-muted` bajo el círculo. Botones "Atrás" (Secundario) y "Siguiente"/"Finalizar" (Primario) en el pie del proceso.
- **Vertical:** el paso actual despliega su contenido (tarjeta blanca dentro del panel) con su acción.
- **Compacto (móvil):** overline "PASO 2 DE 4" + "Siguiente: Pago" a la derecha, título del paso (Inter Tight 20 px) y barra segmentada de 4 tramos de 6 px (completados `--color-red-strong`, actual `--color-red` al 55 %, pendientes `--color-line`). `role="progressbar"`.

### 6.31 Acordeones
El encabezado completo es un `<button>` dentro de un `<h3>`, con `aria-expanded` y `aria-controls`; el contenido es `role="region"` con `aria-labelledby`. Chevron 16 px que gira 180° al abrir. Enter/Espacio abren y cierran.

| Variante | Comportamiento | Estilo |
|---|---|---|
| **Lista** | Una sección abierta a la vez (ayuda, FAQ) | Dentro de un panel `--color-panel` radio 24; filas de 56 px separadas por `1px --color-line`; título 15 px 600; hover ``--color-hover`` radio 14; abierta: chevron rojo y texto `--color-ink-2`. |
| **Tarjetas** | Varias abiertas (formularios largos por bloques) | Cada sección es una tarjeta radio 20, gap 10 px. Cerrada: `--color-panel`. Abierta: blanca con borde `1.5px --color-line` y sombra `--shadow-card-open`. Título 15 px 600 + subtítulo 12 px; chevron en círculo de 32 px (abierta: `--color-red-tint`/rojo). Insignia de aviso si falta un dato. |
| **Con icono y resumen** | Una abierta (historial de turnos, pedidos) | Encabezado de 68 px: icono en círculo de 40 px + título/subtítulo + dato clave (Inter Tight 18 px) + insignia de estado + chevron. El detalle se alinea con el título (sangría 66 px). Desactivada: todo en `--color-disabled-text`, `disabled`. |

### 6.32 Secciones del sidebar
Amplía 6.2.
- **Estructura:** logo → buscador opcional (alto 40, blanco, "⌘K") → secciones → pie (botón "Contraer menú" o tarjeta de caja).
- **Sección:** título overline 11 px `--color-muted` (padding 0 12 px, margen inferior 6 px) + 2–5 opciones. Gap entre secciones 16 px. Orden recomendado: MENÚ (uso diario), GESTIÓN, CONFIGURACIÓN.
- **Opción:** alto 44, pill, padding 0 14 px, icono 19 px + texto 14 px; hover ``--color-hover``. Activa: blanca, 600, icono `--color-red-strong`, punto rojo de 7 px, `--shadow-active`, `aria-current="page"`.
- **Insignias en la opción:** contador `--color-red-strong`/blanco (elementos nuevos, ej. 12 pedidos); alerta `--color-red-tint`/`--color-red-hover` (ej. 3 de inventario); "NUEVO" `--color-yellow`/ink 10 px 700 (función nueva).
- **Submenú:** un solo nivel. El padre es un `<button aria-expanded>` (no navega) con chevron; texto ink 600 e icono rojo si un hijo está activo. Hijos: alto 40, sangría 36 px, guía vertical de 1.5 px `--color-line` a 23 px del borde; hijo activo como opción activa.
- **Sección plegable:** el título es un botón con chevron 14 px; plegada muestra "· n ocultos". Recordar el estado por usuario.
- **Colapsado:** riel de 84 px (ver tabla 5), iconos en círculos de 52 px, divisores de 28×1.5 px entre secciones, insignias como punto rojo de 8 px con aro del color del panel, tooltip (6.26) con nombre + dato al hacer hover/foco, botón "Expandir menú" al pie.

### 6.33 Datatable
Para listados con más de ~10 filas que se buscan, filtran u ordenan. Contenedor con borde `1px --color-line-soft`, radio 24.
1. **Barra superior** (padding 20×24): título Inter Tight 22 px + "n pedidos · Hoy" muted; a la derecha "Exportar" (Contorno, 40 px) y la acción principal (Primario, 40 px).
2. **Filtros** (padding 0 24 16): buscador 300 px (fondo `--color-panel`, sin borde); chips de estado con contador (6.25, activo `--color-red-tint`); selector de fecha (Contorno); "Columnas" (Texto) a la derecha.
3. **Barra de acciones en lote** (aparece al seleccionar): fondo `--color-warning-tint`, radio 16, "n seleccionados" 700 + "Quitar selección" (texto `--color-warning-text`) y a la derecha acciones blancas (Exportar, Imprimir) y "Anular" en estilo Peligro. `role="region"`.
4. **Encabezado:** fila `--color-panel`, alto 44, overline 11 px `--color-muted`. Columnas ordenables: botón con doble flecha 12 px (`--color-line-strong`; la dirección activa en `--color-red-strong`, texto ink) y `aria-sort` en el `<th>`. Primera columna: checkbox "seleccionar página" con estado mixto (`aria-checked="mixed"`).
5. **Filas:** alto 60, divisor `--color-line-soft`, hover `--color-panel`, seleccionada `--color-row-selected` (`#FFF4F3`). Id como enlace ink 600; cliente con avatar de 30 px; números a la derecha `tabular-nums` (total 700); estado con insignia (6.25); última columna "⋯" (40 px, `aria-haspopup="menu"`) que abre menú: Ver detalle, Imprimir, divisor, acción destructiva en rojo.
6. **Vacío:** fila única centrada con título, frase y "Limpiar filtros".
7. **Pie** (padding 14×24): "Filas por página" + selector (8 / 25 / 50), "1–8 de 14", paginación (6.26) con anterior/siguiente desactivados en los extremos.
- **Carga:** 5 filas skeleton con la forma de las columnas. **Orden por defecto:** el más reciente primero. La selección se mantiene al cambiar de página.
- **Móvil (< 768 px):** la tabla se convierte en **tarjetas** (una por fila: id + estado arriba, cliente y hora, total grande a la derecha, "⋯"); filtros en una hoja inferior con botón "Filtros (n)"; la selección múltiple se activa con un botón "Seleccionar".

### 6.34 Datepicker [ampliada: DESIGN (4).md]
- **El campo manda:** siempre se puede escribir la fecha (`dd/mm/aaaa`, `inputmode="numeric"`, las barras se insertan solas). El calendario es una ayuda que se abre con el icono o con ↓ [decisión del repo: no al enfocar, para que el autoenfoque de un diálogo no lo abra]. No uses el `<input type="date">` nativo en escritorio (su aspecto no se puede controlar); en móvil sí puede usarse el nativo si se prefiere.
- **Densidad del repo [decisión del usuario]:** gana la escala reducida de §3 y `--size-field`/`--size-control`, no los 48/40/42 px de la maqueta: día = `--size-day` (36), campo = `--size-field`, botones ‹ › = `--size-close`; columna de atajos `--size-calendar-presets`. Radio del popover `--radius-popover`, z `--z-popup` (sobre diálogos).
- **Campo:** igual que 6.17 + icono de calendario 18 px a la derecha (rojo cuando está abierto). Error: "Esa fecha no existe…" / "La fecha final debe ser posterior a la inicial".
- **Popover:** blanco, radio 22, `--shadow-popover`, padding 14–16 px.
  - Cabecera: ‹ / › en círculos de 36 px (`--color-panel`; desactivado si el mes no se puede elegir) y, al centro, "Octubre ▾" "2026 ▾" (Inter Tight 16 px 600) que abren la vista de meses/años (grilla 3×4 de píldoras de 44 px).
  - Días de la semana: L M X J V S D, 11 px 600 `--color-muted`. **La semana empieza en lunes.**
  - Día: círculo de 40 px (36 en rango doble, 38 en móvil), 14 px `tabular-nums`. Hover `--color-panel`. Hoy: aro `inset 0 0 0 1.5px` ink. Seleccionado: `--color-red-strong` con texto blanco 700. No disponible (futuro en reportes, pasado en entregas): `--color-line-strong`, `disabled`. Días de otros meses: ocultos o en `--color-line-strong`, no clicables.
  - Pie (fecha única): "Hoy" (Texto rojo) y "Borrar".
- **Rango:**
  - Primer clic = inicio, segundo = fin (si el segundo es anterior, se intercambian). Extremos en círculo rojo; días intermedios con banda `--color-red-tint` de lado a lado y texto `--color-red-hover` 600; la banda empieza/acaba a mitad del círculo de los extremos.
  - Escritorio: **columna de atajos** a la izquierda (170 px, fondo `--color-panel`): Hoy, Ayer, Últimos 7 días, Últimos 30 días, Este mes, Mes pasado, Personalizado. El atajo activo va blanco con texto `--color-red-hover` 700. Elegir en el calendario activa "Personalizado".
  - Dos meses a la vista (el actual a la derecha) en escritorio; uno en filtros compactos.
  - Pie: campos "Desde" y "Hasta" editables, "n días", "Cancelar" (Secundario) y "Aplicar" (Primario, desactivado hasta tener fin).
  - El botón que lo abre muestra el rango ("20 – 26 oct 2026").
- **Móvil:** hoja inferior (6.24) con atajos como chips con scroll horizontal, un mes, resumen "20 oct – 26 oct · 7 días" en la cabecera y "Aplicar" a todo el ancho.
- **Accesibilidad:** `role="dialog"` con `aria-label`; grilla `role="grid"`, cada día `<button>` con `aria-label="26 de octubre de 2026, hoy"`; flechas mueven el foco por día, RePág/AvPág por mes, Inicio/Fin por semana, Enter elige, Esc cierra y devuelve el foco al campo.

### 6.35 Barra de filtros de una página
Para listados con filtros (Historial, Ventas, Usuarios). Va **directamente sobre la tabla, en una sola fila**, sin envolverla en otro panel.
- **Orden:** buscador de texto (240 px, fondo `--color-panel`) · separador vertical 1×24 px · filtros · "Limpiar filtros" (Texto rojo) alineado a la derecha, visible solo si hay algún filtro activo.
- **Filtro sin valor:** píldora de 40 px, borde `1.5px --color-ring`, texto 13 px 600 con el nombre en `--color-muted` y el valor en ink ("Acción: Todas ▾"). Abre un select/multiselect (6.19/6.20) o el datepicker (6.34).
- **Filtro con valor:** fondo `--color-red-tint`, texto `--color-red-hover`, avatar o icono a la izquierda si aplica (avatar + "Quién: Raul R."), y botón ✕ de 28 px para quitarlo (`aria-label="Quitar filtro Quién"`). Abierto: borde `2px --color-red-strong` + halo.
- **Se aplican al instante** (sin botón "Filtrar"). La URL guarda los filtros para poder compartir la vista.
- Si la página tiene secciones (módulos), van como **tabs subrayado con contador** (6.28) entre el título y los filtros, nunca como botones sueltos.
- Nunca dejes el foco/halo rojo fijo en un filtro que no se está editando: el halo significa "abierto ahora".

### 6.36 Tabla de historial (auditoría)
Variante de 6.33 para registros de actividad.
- **Agrupada por día:** fila de grupo con overline "HOY · LUNES 26 DE OCTUBRE · 3 operaciones" (padding 16 20 6, `--color-muted`). Así la columna de tiempo solo muestra la hora (`17:41:12`, 600, `tabular-nums`).
- **Columnas:** detalle (chevron) · Hora · Quién (avatar 30 px + nombre; "Sistema" con icono de engranaje) · Acción (insignia: Creación = éxito, Edición = aviso, Eliminación = error, Acceso = neutro) · Módulo (solo en la pestaña "Todos") · Entidad (tipo en `--color-ink-2` + nombre 600 + ID en chip monoespaciado) · Canal (icono + Web / App / Sistema / API).
- **No repitas datos:** si la pestaña ya filtra el módulo, oculta la columna Módulo; si "Quién" es el sistema, el canal no vuelve a decir "Sistema" como insignia.
- **Ver cambios:** las filas de edición/creación tienen un botón chevron (32 px, `--color-panel`; abierto `--color-red-tint` y girado 90°) que despliega debajo una tarjeta blanca con la tabla Campo · Antes → Después. "Antes" en `--color-danger-tint` / `--color-danger-text` tachado; "Después" en `--color-success-tint` / `--color-success` 600.
- Orden fijo: del más reciente al más antiguo (no se ofrece ordenar por columnas).

---

## 7. Gráficos

- **Barras semanales:** barras neutras `--color-line-strong`; **mejor día** `--color-red`; **hoy (en curso)** `--color-yellow`. Ancho máx. 40–44 px, gap 10–12, radio 10 10 4 4.
- **Valores:** solo se rotulan las barras destacadas (mejor día y hoy), 11–12 px 700 encima de la barra.
- **Meta:** línea horizontal `1.5px dashed var(--color-muted)` + chip "Meta 6,5" a la derecha.
- **Ejes:** etiquetas 10–11 px `--color-muted`; cuadrícula `--color-line`; línea base `--color-line-strong`.
- **Leyenda obligatoria** (cuadrados 9–10 px, radio 3) cuando hay más de un color.
- **Accesibilidad:** cada barra con `role="img"` y `aria-label` ("Sábado: 9,05 mil dólares, mejor día"). Nunca codificar solo con color: el día de hoy también va en negrita en el eje.
- Un solo eje Y. Nada de gráficos 3D, tartas ni degradados.

---

## 8. Iconografía

- Estilo **lineal**, `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"` (2.2–2.6 en iconos pequeños dentro de botones), `stroke-linecap="round"`, `stroke-linejoin="round"`.
- Tamaños: 18 px (botones), 19–21 px (navegación), 22 px (CTA).
- Librería recomendada: **Lucide** (`lucide-react`), que coincide con este estilo.
- Decorativos con `aria-hidden="true"`. Nunca emojis como iconos.

---

## 9. Contenido y formato

- Idioma: español. Tono cercano y directo ("Bienvenida, Ana", "Nueva venta", "Cerrar turno").
- Moneda: `$7.640` (punto de miles), decimales con coma: `$41,08`. Usa `Intl.NumberFormat('es', …)`.
- Fechas: "Domingo, 25 de octubre · 15:14".
- Overlines en MAYÚSCULAS cortas: "VENTAS HOY", "TICKET PROMEDIO", "3 EN COLA".

---

## 10. Accesibilidad (obligatorio)

- Objetivos táctiles ≥ 44×44 px.
- Elementos interactivos reales: `<button>`, `<a href>`, `<input>` + `<label>`. Nunca `onClick` en `<div>`.
- Botones solo‑icono con `aria-label`.
- Contraste según la tabla 2.2.
- Estados no solo por color (icono, texto o peso además del color).
- Navegación con `aria-current="page"` en el item activo.

---

## 11. Hacer / No hacer

| ✅ Hacer | ❌ No hacer |
|---|---|
| Paneles `#F6F8FA` sobre fondo blanco | Fondos negros, grafito o degradados |
| Texto blanco sobre `#D92D25` | Texto blanco pequeño sobre `#FF443B` |
| Amarillo con texto negro | Texto o iconos amarillos sobre blanco |
| Un acento rojo dominante por vista | Varias tarjetas rojas compitiendo |
| Cifras grandes en Inter Tight | Cifras en negrita pesada (700+) a gran tamaño |
| Separar tarjetas por color | Bordes y sombras en todas las tarjetas |
| Tokens de `tokens.css` | Hex o px sueltos en componentes |

---

## 12. Checklist antes de entregar una pantalla

- [ ] Solo se usan tokens de esta guía.
- [ ] Funciona en web (sidebar), tablet (rail) y móvil (barra inferior).
- [ ] Botones primarios en `--color-red-strong` con texto blanco.
- [ ] Amarillo siempre con texto ink.
- [ ] Cada gráfico tiene leyenda, `aria-label` por marca y solo valores destacados rotulados.
- [ ] Todos los controles miden ≥ 44 px y tienen etiqueta accesible.
- [ ] Números formateados en español.

---

## 13. Librería Argos UI [decisión del usuario]
- **Ubicación:** componentes en `components/ui/` del proyecto, sin paquete aparte. Galería de evaluación manual solo en desarrollo: `/ui`.
- **Primitivas:** las complejas (select, multiselect, diálogo, tabs, acordeón, tooltip, menú, toast) usan `@base-ui/react` (sin estilo; aportan accesibilidad y teclado) con nuestros tokens y atributos de datos (`data-open`, `data-checked`, etc.). Los envoltorios son Client Components.
- **Escala tipográfica:** se mantiene la reducida de §3; no se adopta la de la guía ampliada (40/32/28, kpi 52/44, stat 34, 26, 17, 20).
- **Sin Chakra ni CSS-in-JS.** Solo CSS con tokens y, si hace falta, utilidades de Tailwind v4.
- **Referencia:** `components/DESIGN-ampliada.md`, `tokens-ampliados.css`, `tailwind-preset-v3.js` y maquetas `components/mockups/*.dc.html`. El spec manda sobre el código.

### CompanySelector (selector de compañía activa) [decisión del usuario]
Menu de Base UI en el panel lateral, bajo la marca. Disparador con borde fino `--color-line`, avatar cuadrado redondeado (`--radius-icon`, iniciales, color de paleta determinista por código: yellow/ink, red-tint/red-hover, success-tint/success, hover/ink-2), `.eyebrow` «Compañía activa», nombre 600 y `ChevronsUpDown`. El rótulo usa `--text-eyebrow-sm` (600 10 px/1.3) y `--tracking-eyebrow-sm` (0.4 px), también en «Cambiar compañía»: ancho útil del texto 236−28 (padding) −2 (borde) −18 (padding botón) −36 (avatar) −20 (gaps) −16 (chevron) = 116 px frente a ≈106 px de «COMPAÑÍA ACTIVA» (15 car. ≈ 6,7 px + 0,4 px); `--color-muted` sobre blanco ≈ 5:1 (AA). Popover `.menu-popup`: rótulo «Cambiar compañía», `Menu.RadioGroup` (`aria-checked`, activa con `--color-panel` y check `--color-red-strong`), código en `--font-mono` caption, separador y «Gestionar compañías» (`/companias`). Teclado, Escape y clic fuera de Base UI; foco vuelve al botón. Tablet: solo avatar con `title` y `aria-label` «Compañía activa: …». Móvil: botón compacto con el avatar al inicio de la barra superior. Sin compañías o para operador no se pinta.
