# T06 · Notificaciones: casos de uso, repositorio y API v1

- Dominio `core/domain/notification.ts`; puerto `notification-repository.ts`; casos de uso `list-notifications` (filtros validados, pageSize tope 100, `to` solo-fecha inclusivo hasta 23:59:59.999Z, orden created_at desc, `{items,total}`), `count-unread-notifications`, `mark-notifications-read` (UUIDs validados; sin ids = todas). El destinatario es siempre `actor.userId`.
- Adaptador `infrastructure/supabase/notification-repository.ts` (cliente del usuario, RLS; RPC `unread_notifications_count` y `mark_notifications_read`), fábrica `notifications-factory.ts`, registrado en `api-services.ts`.
- API: `GET /api/v1/notifications` (module, operation, priority, read, storeId, from, to, page, pageSize -> `{items,total}`), `GET /unread-count` (`{count}`), `POST /read` (`{ids?}` -> `{updated}`); OpenAPI y schema `markNotificationsRead` actualizados.
- Pruebas: unit (fake en memoria, endpoints), integración `tests/integration/notifications.int.test.ts` (propias, filtros, contar, marcar parcial/total, aislamiento). `verify:fast` OK (589 casos); `test:int notifications` 2/2 OK.
- Nota: la integración pasó contra el cloud, así que la migración de T05 ya estaba aplicada allí.
