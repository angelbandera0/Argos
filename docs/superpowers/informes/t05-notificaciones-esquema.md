# T05 · Esquema de notificaciones

- Migración `supabase/migrations/20261107040000_notifications.sql` (NO aplicada); prueba `supabase/tests/014_notifications.test.sql` (26 aserciones, NO ejecutada). `099` no requiere cambios.
- `notifications`: una fila por destinatario; RLS select/update solo propias; grant select y update(read_at); sin insert/delete.
- `app.notify(p_company, p_module, p_operation, p_priority, p_title, p_body, p_link, p_store default null, p_special default null, p_module_perm default null, p_warehouse default false, p_include_admins default true) returns int`: definer, execute revocado a public/anon/authenticated. Errores de validación: 22023.
- Reglas: admins de la compañía (activos) + operadores activos con rol no borrado, compañía no excluida y tienda operativa. Especial: coincide tienda (p_store) o flag warehouse si p_store es null o p_warehouse. Permiso de módulo: formato `'modulo.view|create|edit|delete'`, filtrado por tienda si p_store. Excluye a auth.uid(); union evita duplicados.
- Públicas (invoker, authenticated): `mark_notifications_read(p_ids uuid[] default null) returns int`, `unread_notifications_count() returns int`.
- N-09 queda en quien emite (comentario sobre app.notify). Las funciones is_operational no dependen de la sesión del destinatario; no se exige sesión activa.
