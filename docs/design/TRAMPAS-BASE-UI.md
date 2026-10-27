# Trampas de Base UI y de la librería Argos UI

Lista de comprobación antes de escribir UI. Cada línea: causa → regla.

- Ítem de menú renderizado como `<button>` (p. ej. `render={<button/>}`): Base UI avisa de botón nativo → pasa `nativeButton`.
- `Menu.GroupLabel` / `Select.GroupLabel` fuera de su grupo lanzan «GroupContext is missing» → siempre dentro de `Group` o `RadioGroup`.
- Claves de React duplicadas (`href` o `label` solos se repiten) → clave única compuesta (`${section}-${href}`) o el id.
- Clase `overline` choca con la utilidad de Tailwind v4 → se usa `eyebrow`. Revisa también `tab`, `tabs`, `content`, `hidden`, `container`, `table`, `grid`...: toda clase propia nueva lleva prefijo `ui-`.
- Popups (Select, Menu, Datepicker) tapados por un Dialog → los popups usan `z-index: var(--z-popup)`, por encima de diálogos.
- Pasar un componente de icono (función) de servidor a cliente falla al serializar → pasa el NOMBRE (`"Building2"`); icono nuevo en `NAV_ICONS` (`components/icons.ts`).
- Con `cacheComponents`, leer cookies o sesión fuera de `Suspense` rompe el prerender → va dentro de `<Suspense>`; `createServerClient` ya hace `await connection()`; nada por usuario usa `use cache`.
- El proxy redirigía las peticiones `next-action` y rompía las server actions → no las redirige; no lo cambies.
- Archivo CSS o ruta nueva no se ve o da 404 con `pnpm dev` en marcha → reinicia `pnpm dev` y borra `.next`.
- `Select`, `Multiselect` y `Datepicker` no envían nada al `FormData` sin `name` (`nameFrom`/`nameTo` en rangos) → ponlo siempre; el vacío llega como cadena vacía; opción «Todos» con `value=""` explícito.
- Fechas: parsear ISO `YYYY-MM-DD` con `new Date()` aplica UTC y desplaza un día → fechas ISO como cadena, sin UTC; el día calendario se corta en la zona del usuario (cookie `tz`, `userTimeZone()`).
- `pnpm build` con `next dev` activo corrompe la caché `.next` → usa `pnpm verify:fast` mientras haya dev.
- Pruebas pgTAP que asumen base vacía fallan con datos reales → filtra por los ids que crea la propia prueba, sin contar tablas enteras.
- Listas y diálogos ya migrados a la librería no reintroducen CSS antiguo (`.select`, clases sueltas) → componentes de `components/ui/` y sus clases `ui-*`.
- Formularios de página: el ancho lo fija solo `FormShell`; `Card` dentro, nunca por fuera.
