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
- Neutros (§2.1): `--color-ink` #1C1C1E (texto); `ink-2` #45484D; `muted` #6B6F76; `panel` #F6F8FA (paneles, inputs); `surface` #FFFFFF; `line` #E4E6EA; `line-strong` #C9CDD3; `line-soft` #ECEEF1; `ring` #D6D9DE (chips sobre panel).
- Pares verificados (§2.2): blanco sobre red-strong; red-strong sobre blanco/panel; red-hover sobre red-tint; ink sobre yellow, red y panel; ink-2 y muted sobre panel; muted sobre blanco.
- Prohibidos (§2.2): amarillo sobre blanco; `--color-red` como texto pequeño.
- Panel sobre página blanca; elevado dentro de panel: `--color-surface` (+ `--shadow-raised` si interactivo) (§2.3).

## Tipografía
- Google Fonts cargadas en `app/globals.css`: `--font-display` (Inter Tight: títulos, cifras) y `--font-ui` (Inter: resto) (§3).
- Escala reducida [decisión del usuario]; prevalece sobre la guía de Downloads: display 32, kpi-xl 44, kpi 36, stat 28, card-title-lg 21, h2 15, value 17, brand 17, avatar 13; body 14/13, caption 12 y overline 11/10. Tamaños de fuente solo en tokens.
- Roles: `--text-<escala>` (display, kpi-xl, kpi, stat, card-title-lg, h2, value, brand, body, caption, overline) (§3).
- `--text-eyebrow-sm` (600 10/1.3): solo `.company-label` y el rótulo del disparador (§3).
- Tracking: `--tracking-<escala>` (§3).
- Máx. 2 pesos por tarjeta; `.tabular` en tablas y listas (§3).
- Overline: clase `.eyebrow` (no `overline`, choca con Tailwind), MAYÚSCULAS muted (§3).

## Espaciado, radios, sombras y tamaños
- Base 4: `--space-1` 4 a `--space-8` 32 (medios pasos 1-5, 2-5, 3-5, 4-5, 5-5).
- Página: 16 px exterior, 24 entre sidebar y contenido. Gap entre tarjetas 18 web, 14–16 tablet, 12–14 móvil; padding de tarjeta 20×22, 18×20, 16–18 (§4).
- Radios (§4): `--radius-pill`; `panel` 28 (sidebar); `card` 24 (22 tablet/móvil); `inner` 16; `icon` 10; `bar`; `header-mobile`.
- Sombras (§4): `--shadow-active` (nav activa), `raised` (pestaña activa), `cta`, `floating` (barra inferior).
- Tamaños `--size-*` (§4, tokens.css): `touch`/`control` 40 (44 táctil), `control-sm` 36, `cta` 52, `sidebar` 236, `rail` 84, `bottom-nav` 68, `nav-item` 40, `icon` 18, `avatar` 40, `menu` 272, `list-row` 56, `modal` 480, `day` 36, `form` 480 (ancho de `FormShell` en páginas; 100% en móvil) [decisión del usuario], `focus` 3.

## Layout y shell
- Web ≥ 1280 px (§5): sidebar `--color-panel`, 236 px, radio 28, con etiquetas, con etiqueta "MENÚ" y sin usuario al pie. Contenido: barra superior común a todas las vistas con el menú de perfil (avatar, nombre, rol, "Cerrar sesión") a la derecha y el selector de tienda del operador a la izquierda; el de compañía va en el panel lateral bajo el logo (`CompanySelector`; riel solo avatar; móvil avatar en la barra superior), saludo con píldoras y KPIs, grilla 1fr · 1fr · 2fr.
- Tablet 768–1279 px (§5): rail de iconos de 84 px a todo el alto, `--color-panel`. Activo: círculo blanco 52 con icono rojo y `--shadow-active`. "Nueva venta" rojo, sin avatar al pie. Cabecera 64 px, fila de píldoras 56 px, 3 columnas (250 · 250 · resto).
- Móvil < 768 (§5): barra inferior flotante, píldora blanca 68 px, borde `--color-line-soft`, `--shadow-floating`. Activo: píldora `--color-panel` con icono rojo y etiqueta. Botón central rojo 52. Cabecera `--color-panel` con radio inferior 32 (saludo, cifra héroe, KPIs, píldoras) y tarjetas apiladas.

