# Tarea 36 - Trazabilidad y verificación final

- Matriz: `docs/technical/MODULO-1-TRAZABILIDAD.md` (todos los CA de REQ-005 a REQ-009). No se añadieron pruebas: cada CA tiene prueba o está marcado manual/diferido. Fuera del plan (ADR-011/012): REQ-006 CA-12c y CA-12d.
- Notas para el manual completadas en REQ-005 a REQ-009; CLAUDE.md y docs/README.md actualizados; sección "Verificación final diferida" en revisiones-pendientes.md.
- Verificación: `pnpm verify:fast --int` -> lint OK, typecheck OK, test OK; test:int con 2 timeouts de 30 s en el primer pase (catalog, history; latencia cloud), ambos archivos pasan al reejecutarlos (11/11). No se ejecutó `pnpm build` (next dev activo) ni pgTAP (sin MCP/execute_sql).
- Paso 3 (list_migrations, get_advisors, SQL por execute_sql) queda para el controlador; confirmar hooks/MFA en el panel queda pendiente del usuario.
- Entorno: el node por defecto (18) rompe pnpm; se usó node 22 (`env PATH=~/.nvm/versions/node/v22.16.0/bin:...`).
