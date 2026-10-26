Resumen operativo de DESIGN.md; ante cualquier duda o ausencia, el original manda.

## Reglas obligatorias
- Solo tokens de `tokens.css`. Prohibido hex, px, tamaños o sombras sueltos en componentes. Si falta algo, crear el token y documentarlo en DESIGN.md (§0, §11).
- Prohibidos fondos negros, grafito o degradados. El negro es solo para texto (§1, §2.3).
- Prohibido texto blanco pequeño sobre `--color-red`. Prohibido texto o iconos amarillos sobre blanco (§2.2, §11).
- Prohibido texto amarillo: el amarillo va como relleno con texto `--color-ink` (§2.3).
- Máximo un bloque grande rojo por vista (§1.2, §11).
- Prohibido `onClick` en `<div>`: usar `<button>`, `<a href>`, `<input>` + `<label>` (§10).
- Prohibidos emojis como iconos (§8).
- Prohibido bordes y sombras en todas las tarjetas: se separan por color (§4, §11).
- Prohibidas cifras en negrita pesada (700+) a gran tamaño (§11).
- Prohibido dar información solo por color (§1.6, §10).
- Prohibidos gráficos 3D, tartas y degradados. Un solo eje Y (§7).
- Prohibido el teclado numérico en pantalla para el PIN y los 6 inputs separados (§6.14).
- Prohibido indicar intentos restantes en el error del PIN (§6.14).
- Prohibidos grises sueltos en placeholders de carga (§6.15).
- Moneda y fechas con `Intl.NumberFormat('es', …)` (§9).

## Principios y color
- Claro y sereno: fondo blanco, paneles `--color-panel`. Rojo = acción/énfasis. Amarillo = hoy / en curso / abierto. Cifras grandes y ligeras. Todo redondo. Táctil ≥ 44 px, AA (§1).
- Marca: `--color-red` #FF443B (solo marcas gráficas, no texto pequeño); `--color-red-strong` #D92D25 (botones con texto blanco, texto y enlaces rojos, iconos activos); `--color-red-hover` #B3221B; `--color-red-tint` #FFE6E4 (fondos de alerta); `--color-red-wash` #FFF7F6 (campo en error); `--color-yellow` #FFC93C; `--color-yellow-tint` #FFF4CF (§2.1).
- Neutros: `--color-ink` #1C1C1E (texto); `--color-ink-2` #45484D (nav inactiva); `--color-muted` #6B6F76 (etiquetas, ejes); `--color-panel` #F6F8FA (paneles, inputs); `--color-surface` #FFFFFF (página y elevados); `--color-line` #E4E6EA (divisores); `--color-line-strong` #C9CDD3 (línea base, puntos inactivos); `--color-line-soft` #ECEEF1 (borde nav móvil); `--color-ring` #D6D9DE (chips sobre panel) (§2.1).
- Gráficos: `--chart-neutral`, `--chart-highlight`, `--chart-today`, `--chart-goal`, `--chart-grid` (tokens.css).
- Pares verificados (§2.2): blanco sobre `--color-red-strong` (botones); `--color-red-strong` sobre blanco o panel; `--color-red-hover` sobre `--color-red-tint`; ink sobre yellow, sobre red (badges) y sobre panel; ink-2 y muted sobre panel; muted sobre blanco.
- Prohibidos (§2.2): amarillo sobre blanco (1,54); `--color-red` como texto pequeño (3,42).
- Panel sobre página blanca: `--color-panel`. Elevado dentro de panel: `--color-surface` + `--shadow-raised` si es interactivo (§2.3).

