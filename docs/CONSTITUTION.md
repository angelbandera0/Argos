# Constitución del Proyecto

> Principios no negociables. Cualquier requisito, diseño o código que contradiga este documento es incorrecto, salvo que se modifique antes mediante una decisión registrada en `DECISIONS.md`.

Estado: **En revisión** — la sección técnica está confirmada; los principios marcados `[PROPUESTO]` siguen pendientes de confirmar.

## 1. Principios de negocio

- **P-01 Aislamiento entre entidades** — Confirmado (ADR-003)
  Un usuario nunca ve ni modifica datos de una entidad a la que no tiene acceso explícito. Se garantiza en la capa de datos y en los casos de uso, no solo en la interfaz.
- **P-02 Trazabilidad** `[PROPUESTO]`
  Toda operación que afecte dinero, inventario o permisos deja registro de quién, cuándo, qué, desde qué local, por qué canal (UI, API, MCP) y valor anterior/nuevo.
- **P-03 No borrado de operaciones** `[PROPUESTO]`
  Las operaciones con efecto contable o de inventario no se eliminan: se anulan o se revierten con una operación inversa.

## 2. Principios técnicos

- **T-01 Stack** (ADR-002)
  Next.js (App Router) desplegado en Vercel. Supabase Cloud como infraestructura: Postgres, Auth y Storage.

- **T-02 Clean Architecture** (ADR-003)
  Capas: dominio → aplicación (casos de uso) → adaptadores e infraestructura. Las dependencias apuntan siempre hacia dentro. El dominio y los casos de uso **no importan** Next.js ni Supabase; acceden a datos y servicios externos solo mediante puertos (interfaces).

- **T-03 Un núcleo, tres adaptadores** (ADR-003)
  Toda funcionalidad vive en casos de uso y se expone mediante adaptadores delgados:
  - **UI:** server actions de Next.js que invocan casos de uso (la UI no consume su propia API REST).
  - **API REST:** `/api/v1`.
  - **MCP:** servidor MCP remoto.
  Ningún adaptador contiene lógica de negocio. Toda funcionalidad se diseña desde el inicio para poder usarse vía MCP.

- **T-04 Doble barrera de aislamiento** (ADR-003)
  Autorización en los casos de uso **y** políticas RLS en Postgres. El servidor actúa con el JWT del usuario. La `service_role` key está prohibida salvo para tareas de sistema documentadas expresamente en `DECISIONS.md`.

- **T-05 Autenticación** (ADR-004)
  OAuth 2.1 mediante Supabase Auth, encapsulado detrás de un puerto para poder sustituirlo. Sin API keys estáticas en v1. Las integraciones externas operan como **usuarios técnicos** con rol propio.

- **T-06 API REST** (ADR-004)
  Versionada (`/api/v1`), con especificación OpenAPI generada automáticamente, tokens de vida corta, revocación desde el panel, rate limiting y auditoría de cada llamada.

- **T-07 MCP** (ADR-005)
  - Servidor remoto HTTP dentro de la aplicación Next.js, autenticado con OAuth 2.1 y registro dinámico de clientes.
  - El agente actúa siempre en nombre de un usuario y nunca puede hacer más de lo que ese usuario puede hacer.
  - Herramientas **curadas por intención**, no una por caso de uso.
  - Cada herramienta pertenece a una categoría: `lectura`, `escritura` o `sensible`. Las sensibles están desactivadas por defecto y requieren confirmación.
  - Lo expuesto es configurable desde el panel de administración. **Acceso efectivo = habilitación global ∩ permiso del rol ∩ permisos del usuario.**

## 3. Principios de documentación

- **D-01** La spec manda sobre el código.
- **D-02** Los requisitos describen resultados verificables, no implementación.
- **D-03** Ningún supuesto se da por hecho sin registrarlo como pregunta o decisión.
- **D-04 Definición de "hecho"** — un requisito está terminado cuando tiene:
  1. Caso(s) de uso implementados en la capa de aplicación.
  2. Tests de los casos de uso y de las reglas de autorización (incluido RLS).
  3. Endpoint REST documentado en el OpenAPI.
  4. Exposición vía herramienta MCP configurable, o justificación escrita en el REQ de por qué no aplica.
  5. Sección **"Notas para el manual"** completa en el documento del requisito.
- **D-05** Cada requisito vive en su propio archivo: `requirements/REQ-XXX-nombre.md`.
