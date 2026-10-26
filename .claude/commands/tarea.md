---
description: Ejecuta una tarea del plan del Módulo 1 con un subagente Sonnet (uso - /tarea 12)
argument-hint: <número de tarea>
---

Ejecuta la Tarea $ARGUMENTS del plan `docs/superpowers/plans/2026-10-25-modulo-1-implementacion.md`. Reglas de `CLAUDE.md` (subagentes):

1. No escribas código en línea. Lanza UN subagente con `model: "sonnet"` (Haiku solo si la tarea es solo documentación o cambios mecánicos). Opus solo si la tarea es de diseño o arquitectura.
2. Si la tarea crea migraciones o pruebas pgTAP, el prompt del subagente es: "Implementa la Tarea $ARGUMENTS siguiendo el skill `argos-db-task` (Skill tool). Resultado final en máximo 5 líneas." Para otras tareas, indica la sección del plan, los documentos de `docs/` que cita y, si toca UI, que lea `docs/design/DESIGN.md`.
3. Sin revisión por tarea (decisión del usuario). Las pruebas se ejecutan una sola vez al final.
4. Al terminar, anota en `docs/superpowers/consumo.md` los tokens, llamadas y duración que reporte el arnés para ese subagente, y haz commit del cambio.
5. Responde al usuario con: estado, commit, pruebas en una línea, inquietudes importantes y el consumo. Luego detente y espera el "sigue".