## Tipografía
- Fuentes Google Fonts Inter Tight y Inter; `tokens.css` indica que se cargan en `app/globals.css` (§3).
- `--font-display` (Inter Tight): títulos, cifras. `--font-ui` (Inter): resto (§3).
- Roles: `--text-display`, `--text-kpi-xl`, `--text-kpi`, `--text-stat`, `--text-card-title-lg`, `--text-h2`, `--text-value`, `--text-body`, `--text-caption`, `--text-overline` (§3).
- Tracking: `--tracking-display`, `--tracking-kpi-xl`, `--tracking-kpi`, `--tracking-stat`, `--tracking-card-title`, `--tracking-overline` (§3).
- Máximo 2 pesos por tarjeta. `font-variant-numeric: tabular-nums` (clase `.tabular`) en tablas y listas (§3).
- Overline: clase `.overline` (MAYÚSCULAS, muted) para etiquetas de KPI y de sección (§3).

## Espaciado, radios, sombras y tamaños
- Escala base 4 (§4): `--space-1` 4, `--space-1-5` 6, `--space-2` 8, `--space-2-5` 10, `--space-3` 12, `--space-3-5` 14, `--space-4` 16, `--space-4-5` 18, `--space-5` 20, `--space-5-5` 22, `--space-6` 24, `--space-7` 28, `--space-8` 32.
- Página: 16 px exterior y 24 px entre sidebar y contenido. Gap entre tarjetas: 18 web, 14–16 tablet, 12–14 móvil. Padding de tarjeta: 20×22 web, 18×20 tablet, 16–18 móvil. Gap interno: 8–12 (§4).
- Radios (§4): `--radius-pill`; `--radius-panel` 28 (sidebar web); `--radius-card` 24 (22 en tablet/móvil, ya en tokens); `--radius-inner` 16 (14 en compacto, sin token); `--radius-icon` 10; `--radius-bar` (barras de gráfico); `--radius-header-mobile` (cabecera móvil).
- Sombras (§4): `--shadow-active` (nav activa); `--shadow-raised` (pestaña activa, botón blanco sobre panel); `--shadow-cta` (CTA circular); `--shadow-floating` (barra inferior móvil).
- Tamaños `--size-*` (§4, tokens.css): `touch` 44, `control` 44, `control-sm` 36, `cta` 52, `sidebar` 236, `rail` 84, `bottom-nav` 68, `nav-item` 46, `rail-item` 52, `nav-item-mobile` 56, `icon` 18, `icon-nav` 19, `icon-rail` 21, `dot` 7, `avatar` 40, `list-row` 56, `modal` 480, `focus` 3. Overlay de modal: `--color-scrim`.

## Layout y shell
- Web ≥ 1280 px (§5): sidebar `--color-panel`, 236 px, radio 28, con etiquetas, secciones "MENÚ" y "GESTIÓN", tarjeta de caja y usuario al pie. Contenido: barra superior (fecha, buscador, "Nueva venta", notificaciones), saludo con píldoras y KPIs, grilla 1fr · 1fr · 2fr.
- Tablet 768–1279 px (§5): rail de iconos de 84 px a todo el alto, `--color-panel`. Activo: círculo blanco 52 con icono rojo y `--shadow-active`. "Nueva venta" rojo y avatar al pie. Cabecera 64 px, fila de píldoras 56 px, 3 columnas (250 · 250 · resto).
- Móvil < 768 px (§5): barra inferior flotante, píldora blanca 68 px, borde `--color-line-soft`, `--shadow-floating`. Activo: píldora `--color-panel` con icono rojo y etiqueta. Botón central rojo 52. Cabecera `--color-panel` con radio inferior 32 (saludo, cifra héroe, KPIs, píldoras) y tarjetas apiladas.
- CSS web (§5): contenedor `flex-wrap`; sidebar `flex: 1 1 236px`; contenido `flex: 999 1 560px; min-width: 0`. Tablas anchas con `overflow-x: auto`.

