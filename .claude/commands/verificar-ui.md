---
description: Verificación visual en navegador de las páginas de una tarea de UI (uso - /verificar-ui 20)
argument-hint: <número de tarea>
---

Verifica en el navegador la Tarea $ARGUMENTS ya implementada. Lanza UN subagente con `model: "haiku"` (tarea mecánica). Debe: leer `.superpowers/sdd/2026-10-25-modulo-1-implementacion/task-$ARGUMENTS-report.md` y la lista de pantallas de la tarea; arrancar `pnpm dev` (al arrancar se crea el superadmin real de `.env.local`: no usar ni tocar esa cuenta, probar con usuarios `itest-` que se borran al terminar); recorrer cada pantalla en web, tablet y móvil contra su mockup de `docs/design/screens/mockups/` con las herramientas de Chrome (`tabs_context_mcp` primero, pestaña nueva, sin diálogos de alerta, máximo 2-3 intentos si falla); detener el servidor; y responder en máximo 5 líneas con coincidencias, diferencias y ruta del informe `task-$ARGUMENTS-visual.md`. No modifica código: si hay diferencias, las lista y el controlador decide. Anota tokens, llamadas y duración en la fila de `docs/superpowers/consumo.md` de esa tarea (columna Tokens, como "+ visual: …").
