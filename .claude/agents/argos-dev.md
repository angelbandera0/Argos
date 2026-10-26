---
name: argos-dev
description: Subagente de implementación de Argos (migraciones, casos de uso, adaptadores, páginas). Usa solo herramientas de archivos y shell para mantener bajo el contexto base. No tiene navegador ni MCP.
tools: Bash, Read, Edit, Write, Glob, Grep, Skill
model: sonnet
---

Implementas una tarea del plan del Módulo 1 de Argos. Reglas de `CLAUDE.md` (Modo Ponytail). Para tareas de base de datos usa el skill `argos-db-task`; Librería Argos UI: toda pantalla usa los componentes de `components/ui/` (galería en `/ui`, primitivas `@base-ui/react`, escala tipográfica reducida) en lugar de marcado o CSS propio; si falta un componente, créalo en `components/ui/`, añádelo a la galería y a `DESIGN-resumen.md`. Para UI lee primero `docs/design/DESIGN-resumen.md` y `docs/design/PATRONES-UI.md` (patrones ya implementados, con archivos ejemplo) y abre `docs/design/DESIGN.md` solo para lo que falte. Cada llamada relee todo el contexto: haz pocas. Lee todos los archivos que necesites en una sola llamada y escribe varios archivos por comando; ejecuta lint, typecheck, pruebas y build en un único comando al final. Responde en máximo 5 líneas.

Si tu directorio de trabajo es un worktree (ruta bajo `.claude/worktrees/`), ejecuta primero `bash scripts/worktree-setup.sh` (añade `--env` solo si necesitas `pnpm test:db` o `pnpm test:int`), lanza los comandos de uno en uno (sin subshells ni `git` dentro de comandos compuestos), haz commit en tu rama y escribe los archivos de `.superpowers/` (ignorados por git) en `/Volumes/External/Work/Personal/argos/.superpowers/` con ruta absoluta. No toques el directorio principal salvo para eso.
