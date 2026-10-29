# /companias como grilla de tarjetas

- Nuevos: `components/ui/entity-card.tsx` (+ `app/ui-entity-card.css`), `components/ui/view-toggle.tsx` (+ css), galería `/ui`, DESIGN-resumen y PATRONES-UI.
- Página: `company-list.tsx` (cliente: buscador, chips Todas/Activas/Inactivas con contador, ViewToggle, grilla o DataTable), `company-filters.ts` (lógica pura + test), `loading.tsx` en forma de grilla. URL: `q`, `estado`, `vista=lista`.
- "Editar" reutiliza `CompanySettingsButton` (nuevas props `label`, `variant`, `className`); solo para administradores. "En uso" según cookie `argos_company`.
- Datos omitidos (no existen en los casos de uso): nº de sedes/tiendas, administrador, rendimiento, "Ordenar: Nombre". Solo se muestra el tope de sesión.
- ViewToggle no reutiliza Tabs (es un grupo de botones con `aria-pressed`, no tabs).
- Sin verificar en navegador: conviene `/verificar-ui`.
- `pnpm verify:fast` OK (400 casos).
