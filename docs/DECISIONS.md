# Registro de Decisiones (ADR)

> Cada decisión cerrada, con su contexto y las alternativas descartadas. Las decisiones no se borran: se sustituyen por otras nuevas.

## Plantilla

```markdown
### ADR-XXX — Título
- **Fecha:**
- **Estado:** Propuesta | Aceptada | Sustituida por ADR-YYY
- **Contexto:** qué problema o pregunta obliga a decidir
- **Decisión:**
- **Alternativas descartadas:** y por qué
- **Consecuencias:** qué se gana, qué se pierde, qué obliga a hacer
```

---

### ADR-001 — Metodología de desarrollo
- **Fecha:** 2026-10-24
- **Estado:** Aceptada
- **Contexto:** El sistema se desarrollará con apoyo de agentes de IA. Hace falta una fuente de verdad estable que evite que el agente rellene huecos con supuestos, sobre todo en reglas de negocio sensibles (dinero, inventario, permisos, aislamiento entre entidades).
- **Decisión:** SDD en modalidad *spec-anchored* (la spec se mantiene viva junto al código y se actualiza antes que él), con requisitos redactados como resultados medibles al estilo ODD.
- **Alternativas descartadas:**
  - *ODD puro (metas/KPIs):* exige métricas ya existentes y un sistema maduro; en un proyecto nuevo aún no está definido qué es "correcto". Riesgo de que el agente optimice la meta saltándose restricciones de negocio.
  - *SDD spec-first:* la spec se abandona tras implementar y deriva del código con el tiempo.
  - *Spec-as-source:* exceso de rigidez para una fase de descubrimiento.
- **Consecuencias:** coste de mantener los documentos actualizados; a cambio, trazabilidad y menor retrabajo.

---

### ADR-002 — Stack tecnológico y hosting
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** Se necesita un stack que permita UI, API REST y servidor MCP en un mismo proyecto, con autenticación capaz de cumplir la especificación MCP.
- **Decisión:** Next.js (App Router) en Vercel. Supabase Cloud (Postgres, Auth, Storage).
- **Alternativas descartadas:** Supabase autoalojado (más control, pero más carga operativa; se mantiene como salida posible porque el OAuth server también está disponible autoalojado).
- **Consecuencias:**
  - Dependencia de dos proveedores cloud: el sistema requiere conexión a internet (impacta Q-008).
  - Hay que elegir región y revisar residencia de datos (Q-014).
  - Límites de ejecución de funciones serverless de Vercel a considerar en procesos largos (reportes, importaciones) y en conexiones MCP.

---

### ADR-003 — Clean Architecture con un núcleo y tres adaptadores
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** Supabase favorece que el frontend consulte la base de datos directamente; Clean Architecture exige que el núcleo no conozca la infraestructura. Además, toda funcionalidad debe ser utilizable desde UI, API y MCP.
- **Decisión:**
  - Casos de uso como núcleo; UI (server actions), REST y MCP como adaptadores delgados sobre los mismos casos de uso.
  - Supabase solo como infraestructura detrás de repositorios y puertos.
  - Doble barrera de aislamiento: autorización en casos de uso + RLS. El servidor actúa con el JWT del usuario; `service_role` prohibida salvo excepciones documentadas.
- **Alternativas descartadas:**
  - *UI consumiendo su propia API REST:* latencia y código extra sin beneficio, ya que la API queda garantizada por compartir casos de uso.
  - *Acceso directo con `supabase-js` desde el cliente:* acopla la lógica a la infraestructura y la dispersa fuera de los casos de uso.
  - *Solo RLS o solo validación en aplicación:* una única barrera es insuficiente para un aislamiento crítico.
- **Consecuencias:** más capas y algo más de código por funcionalidad; a cambio, exponer por MCP o REST es casi gratuito y el núcleo es testeable sin infraestructura.

---

### ADR-004 — Autenticación: OAuth 2.1 con Supabase y usuarios técnicos
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** Se pidió el enfoque más seguro para API y MCP. La especificación MCP exige OAuth 2.1 para servidores remotos. Supabase Auth ofrece servidor OAuth 2.1/OIDC (beta pública) con authorization code + PKCE, refresh tokens, registro dinámico de clientes y tokens que respetan RLS. No ofrece flujo *client credentials*.
- **Decisión:**
  - Un único mecanismo de autenticación (OAuth 2.1 de Supabase) para UI, API y MCP.
  - Las integraciones externas son **usuarios técnicos** con rol propio, autorizados una vez por un administrador y renovados con refresh tokens.
  - Sin API keys estáticas en v1.
  - Tokens de vida corta, revocación desde el panel, rate limiting, auditoría.
  - La autenticación se encapsula tras un puerto para poder sustituir el proveedor.
- **Alternativas descartadas:**
  - *API keys estáticas:* riesgo de filtración, difícil rotación, no aplican RLS de forma natural.
  - *Servidor OAuth propio:* coste y riesgo de seguridad de implementarlo a mano.
- **Consecuencias / riesgos:**
  - El servidor OAuth de Supabase está en **beta**: riesgo de cambios o fallos. Mitigado por el puerto de autenticación.
  - Las integraciones requieren un paso inicial de autorización interactiva.

---

### ADR-005 — Diseño MCP-first
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** El sistema debe poder usarse por agentes de IA desde el inicio, con control administrativo sobre lo expuesto.
- **Decisión:**
  - Servidor MCP remoto (HTTP) dentro de la app Next.js.
  - El agente actúa siempre en nombre de un usuario, sin exceder sus permisos.
  - Herramientas curadas por intención.
  - Categorías `lectura`, `escritura`, `sensible`; las sensibles desactivadas por defecto y con confirmación.
  - Configuración en dos niveles: habilitación global por herramienta + permiso por rol. Acceso efectivo = global ∩ rol ∩ permisos del usuario.
  - Página de conexión generada según lo habilitado para quien la consulta, con instrucciones por cliente.
- **Alternativas descartadas:**
  - *Servidor local (stdio):* impráctico para usuarios no técnicos.
  - *Una herramienta por caso de uso:* los agentes rinden peor con decenas de herramientas.
  - *Configuración por usuario o por token en v1:* complejidad desproporcionada para la primera versión.
- **Consecuencias:** cada requisito debe definir qué herramienta(s) MCP lo cubren y en qué categoría.
