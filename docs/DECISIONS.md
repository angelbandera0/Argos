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

---

### ADR-006 — Jerarquía compañía → sede → tienda y multitenancy
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** El negocio necesita agrupar tiendas por lugar de trabajo y aislar los datos de cada dueño. Se usó primero "entidad" para dos cosas distintas (empresa y centro de trabajo).
- **Decisión:** Tres niveles: **Compañía** (dueña del negocio y tenant), **Sede** (centro de trabajo) y **Tienda**. El aislamiento (P-01) se aplica por compañía. Catálogo, roles y ajustes son de la compañía. Los nombres "sede" y "tienda" son propuestos; "entidad" deja de usarse.
- **Alternativas descartadas:**
  - *Entidad = empresa, sin nivel intermedio:* no representa el centro de trabajo que agrupa tiendas.
  - *Catálogo por sede o tienda:* se descartó por ahora; el catálogo es común a la compañía.
- **Consecuencias:** toda tabla de negocio lleva la compañía y su RLS se basa en ella; un administrador puede tener acceso a varias compañías.

---

### ADR-007 — Credenciales según el rol: contraseña y PIN
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** Los usuarios operativos necesitan entrar rápido en la tienda; los administradores tienen mucho poder. Un PIN de 6 dígitos tiene solo un millón de combinaciones, y un PIN sin identificador tendría que ser único en todo el sistema y permitiría adivinar usuarios válidos.
- **Decisión:** Superadmin y administradores entran con usuario y contraseña (el superadmin recupera la suya por correo). Los usuarios operativos entran con username y PIN de 6 dígitos, generado por el sistema, mostrado una sola vez y modificable solo por un administrador. Bloqueo tras intentos fallidos y rate limiting. Sin API keys estáticas.
- **Alternativas descartadas:**
  - *Solo PIN:* PIN único global, 10⁶ combinaciones, filtra la existencia de PIN y no permite bloquear por usuario.
  - *PIN para administradores:* demasiado débil para la cuenta que crea usuarios y desactiva compañías.
  - *PIN escrito por el administrador:* favorece PIN triviales como 123456.
- **Implementación acordada (2026-10-25):**
  1. Cada usuario operativo es un usuario de Supabase Auth con un correo interno sintético derivado solo del username (dominio interno no resoluble) que nadie ve ni usa. El username lleva el código de la compañía como prefijo (`código.nombre`) y es único en todo el sistema.
  2. La credencial guardada no es el PIN: es un HMAC de `username:PIN` con una clave secreta del servidor que no está en la base de datos. Así un volcado de la base no permite descubrir PIN por fuerza bruta.
  3. El login con PIN pasa siempre por una acción del servidor, nunca directo desde el navegador. Allí se limitan los intentos por username y por IP y se devuelve siempre un error genérico.
  4. El bloqueo por usuario tras 5 fallos se hace en la acción del servidor del login con PIN, no con el Password Verification Hook (solo Teams y Enterprise; no existe en el plan Free). El contador `profiles.failed_pin_attempts` lo incrementa una función SQL atómica (`register_pin_failure`) con permisos elevados; al quinto fallo `status = locked` y se banea al usuario de Auth. La acción comprueba `status` antes de llamar a Auth y devuelve el mismo error genérico. Un PIN correcto reinicia el contador. Basta porque la credencial en Auth es un HMAC de 256 bits con pepper: el endpoint de contraseña de Supabase no permite probar PIN. Riesgos residuales: compromiso del servidor o del pepper, y bloqueo intencionado de un username conocido (lo desbloquea un administrador).
  5. Compañía y rol viajan como claims del JWT mediante el Custom Access Token Hook, y las políticas RLS deciden con ellos. La tienda activa y el cambio de tienda sin PIN se resuelven en el diseño.
  6. El MCP es solo para el superadmin y los administradores. Los usuarios operativos usan la API únicamente desde la app oficial, mediante el flujo de ADR-011.
  7. Superadmin y administradores usan verificación en dos pasos (TOTP).
  8. La duración de la sesión se fuerza en la aplicación (`app_sessions`), porque el *time-box* de Supabase es solo de plan Pro y global. El tiempo menor por rol se aplica siempre en la aplicación.
  9. **Excepción a T-04 (`service_role`):** se permite usar la clave `service_role` solo para crear usuarios y restablecer PIN o contraseñas (`auth.admin`). Se aísla en un único adaptador de administración de usuarios, que antes verifica en un caso de uso que quien llama es administrador con acceso a la compañía del usuario afectado.
  10. Bloqueo tras 5 PIN incorrectos seguidos, sin desbloqueo automático. Un administrador desbloquea y el sistema genera un PIN nuevo.
  11. El username es `código.nombre`, con el código de 4 caracteres que el sistema asigna a la compañía. Es único en todo el sistema (al entrar solo se escribe username y PIN) y evita revelar entre compañías qué usuarios existen.
  12. La contraseña del superadmin y de los administradores tiene un mínimo de 12 caracteres, sin reglas de composición forzadas.
- **Consecuencias:** el superadmin único depende de la recuperación por correo. Verificado en el spike Q-014: el plan Free no permite limitar la sesión en Supabase ni tiene el Password Verification Hook, por eso ambos se resuelven en la aplicación.

---