## Componentes
- Botón primario (§6.1): `--color-red-strong`, texto blanco 600, alto 40 (44 táctil/móvil), pill, padding 0 16–18, icono 18 a la izquierda.
- Botón secundario (§6.1): blanco sobre panel o panel sobre blanco, texto ink 600, alto 40, pill.
- Botón icono (§6.1): círculo 44, blanco con `--shadow-raised` o panel; `aria-label` obligatorio. Filtro: círculo 40 blanco, icono red-strong.
- CTA circular (§6.1): círculo 52, red-strong, icono blanco 22, `--shadow-cta`.
- Hover (§6.1): rojo a `--color-red-hover` con texto blanco; blanco a `--color-panel`; botones solo-icono con `aria-label` y `title`.
- Perfil y menú (§6.16): barra superior con fecha y hora, buscador y campana (deshabilitados, "Próximamente"), slot de acción y perfil a la derecha (avatar+nombre+rol; tablet avatar+chevron; móvil avatar). Menú: cabecera (`usuario · rol`), "Ver perfil" (`/perfil`), "Cerrar sesión" en rojo; a11y de menú Base UI.
- Item de sidebar (§6.2): alto 46, pill, padding 0 14, gap 12, icono 19. Inactivo: ink-2 500. Activo: blanco, ink 600, icono red-strong, punto rojo 7 a la derecha, `--shadow-active`, `aria-current="page"`.
- KPI de cabecera (§6.3): cifra `kpi` con flecha de tendencia rojo (15–18, trazo 2.4); overline alineado a la derecha. Separación: `border-left: 1px solid var(--color-line)`, padding 0 18–20.
- Píldoras de pago (§6.4): overline más píldora de 30–32 px de alto y ancho fijo 88–110, texto 12 px 700. Efectivo: yellow con ink. Tarjeta: red-strong con blanco. Transferencia: panel con ink.
- Barra de meta (§6.5): pista panel (blanca dentro de panel), alto 30–32, pill. Relleno rojo con padding 3–4 y etiqueta blanca interna (ink 700 12). `role="progressbar"` con `aria-valuenow/min/max`.
- Tarjeta (§6.6): panel, radio card, sin borde ni sombra. Cabecera: `h2` a la izquierda, chip o botón secundario a la derecha. Variante estado: icono en círculo 36–40 red-tint con red-strong, chip blanco, cifra `stat`. Variante editorial: título `card-title-lg` en 2 líneas, chip de alerta, paginador de puntos (activo rojo, inactivos `--color-line-strong`).
- Chips (§6.7): neutro (blanco, ink 600); alerta (red-tint, red-hover); abierto/hoy (yellow, ink); sobre gráfico (blanco, borde `--color-ring`).
- Fila de tarea (§6.8): blanca dentro de panel, radio inner, padding 10–12. Icono 32–36: urgente red-tint con red-strong; normal yellow-tint con ink. Título 600, subtítulo caption muted. Menú "⋯" como botón icono 44 transparente.
- Buscador (§6.12): alto 40 (44 táctil), pill, fondo panel sin borde, lupa 18 a 14 del borde, padding izquierdo 40. Siempre con `<label>` (puede ir oculto).
- Avatar (§6.13): círculo 40–48, yellow, iniciales ink 700 12, `role="img"` y `aria-label`.
- Campo PIN (§6.14):
  - Un único `<input>` (`type="password"`, `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength="6"`, `autocomplete="one-time-code"`, `font-size: 16px`) invisible (`opacity: 0`, `position: absolute; inset: 0`) sobre 6 casillas decorativas `aria-hidden="true"`.
  - `<label for>` "PIN"; ayuda con `aria-describedby` ("Faltan 2 dígitos." / "PIN completo.").
  - Casillas: 6 columnas iguales, gap 10 móvil / 12 web, alto 60 / 68, radio 14 / 16, blancas sobre panel.
  - Estados: vacía `1.5px solid var(--color-line)`; activa `2px` red-strong, `box-shadow: 0 0 0 4px var(--color-red-tint)` y cursor rojo 2×26; llena `1.5px` line-strong con punto ink 12 (o dígito Inter Tight 26–28 si "Mostrar" está activo); error todas con `2px` red-strong y fondo `--color-red-wash`, mensaje `role="alert"` en red-hover con icono. El error se quita al volver a escribir.
  - Mensaje de error genérico, sin intentos restantes (`screens/MODULO-1-PANTALLAS.md`, A-05).
      - "Entrar": desactivado (fondo line, texto muted) hasta tener usuario y 6 dígitos; activo red-strong con texto blanco, alto 56, pill. Enlace "¿Olvidaste tu PIN?".
