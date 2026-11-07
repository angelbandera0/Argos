# Sistema de Gestión Multi-Entidad / Multi-Local — Documentación de Planificación

> Estado: **Fase 0 — Descubrimiento**. Sección técnica de la constitución confirmada; requisitos en desglose.

## Metodología

**SDD spec-anchored + criterios de resultado (ODD)** — ver ADR-001.

- La especificación es la fuente de verdad. Si spec y código discrepan, gana la spec.
- Todo cambio funcional pasa **primero** por estos documentos y después por el código.
- Cada requisito se escribe como **resultado medible**, no como pasos de implementación.
- Lo que no está decidido no se rellena con supuestos: va a `OPEN_QUESTIONS.md`.

## Stack (resumen)

Next.js en Vercel · Supabase Cloud · Clean Architecture · API REST `/api/v1` · Servidor MCP remoto · OAuth 2.1. Detalle en `CONSTITUTION.md` (T-01 a T-07).

## Documentos

| Archivo | Propósito |
|---|---|
| `CONSTITUTION.md` | Principios no negociables, reglas técnicas y definición de "hecho" |
| `DOMAIN.md` | Glosario y modelo conceptual del negocio |
| `REQUIREMENTS.md` | Índice de requisitos |
| `requirements/REQ-XXX-*.md` | Un archivo por requisito |
| `requirements/_TEMPLATE.md` | Plantilla de requisito |
| `DECISIONS.md` | Registro de decisiones (ADR) y alternativas descartadas |
| `technical/` | Diseño técnico por módulo (`MODULO-1-DISENO-TECNICO.md`) |
| `technical/MODULO-1-TRAZABILIDAD.md` | Matriz de criterios de aceptación de REQ-005 a REQ-009 y la prueba que cubre cada uno |
| `superpowers/plans/` | Planes de implementación por módulo (`2026-10-25-modulo-1-implementacion.md`) |
| `superpowers/specs/2026-11-06-modulo-2-almacen-pedidos/INDEX.md` | Diseño del Módulo 2 (almacén y pedidos de compra), por partes; empieza por el índice |
| `design/screens/MODULO-2-BRIEF-DISENO.md` | Brief de pantallas del Módulo 2 para Claude Design |
| `design/modulo2/README.md` | Diseño resultante del Módulo 2 (guía, tokens y maquetas); índice y resumen en esa carpeta |
| `design/` | Guía visual: `DESIGN.md`, `tokens.css`, preset de Tailwind y capturas |
| `design/screens/` | Diseño de pantallas por módulo (`MODULO-1-PANTALLAS.md`) y maquetas HTML en `mockups/` |
| `OPEN_QUESTIONS.md` | Dudas, contradicciones y supuestos pendientes |

## Flujo de trabajo

1. Se elige un requisito o se aporta información del negocio.
2. Claude formula las preguntas necesarias, con ojo crítico.
3. Se responden las preguntas.
4. **Solo tras confirmación explícita** se actualizan los documentos.
5. Las elecciones se registran en `DECISIONS.md`; las dudas abiertas, en `OPEN_QUESTIONS.md`.

## Estados de un requisito

`Borrador` → `En revisión` → `Aprobado` · también `Diferido` y `Obsoleto`.