### ADR-008 — Eliminar es borrado lógico; desactivar con motivo
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** Los roles incluyen la operación "eliminar", pero la trazabilidad exige no perder datos.
- **Decisión:** Eliminar es siempre borrado lógico. Las compañías, sedes y tiendas con datos asociados no se eliminan: las desactiva el fundador o el superadmin, con un motivo elegido de una lista o escrito a mano.
- **Alternativas descartadas:** *borrado físico* (pierde trazabilidad).
- **Reglas acordadas:** se puede reactivar (fundador o superadmin, con motivo libre). Desactivar una compañía o sede deja inaccesible lo que cuelga de ella, pero cada nivel conserva su propio estado. Lo que no tiene datos asociados se puede eliminar con borrado lógico. Los motivos predefinidos están en DR-015.
- **Consecuencias:** las consultas normales deben excluir lo eliminado, y el acceso debe comprobar el estado de toda la cadena compañía → sede → tienda.

---

### ADR-009 — Sesión de máximo un día, con tope por compañía
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** Habrá turnos de día y de noche en un módulo posterior, y se quiere limitar el riesgo de sesiones abiertas.
- **Decisión:** Toda sesión dura como máximo un día. Cada rol puede fijar un tiempo menor. El tope por compañía lo cambia solo un administrador, en los ajustes de la compañía, con traza. Al entrar a una tienda manda el tope de su compañía.
- **Alternativas descartadas:** *el tope más bajo de todas las compañías del rol* (penaliza a las tiendas de compañías con topes mayores).
- **Reglas acordadas:** cambiar de tienda no reinicia el reloj; se aplican el rol y el tiempo de sesión de la nueva tienda, contados desde el inicio de sesión. Si ya se cumplió, la sesión se cierra.
- **Consecuencias:** la sesión debe guardar su hora de inicio y comprobarla al cambiar de tienda.

---

### ADR-010 — Historial de operaciones por módulo
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** Se pide saber quién hizo qué y cuándo en cada módulo, y que cada usuario vea solo lo que su rol le permite.
- **Decisión:** Historial inmutable por módulo con quién, qué cambió (anterior y nuevo), fecha y hora, contexto y canal. La visibilidad sigue el permiso de ver del rol sobre el módulo. Accesos, bloqueos y cambios de PIN solo los ven los administradores.
- **Alternativas descartadas:** *un historial global sin filtro por rol* (expone información fuera del permiso del usuario).
- **Consecuencias:** toda escritura debe pasar por casos de uso que registran el historial; el historial no guarda PIN ni contraseñas. Los administradores ven el historial completo de sus compañías y el superadmin el de todas.

---

### ADR-011 — Acceso seguro de aplicaciones cliente a la API
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** Habrá una app oficial usada por usuarios operativos (con PIN) y administradores. Debe conectarse a la API sin exponer credenciales ni claves.
- **Decisión:**
  1. La app es un cliente público de OAuth 2.1: código de autorización con PKCE, sin claves secretas dentro de la app.
  2. La app nunca maneja el PIN ni la contraseña: abre una ventana segura del navegador del sistema con nuestra página de login (username + PIN para operativos; contraseña + TOTP para administradores).
  3. Direcciones de retorno exactas con enlaces universales (iOS) o app links (Android), no esquemas personalizados.
  4. Tokens de acceso de vida corta con refresh tokens rotativos, guardados en el almacén seguro del móvil (Keychain o Keystore). El refresh deja de funcionar al cumplirse el tope de sesión de un día.
  5. Desactivar, bloquear o cambiar el PIN de un usuario invalida sus sesiones de inmediato.
  6. El token respeta el rol del usuario y RLS. Rate limiting y auditoría por llamada, con canal "app" en el historial.
  7. Futuro (no v1): atestación de la app (Play Integrity y App Attest).
- **Alternativas descartadas:**
  - *Pantalla de PIN propia dentro de la app que envía las credenciales al servidor:* la app maneja credenciales y no es el flujo de OAuth 2.1; más fácil de suplantar.
  - *API keys estáticas en la app:* se extraen del binario (ya descartadas en ADR-004).
- **Consecuencias:** el PIN se escribe en una página del navegador y no en una pantalla propia de la app. Depende del servidor OAuth de Supabase (beta, ver ADR-004).

---

### ADR-012 — Exposición REST y MCP del módulo 1
- **Fecha:** 2026-10-25
- **Estado:** Aceptada
- **Contexto:** D-04 exige exposición vía MCP o justificación escrita.
- **Decisión:**
  - **MCP, no se expone:** compañías, sedes, tiendas, usuarios, roles, PIN, contraseñas y ajustes.
  - **MCP, catálogo:** `lectura` (consultar y buscar productos y categorías), `escritura` (crear y editar productos) y `sensible` (eliminar productos, desactivado por defecto y con confirmación).
  - **MCP, historial:** `lectura` según el permiso del rol. El historial de accesos y PIN nunca se expone.
  - El MCP es solo para el superadmin y los administradores.
  - **API REST:** cubre las mismas operaciones, más la gestión de estructura y usuarios para los administradores.
- **Alternativas descartadas:** *exponer la gestión de accesos por MCP* (un agente comprometido podría escalar permisos).
- **Consecuencias:** la configuración de qué herramientas están habilitadas se hace en REQ-001.