## Componentes
- Botón primario (§6.1): `--color-red-strong`, texto blanco 600, alto 44 (48 móvil), pill, padding 0 16–18, icono 18 a la izquierda.
- Botón secundario (§6.1): blanco sobre panel o panel sobre blanco, texto ink 600, alto 40–44, pill.
- Botón icono (§6.1): círculo 44, blanco con `--shadow-raised` o panel; `aria-label` obligatorio. Filtro: círculo 40 blanco, icono red-strong.
- CTA circular (§6.1): círculo 52, red-strong, icono blanco 22, `--shadow-cta`.
- Hover (§6.1): rojo a `--color-red-hover`; blanco a `--color-panel`.
- Item de sidebar (§6.2): alto 46, pill, padding 0 14, gap 12, icono 19. Inactivo: ink-2 500. Activo: blanco, ink 600, icono red-strong, punto rojo 7 a la derecha, `--shadow-active`, `aria-current="page"`.
- Badge de contador (§6.2): 22 px, pill, `--color-red-tint`, texto red-hover 700 12. Punto de notificación: 7–8 px rojo.
- KPI de cabecera (§6.3): cifra `kpi` con flecha de tendencia rojo (15–18, trazo 2.4); overline alineado a la derecha. Separación: `border-left: 1px solid var(--color-line)`, padding 0 18–20.
- Píldoras de pago (§6.4): overline más píldora de 30–32 px de alto y ancho fijo 88–110, texto 12 px 700. Efectivo: yellow con ink. Tarjeta: red-strong con blanco. Transferencia: panel con ink.
- Barra de meta (§6.5): pista panel (blanca dentro de panel), alto 30–32, pill. Relleno rojo con padding 3–4 y etiqueta blanca interna (ink 700 12). `role="progressbar"` con `aria-valuenow/min/max`.
- Tarjeta (§6.6): panel, radio card, sin borde ni sombra. Cabecera: `h2` a la izquierda, chip o botón secundario a la derecha. Variante estado: icono en círculo 36–40 red-tint con red-strong, chip blanco, cifra `stat`. Variante editorial: título `card-title-lg` en 2 líneas, chip de alerta, paginador de puntos (activo rojo, inactivos `--color-line-strong`).
- Chips (§6.7): neutro (blanco, ink, 10–12 px 600, tracking 0.8); alerta (red-tint, red-hover 700); abierto/hoy (yellow, ink 700); sobre gráfico (blanco, borde 1px `--color-ring`, ink 700).
- Fila de tarea (§6.8): blanca dentro de panel, radio inner, padding 10–12. Icono 32–36: urgente red-tint con red-strong; normal yellow-tint con ink. Título 600, subtítulo caption muted. Menú "⋯" como botón icono 44 transparente.
- Acordeón (§6.9): ancho completo, alto 48–52, texto 600, chevron 15–16 a la derecha (abierto: red-strong), separador `--color-line`, `aria-expanded`.
- Pestañas segmentadas (§6.10): sin fondo en el contenedor, gap 4–6. Activa: blanco, ink 700, `--shadow-raised`. Inactiva: transparente, ink-2. Alto 36, pill. `role="tablist"`, `role="tab"`, `aria-selected`.
- Anillo de tiempo (§6.11): SVG girado -90°, pista punteada `--color-ring` (dasharray 3 6), arco rojo en 4 segmentos (`pathLength="400"`, `stroke-dasharray="60 40"`, trazo 8, `linecap: round`). Centro blanco con `stat` y overline "MIN / CLIENTE".
- Buscador (§6.12): alto 44, pill, fondo panel sin borde, lupa 18 a 14 del borde, padding izquierdo 40. Siempre con `<label>` (puede ir oculto).
- Avatar (§6.13): círculo 40–48, yellow, iniciales ink 700 13, `role="img"` y `aria-label`.
- Campo PIN (§6.14):
  - Un único `<input>` (`type="password"`, `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength="6"`, `autocomplete="one-time-code"`, `font-size: 16px`) invisible (`opacity: 0`, `position: absolute; inset: 0`) sobre 6 casillas decorativas `aria-hidden="true"`.
  - `<label for>` "PIN"; ayuda con `aria-describedby` ("Faltan 2 dígitos." / "PIN completo.").
  - Casillas: 6 columnas iguales, gap 10 móvil / 12 web, alto 60 / 68, radio 14 / 16, blancas sobre panel.
  - Estados: vacía `1.5px solid var(--color-line)`; activa `2px` red-strong, `box-shadow: 0 0 0 4px var(--color-red-tint)` y cursor rojo 2×26; llena `1.5px` line-strong con punto ink 12 (o dígito Inter Tight 26–28 si "Mostrar" está activo); error todas con `2px` red-strong y fondo `--color-red-wash`, mensaje `role="alert"` en red-hover con icono. El error se quita al volver a escribir.
  - Mensaje de error genérico, sin intentos restantes (`screens/MODULO-1-PANTALLAS.md`, A-05).
  - "Mostrar/Ocultar": texto red-strong 13 px 600, icono de ojo, `aria-pressed`.
  - Validación: `value.replace(/\D/g, '')` y cortar a 6.
  - "Entrar": desactivado (fondo line, texto muted) hasta tener usuario y 6 dígitos; activo red-strong con texto blanco, alto 56, pill. Enlace "¿Olvidaste tu PIN?".
