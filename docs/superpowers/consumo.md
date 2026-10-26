# Consumo por tarea

Los tokens por subagente no se registraron en el ledger de las Tareas 7-9; solo se conoce lo que devolvió el arnés en esta sesión. Para cifras exactas de las anteriores, `/usage` o el historial de la cuenta. Desde la Tarea 11 se anota en esta tabla el uso que reporte cada subagente.

| Tarea | Quién escribió | Rondas | Pruebas finales | Commits | Tokens |
|---|---|---|---|---|---|
| 7 RLS núcleo | Sonnet (subagente) | implementación + 1 revisión + 1 arreglo | 001 41/41, 002 53/53 | 180cabe, f23cc48 | no registrado |
| 8 Guardas | Sonnet (subagente) | implementación + 1 revisión + 1 arreglo (antes de omitir revisiones) | 003 46/46 | 74b8256, c4d7fc4 | no registrado |
| 9 Roles | Sonnet (subagente) | implementación | 004 15/15 (001-003 no reejecutadas) | f3ea164 | no registrado |
| 10 Asignaciones y sesiones | Controlador (en línea) | implementación + 1 corrección de prueba | 005 22/22 | 511dd9a | contexto principal: no medido, grande (SQL pegado dos veces); reejecución por subagente Haiku: 55k tokens, 6 llamadas, 42 s |
| 11 Catálogo | Sonnet (subagente) | implementación + migración extra `delete_product` | 006 39/39, 003 46/46, 005 22/22 | 7a0be8a | subagente: 139.956 tokens, 30 llamadas, 355 s |
| 12 Historial por triggers | Sonnet (subagente, skill `argos-db-task`) | implementación | 007 32/32, 001-006 en verde | df88ae1 | subagente: 72.955 tokens, 13 llamadas, 146 s |
| 13 Hook de claims y bloqueo del PIN | Sonnet (subagente, skill `argos-db-task`) | implementación | 008 22/22 | 96e3a66 | subagente: 57.190 tokens, 14 llamadas, 75 s |
| 16 AuthGateway y PinVerifier | Sonnet (subagente) | implementación + migración extra `revoke_user_sessions` | test:int 8/8, test 279/279, typecheck y lint limpios | 959e951 | subagente: 75.781 tokens, 18 llamadas, 182 s |
| 17 Primer superadmin | Sonnet (subagente) | implementación | unit 281/281, test:int 9/9, typecheck y lint limpios | 4bb7504 | subagente: 54.742 tokens, 12 llamadas, 91 s |

Lecciones: omitir revisiones por tarea quitó las rondas de arreglo; escribir en línea (Tarea 10) infló el contexto principal, así que la escritura va al subagente.