- Diálogo, estado vacío y resto de componentes ampliados: ver «Componentes ampliados» (§6.17-6.38).

## Componentes ampliados (§6.17-6.38)
Tokens nuevos (tokens.css): estados `--color-success|warning|danger|info` (+variantes), `--color-placeholder`, `--color-disabled-*`, `--color-field-error-bg`, `--color-row-selected`, `--color-hover`, `--color-overlay`, `--focus-ring`, `--focus-ring-field`, radios y sombras de overlays, `--z-*`.
- Campos (§6.17): etiqueta siempre visible encima, nunca placeholder como etiqueta; pill, borde `1.5px --color-line`; con valor `--color-line-strong`; foco borde 2px red-strong + `--focus-ring-field`; error borde 2px `--color-danger`, fondo `--color-field-error-bg`, mensaje `--color-danger-text` 600 con icono, `aria-invalid` + `aria-describedby`; desactivado `--color-panel` + `--color-disabled-text`; solo lectura panel sin borde. Área de texto: `--radius-textarea`. Valida en blur y al enviar.
- Casillas, radio, switch (§6.18): checkbox 22 radio 7 (marcado red-strong con check blanco; indeterminado con guion), radio 22 con punto 10, switch 48×28 `<button role="switch" aria-checked>`. Fila clicable, mín. 44. Hasta 7 opciones excluyentes: radio; más: select.
- Select (§6.19): disparador como campo + chevron 16 (gira al abrir), `aria-haspopup="listbox"`, `aria-expanded`. Lista `role="listbox"`, `--radius-popover`, `--shadow-popover`, máx. ~320 con scroll. Opción 44; seleccionada panel, 600 + check red-strong (`aria-selected`). Teclado: flechas, Enter, Esc. Más de 10 opciones: combobox.
- Multiselect (§6.20): disparador que crece, etiquetas de 30 px con ✕ de 24 (`aria-label="Quitar …"`), máx. 3 + "+N". Panel con buscador, checkboxes (`aria-multiselectable`), pie "Limpiar" y "Aplicar (n)".
- Alertas (§6.21): padding 18, radio 20, fondo `-tint` y borde `-border` del tipo, icono en círculo 32, título 600, texto ink-2, acción como enlace, ✕ de 36. `role="alert"` para error, `role="status"` el resto. Banner (§6.22): uno a la vez, a todo el ancho.
- Toast (§6.23): abajo a la derecha, máx. 3, blanco, `--radius-toast`, `--shadow-toast`; 5 s, el error no se cierra solo.
- Diálogos (§6.24): solo decisiones que bloquean. `--color-overlay`, caja blanca `--radius-dialog`, padding 28, `--shadow-dialog`, 420 (confirmar) a 480-560. Acciones a la derecha: Secundario + Primario con verbo exacto. Destructivo: `role="alertdialog"`, foco inicial en Cancelar. Foco atrapado, Esc cierra, el foco vuelve al disparador.
- Insignias y chips (§6.25): insignia 26 pill 12 px 600 con punto 6 (éxito, aviso, error, neutro `--color-hover`/ink-2, nuevo yellow); contador 22 red-strong; chip de filtro 36 con `aria-pressed` (activo red-tint + check); chip quitable con ✕ 28.
- Navegación secundaria (§6.26): migas `<nav aria-label>` + `<ol>`, actual `aria-current="page"`; paginación con botones de 40 (actual red-strong, "Mostrando 11-20 de 186"); tooltip `--radius-tooltip`, `--shadow-tooltip`, `role="tooltip"`.
- Tabla, carga y vacío (§6.27): cabecera overline, celdas 14 con padding 12, divisores line-soft, hover panel, números a la derecha tabulares, contenedor `overflow-x: auto`. Vacío con círculo 64, título, frase y botón primario.
- Tabs (§6.28): `tablist/tab/tabpanel`, `aria-selected`, flechas ←/→, solo la activa tabulable. Subrayado (barra 3 px red-strong), segmentado (contenedor `--color-hover`, activa blanca `--shadow-raised`, alto 36, máx. 4), en tarjeta.
- Breadcrumbs (§6.29): simple, con inicio, colapsado con más de 4 niveles; móvil "‹ Nivel anterior".
- Steps (§6.30): `<ol>`, `aria-current="step"`, círculo 36 (30 vertical): completado red-strong con check, actual borde 2px + halo red-tint, pendiente panel, error `--color-danger-tint` con "!". Conector 2 px.
- Acordeones (§6.31): `<button>` dentro de `<h3>` con `aria-expanded` y `aria-controls`; contenido `role="region"` con `aria-labelledby`; chevron 16 gira 180°. Lista (una abierta, filas 56), tarjetas (varias abiertas, `--shadow-card-open`), con icono y resumen (68). Desactivado: `--color-disabled-text`.
- Secciones del sidebar (§6.32): título overline por sección (MENÚ, GESTIÓN, CONFIGURACIÓN), opción `--size-nav-item`, insignias contador/alerta/NUEVO, submenú de un nivel (padre `<button aria-expanded>`), riel colapsado con tooltip.
- Datatable (§6.33): borde line-soft radio 24; barra superior, filtros, barra de lote (`role="region"`), cabecera 44 con `aria-sort` y checkbox mixto, filas 60 (seleccionada `--color-row-selected`), menú "⋯", pie con paginación. Móvil: tarjetas.
- Datepicker (§6.34): el campo se escribe (`dd/mm/aaaa`, `inputmode="numeric"`); icono de calendario abre popover (`role="dialog"`, radio `--radius-popover`, `--z-popup`). Semana desde lunes; día `--size-day`; hoy aro ink; seleccionado red-strong. Rango: dos clics (se intercambian), banda red-tint, atajos (Hoy, Ayer, 7/30 días, Este mes, Mes pasado), Desde/Hasta/Aplicar. `role="grid"`; flechas, RePág/AvPág, Inicio/Fin, Esc.
- Barra de filtros (§6.35): una fila sobre la tabla: buscador · separador · filtros · "Limpiar filtros" (solo con filtros). Píldora sin valor (borde ring); con valor red-tint + ✕ (`Quitar filtro X`); abierta borde red-strong con halo. Al instante; la URL guarda los filtros. Secciones como tabs con contador.
- Tabla de historial (§6.36): como Datatable, agrupada por día ("HOY · LUNES 26 DE OCTUBRE · n operaciones"); Hora, Quién (avatar; "Sistema" con engranaje), Acción (insignia), Módulo (solo en "Todos"), Entidad (tipo, nombre, ID mono), Canal. "Ver cambios" despliega Campo · Antes (tachado) → Después. Más reciente primero; pie Anterior/Siguiente.