- Diálogo, modal "mostrar una sola vez" y estado vacío: el original no define patrón para ellos. Solo existen `--size-modal` (480) y `--color-scrim`.

## Carga (§6.15)
- Contenido de pantalla o tarjeta: placeholder con la misma forma y tamaño. Clases `.skeleton` con `.skeleton-text`, `.skeleton-title`, `.skeleton-circle`, `.skeleton-pill`; dentro de panel, `.skeleton-on-panel`.
- Acción (guardar, entrar, cambiar PIN): `.spinner` dentro del botón, que queda desactivado y cambia su texto ("Entrando…").
- Navegación entre pantallas: `.route-progress`, barra roja de 3 px arriba.
- Reglas: replicar alturas, anchos y filas; no mostrar si la carga dura < 150 ms; contenedor con `aria-busy="true"` y `.sr-only` "Cargando…", que se quita al terminar.
- Colores: `--skeleton-on-surface` sobre blanco, `--skeleton-on-panel` dentro de panel. Duraciones `--skeleton-duration` (1.4s) y `--spinner-duration` (0.8s).
- Movimiento reducido (ya en tokens.css): skeleton quieto, spinner más lento, barra fija.
- Next.js: cada ruta con datos lleva su propio `loading.tsx` con el placeholder de su pantalla.

## Gráficos (§7)
- Barras semanales: neutras `--color-line-strong`; mejor día `--color-red`; hoy `--color-yellow`. Ancho máximo 40–44, gap 10–12, radio `--radius-bar`.
- Solo se rotulan las barras destacadas (mejor día y hoy), 11–12 px 700 encima de la barra.
- Meta: línea `1.5px dashed var(--color-muted)` con chip "Meta 6,5" a la derecha.
- Ejes 10–11 px muted; cuadrícula `--color-line`; base `--color-line-strong`.
- Leyenda obligatoria si hay más de un color (cuadrados 9–10, radio 3).
- Cada barra con `role="img"` y `aria-label` (p. ej. "Sábado: 9,05 mil dólares, mejor día"). El día de hoy también va en negrita en el eje.

## Iconos (§8)
- SVG `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"` (2.2–2.6 en botones pequeños), `stroke-linecap` y `stroke-linejoin` round.
- Tamaños: 18 botones, 19–21 navegación, 22 CTA. Librería: Lucide (`lucide-react`). Decorativos con `aria-hidden="true"`.

## Contenido (§9)
- Español, tono cercano y directo ("Bienvenida, Ana", "Nueva venta", "Cerrar turno").
- Moneda `$7.640` y decimales con coma `$41,08`. Fecha "Domingo, 25 de octubre · 15:14".
- Overlines en MAYÚSCULAS cortas ("VENTAS HOY", "TICKET PROMEDIO", "3 EN COLA").

## Checklist antes de entregar (§12)
- Solo tokens; funciona en web, tablet y móvil; primarios red-strong con texto blanco; amarillo con ink.
- Gráficos con leyenda, `aria-label` por marca y solo valores destacados; controles ≥ 44 px con etiqueta; números en español.
