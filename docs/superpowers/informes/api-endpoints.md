# Tarea 35: Endpoints

- Rutas en `app/api/v1/**` (admins, companies [+admins, settings], sites, stores, users [+stores, role], roles [+exclusions], categories, products, history/[module], auth-events). Acciones `:deactivate`, `:reactivate`, `:activate`, `:reset-pin`, `:unlock` vía segmento `[ref]` = `id:acción` (acción desconocida: 404).
- `_lib/schemas.ts` (zod), `_lib/http.ts` (body, params, paginación por cursor en memoria; el historial usa su cursor), `_lib/openapi.ts` (tabla de operaciones, esquemas de entrada desde zod).
- `infrastructure/supabase/api-services.ts`: casos de uso ligados al JWT del llamante (RLS); `Container.api(token)`. `RuleCode` gana `INVALID_INPUT` (entrada inválida: 422).
- Reglas: cada handler solo valida y llama a un caso de uso (los de rol/propiedad/admin los aplican ellos). Ningún caso de uso comprueba aal2 ni mustChangePassword (lo hacía el proxy/guard de la UI): se cierra en `resolveActorFromToken` (admin/superadmin sin aal2, o mustChangePassword: 401). Operadores: los rechazan los casos de uso salvo catálogo (permisos de su tienda activa).
- Contraseña temporal y PIN (`POST /admins`, `/users`, `:reset-pin`, `:unlock`) con `Cache-Control: no-store`.
- Pendiente/no cubierto: no hay casos de uso de listado de sites/stores/users, así que no hay GET de esos recursos; `ETag`, rate limiting y auditoría de llamadas (§9) no implementados; el listado de companies/roles/categories/products pagina en memoria.
- Pruebas: `tests/unit/api/endpoints.test.ts` (contenedor falso). `pnpm verify`: OK, 61 archivos, 509 casos.
