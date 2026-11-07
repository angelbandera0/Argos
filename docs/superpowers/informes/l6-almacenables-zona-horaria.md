# L6 · Almacenables y zona horaria

- Existencias: los selectores de producto de entrada y traspaso (`app/(app)/existencias/page.tsx`) solo listan productos activos con `product_stock_settings.storable`; la validación `PRODUCT_NOT_STORABLE` de los casos de uso se mantiene. Pedidos/solicitudes no se filtran: no dependen de existencias.
- `companies.timezone` (default `UTC`, validada por trigger contra `pg_timezone_names`; migración `20261107231325_company_timezone.sql`, pgTAP 032). RLS/grants sin cambios (update por admin ya existente).
- Se usa en el dashboard «Solicitudes del día» (`dayRange(now, tz)`) y en el filtro de fechas de `/pedidos` vía `companyTimeZone()`. Historial/notificaciones/usuarios siguen con la zona del usuario (visualización). El saludo por día de la semana en `app/(app)/page.tsx` sigue con la zona del servidor.
- UI: select «Zona horaria» en el diálogo de ajustes de compañía; caso de uso `updateSettings` acepta `timezone` (la API v1 no lo expone).
- verify:fast OK (793 casos); test:db OK.