- Tarjeta de entidad (§6.37): grilla `auto-fill minmax(320px,1fr)` (sedes 420) con conmutador grilla/lista; tarjeta blanca borde line-soft radio 24 en tres franjas: cabecera (avatar cuadrado 48 radio 14 o icono, nombre enlace, código mono, "En uso", insignia de estado), datos 2×2 (etiqueta muted + valor 600) y acciones (fondo `#FCFCFD`, "Ver" Contorno + "Editar" Contorno rojo). Sede: bloque panel con "TIENDAS · n" y filas de 52. Rol: icono llave; del sistema con candado amarillo, "No se puede editar"; permisos como chips (concedido red-tint con check, no concedido punteado); tarjeta punteada "Crear un rol nuevo". Detalle: migas, avatar 64, chips, 4 indicadores, zona de peligro con borde danger.
- Formularios de creación/edición (§6.38): formulario (máx. 820) + resumen sticky 340 (panel radio 24); secciones numeradas (círculo 28 red-tint, título, descripción, contador); radio en píldoras 44 con "Recomendado"; compañías como tarjetas seleccionables 2 columnas con "Todas" mixto; matriz de permisos (Ver · Crear · Editar · Eliminar · Todo) con Ver bloqueado y plantillas como chips; resumen con lista de comprobación y "Guardar" deshabilitado hasta completar lo obligatorio.

