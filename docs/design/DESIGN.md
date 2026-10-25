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
| `display` | Inter Tight | 600 | 40 / 1.1 (tablet 32, móvil 28) | -1.2px | Saludo de página |
| `kpi-xl` | Inter Tight | 400 | 52 / 1 | -2px | Cifra héroe en móvil |
| `kpi` | Inter Tight | 400 | 44 / 1 (tablet 34, móvil 28) | -1.6px | KPIs de cabecera |
| `stat` | Inter Tight | 500 | 34 / 1.1 | -1px | Cifras en tarjetas (7h 12m, 3:20) |
| `card-title-lg` | Inter Tight | 400 | 26 / 1.15 | -0.6px | Título "editorial" de tarjeta |
| `h2` | Inter | 700 | 17 / 1.3 (tablet 16) | 0 | Título de tarjeta |
| `value` | Inter Tight | 600 | 20 / 1.2 | 0 | Montos en mini‑tarjetas |
| `body` | Inter | 400–600 | 14 / 1.45 (tablet 13) | 0 | Texto general, botones (600) |
| `caption` | Inter | 400 | 12–13 / 1.45 | 0 | Subtítulos, fechas, leyendas |
| `overline` | Inter | 600 | 11 / 1.3 (tablet/móvil 10) | 0.8–1.2px, MAYÚSCULAS | Etiquetas de KPI, de sección ("MENÚ") |

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

## 5. Layout responsivo

| Breakpoint | Navegación | Contenido |
|---|---|---|
| **Web ≥ 1280 px** | Sidebar `--color-panel`, ancho 236 px, radio 28, con etiquetas, secciones "MENÚ" / "GESTIÓN", tarjeta de caja y usuario al pie | Barra superior (fecha, buscador, "Nueva venta", notificaciones) → saludo + píldoras de pago + KPIs → grilla de 3 columnas (1fr · 1fr · 2fr) |
| **Tablet 768–1279 px** | Rail de iconos 84 px a todo el alto, `--color-panel`; activo = círculo blanco 52 px con icono rojo y `--shadow-active`; botón "Nueva venta" rojo + avatar al pie | Cabecera 64 px (saludo + KPIs a la derecha) → fila de píldoras 56 px → 3 columnas (250 · 250 · resto) |
| **Móvil < 768 px** | Barra inferior flotante: píldora blanca 68 px, borde `--color-line-soft`, `--shadow-floating`; activo = píldora `--color-panel` con icono rojo + etiqueta; botón central rojo 52 px | Cabecera `--color-panel` con radio inferior 32 que agrupa saludo, cifra héroe, KPIs y píldoras → tarjetas apiladas |

En web, usa `flex-wrap` (sidebar `flex: 1 1 236px`, contenido `flex: 999 1 560px; min-width: 0`) para que el sidebar se apile en pantallas estrechas. Tablas anchas dentro de un contenedor con `overflow-x: auto`.

---

## 6. Componentes

### 6.1 Botones
| Variante | Estilo |
|---|---|
| **Primario** | Fondo `--color-red-strong`, texto blanco 600, alto 44 (48 en móvil), radio pill, padding 0 16–18px. Icono opcional a la izquierda (18 px). |
| **Secundario** | Fondo blanco sobre panel (o `--color-panel` sobre blanco), texto `--color-ink` 600, alto 40–44, radio pill. |
| **Icono** | Círculo 44 px. Blanco sobre panel con `--shadow-raised`, o `--color-panel` sobre blanco. Siempre `aria-label`. |
| **CTA circular** | Círculo 52 px, `--color-red-strong`, icono blanco 22 px, `--shadow-cta`. |
| **Filtro** | Círculo 40 px blanco con icono `--color-red-strong`. |

Hover: rojo → `--color-red-hover`; blanco → `--color-panel`.

### 6.2 Navegación
- **Item sidebar:** alto 46, radio pill, padding 0 14px, gap 12, icono 19 px. Inactivo `--color-ink-2` 500. Activo: fondo blanco, texto `--color-ink` 600, icono `--color-red-strong`, punto rojo 7 px a la derecha, `--shadow-active`.
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
Buscador: alto 44, radio pill, fondo `--color-panel` (sin borde), icono lupa 18 px a 14 px del borde, padding izquierdo 40 px. Siempre con `<label>` (puede estar visualmente oculto).

### 6.13 Avatar
Círculo 40–48 px, fondo `--color-yellow`, iniciales ink 700 13 px, `role="img"` + `aria-label` con el nombre.

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