## Librería Argos UI (§13)
- Todo en `components/ui/` (sin paquete aparte); galería en `/ui` solo en desarrollo. Primitivas complejas de `@base-ui/react` con nuestros tokens; envoltorios Client Components. Escala tipográfica reducida. Sin Chakra ni CSS-in-JS.
- OBLIGATORIO usar estos componentes en vez de marcado propio; cada componente nuevo se añade a la galería (`app/ui/sections/`) y a esta lista. Patrones con ejemplo en `PATRONES-UI.md`.
- Estructura de página: `PageHeader` (título, migas, acciones), `ListToolbar` (buscador, filtros, acción), `DataTable` (lista; cliente), `EmptyState` (sin datos), `Card`, `Skeleton`/`Spinner`/`RouteProgress` (carga).
- Formularios: `FormShell` (action, error general, guardando), `Field` (etiqueta, hint, error), `Input`, `Textarea`, `Datepicker` (fecha o rango ISO), `Select` (lista corta), `Multiselect`, `Checkbox`, `RadioGroup` (hasta 7), `Switch` (ajuste inmediato), `CodeField`, `Button` (variantes, `loading`).
- Avisos: `Alert` (en página), `Banner` (franja global), `Toast` (`useToast`, resultado de una acción), `Dialog` (modal), `FormDialog` (formulario corto en diálogo), `AlertDialog` (confirmación destructiva), `Tooltip`.
- Estado: `Badge` (estado/contador), `Chip` (filtro o quitable), `Avatar` (iniciales, tono por nombre).
- Historial: `FilterBar` con `FilterPill`/`FilterSelect` (single o `multiple`) y `DateRangePicker pill`; `AuditTable` (grupos por día, filas expandibles, `loading`, `empty`, `footer`).
- Navegación y agrupación: `Tabs` (underline: secciones; segmented: vistas), `Breadcrumbs`, `Steps`, `Accordion` (list, cards, rich), `SidebarSection`/`SidebarItem`/`SidebarSubmenu`, `CompanySelector` (`components/org/`, panel lateral) [decisión del usuario].

## Carga (§6.15)
- Contenido de pantalla o tarjeta: placeholder con la misma forma y tamaño. Clases `.skeleton` con `.skeleton-text`, `.skeleton-title`, `.skeleton-circle`, `.skeleton-pill`; dentro de panel, `.skeleton-on-panel`.
- Acción (guardar, entrar, cambiar PIN): `.spinner` dentro del botón, que queda desactivado y cambia su texto ("Entrando…").
- Navegación entre pantallas: `.route-progress`, barra roja de 3 px arriba.
- Reglas: replicar alturas, anchos y filas; no mostrar si la carga dura < 150 ms; contenedor con `aria-busy="true"` y `.sr-only` "Cargando…", que se quita al terminar.
- Next.js: cada ruta con datos lleva su propio `loading.tsx` con el placeholder de su pantalla.

## Gráficos (§7)
- Barras semanales: neutras `--color-line-strong`; mejor día `--color-red`; hoy `--color-yellow`; radio `--radius-bar`.
- Cada barra con `role="img"` y `aria-label` (p. ej. "Sábado: 9,05 mil dólares, mejor día"). El día de hoy también va en negrita en el eje.

## Iconos (§8)
- SVG `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"` (2.2–2.6 en botones pequeños), `stroke-linecap` y `stroke-linejoin` round.
- Lucide (`lucide-react`); decorativos con `aria-hidden="true"`.

## Contenido (§9)
- Español, tono cercano y directo ("Bienvenida, Ana", "Nueva venta", "Cerrar turno").
- Moneda `$7.640` y decimales con coma `$41,08`. Fecha "Domingo, 25 de octubre · 15:14".

## Checklist antes de entregar (§12)
- Solo tokens; funciona en web, tablet y móvil; primarios red-strong con texto blanco; amarillo con ink.
- Gráficos con leyenda, `aria-label` por marca y solo valores destacados; controles ≥ 44 px con etiqueta; números en español.
