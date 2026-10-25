# Modelo de Dominio

> Glosario y relaciones del negocio. Solo entra lo **confirmado**. Lo dudoso va a `OPEN_QUESTIONS.md`.

Estado: **En revisión** — primer módulo (organización, usuarios, roles, catálogo e historial).

## Glosario

| Término | Definición |
|---|---|
| Compañía | Dueña del negocio. Es el nivel multitenant: los datos de una compañía no se ven desde otra. |
| Sede | Lugar o centro de trabajo de una compañía. Agrupa tiendas. (Nombre propuesto; antes "entidad".) |
| Tienda | Punto de venta dentro de una sede. Es donde trabajan los usuarios operativos. |
| Superadmin | Único usuario de nivel plataforma. Crea administradores. |
| Administrador | Usuario que gestiona una o más compañías: sedes, tiendas, usuarios, roles, categorías y productos. |
| Fundador | Administrador que creó una compañía. Es permanente en ella. |
| Usuario operativo | Usuario que no es administrador. Trabaja en tiendas según su rol. |
| Rol | Conjunto de permisos por módulo y tiempo de sesión, creado por un administrador. |
| Operación | Una de cuatro acciones sobre un módulo: ver, crear, editar, eliminar. |
| Eliminar | Borrado lógico: el registro se marca como eliminado y no se pierde. |
| Desactivar | Dejar fuera de uso una compañía, sede o tienda con datos, indicando un motivo. Es reversible. |
| Categoría | Agrupación de productos, propia de una compañía. La gestionan solo los administradores. |
| Producto | Artículo del catálogo de una compañía. Tiene una sola categoría. |
| Historial | Registro de operaciones por módulo: quién, qué cambió, cuándo. |
| Tope de sesión | Duración máxima de una sesión en una compañía. Por defecto, un día. |

## Jerarquía organizativa

```
Compañía  (tenant, dueña del negocio)
 └── Sede (1..N)     centro de trabajo
      └── Tienda (1..N)
```

## Reglas de dominio

- **DR-001 Jerarquía.** Compañía → Sede → Tienda. Cada sede pertenece a una sola compañía y cada tienda a una sola sede.
- **DR-002 Superadmin único.** Existe un solo superadmin. Solo él crea administradores.
- **DR-003 Origen de las compañías.** Un administrador nuevo empieza sin compañías y crea las suyas. Quien crea una compañía es su fundador.
- **DR-004 Administración compartida.** Una compañía puede ser gestionada por varios administradores. Cualquier administrador de la compañía, o el superadmin, puede dar acceso a otro administrador.
- **DR-005 Fundador permanente.** El fundador o el superadmin pueden quitar el acceso de un administrador a la compañía; los demás administradores no. El fundador no puede ser removido de ella, ni por sí mismo ni por el superadmin.
- **DR-006 Administrador fundador protegido.** No se puede eliminar la cuenta de un administrador mientras sea fundador de alguna compañía.
- **DR-007 Gestión exclusiva de administradores.** Compañías, sedes, tiendas, usuarios, roles y categorías los gestionan solo los administradores. Ningún rol puede recibir estos permisos.
- **DR-008 Roles.** Un administrador crea roles y define, por módulo, qué operaciones permite cada uno. Un rol vale por defecto para todas las compañías del administrador y se puede excluir alguna.
- **DR-009 Asignación de usuarios.** Un usuario operativo pertenece a una sola compañía y solo puede estar asignado a tiendas de esa compañía. Tiene por defecto el mismo rol en todas sus tiendas y se puede cambiar por tienda.
- **DR-010 Credenciales por tipo de usuario.** Superadmin y administradores entran con usuario y contraseña. Los usuarios operativos, con username y PIN de 6 dígitos.
- **DR-011 PIN y username.** El PIN lo genera el sistema, se muestra una sola vez y solo un administrador puede cambiarlo. El username es único en todo el sistema. Tras 5 PIN incorrectos seguidos el usuario se bloquea; solo un administrador lo desbloquea, y al hacerlo se genera un PIN nuevo.
- **DR-012 Sesión.** Dura como máximo un día. Cada rol puede tener un tiempo menor. El tope por compañía lo cambia solo un administrador, en los ajustes de la compañía, y queda en el historial. Al entrar a una tienda manda el tope de la compañía de esa tienda.
- **DR-013 Elección de tienda.** El usuario operativo elige la tienda al entrar y puede cambiar de tienda sin volver a escribir el PIN. Cambiar de tienda no reinicia el reloj de la sesión: se aplican el rol y el tiempo de sesión de la nueva tienda, contados desde el inicio de sesión. Si ese tiempo ya se cumplió, la sesión se cierra y hay que entrar de nuevo con el PIN.
- **DR-014 Eliminar es borrado lógico.** Ninguna operación de eliminar borra datos físicamente.
- **DR-015 Desactivación, reactivación y eliminación.**
  - Una compañía, sede o tienda con datos asociados no se elimina: se desactiva. Solo lo hacen el fundador o el superadmin, y debe quedar un motivo.
  - Motivos predefinidos: cierre definitivo, cierre temporal, reestructuración, remodelación, creada por error, fin de contrato o acuerdo, y otro (texto obligatorio).
  - Se puede reactivar; lo hacen solo el fundador o el superadmin, con un motivo libre, y queda registrado.
  - Lo que cuelga de algo desactivado queda inaccesible, pero cada nivel conserva su propio estado: al reactivar una compañía, vuelven a operar las tiendas que estaban activas.
  - Los usuarios de una tienda desactivada no pueden entrar a ella y siguen entrando a las demás.
  - Una compañía, sede o tienda sin datos asociados (sin usuarios, productos, categorías ni operaciones posteriores a su creación) se puede eliminar con borrado lógico, solo por el fundador o el superadmin.
- **DR-016 Catálogo.** Categorías y productos son de la compañía y comunes a todas sus sedes y tiendas. Un producto tiene nombre, una sola categoría, descripción opcional y estado activo o inactivo. El nombre de una categoría y el de un producto son únicos dentro de la compañía (sin distinguir mayúsculas y sin contar lo eliminado). Una categoría con productos no se puede eliminar.
- **DR-017 Historial.** Toda creación, modificación, desactivación o eliminación queda registrada por módulo con quién, qué cambió (valor anterior y nuevo) y fecha y hora. Cada usuario ve el historial de los módulos que su rol puede ver. Los administradores ven el historial completo de las compañías a las que tienen acceso y el superadmin el de todas. Los accesos, bloqueos y cambios de PIN solo los ven los administradores.
- **DR-018 Aplicaciones cliente.** Una app oficial (para usuarios operativos y administradores) se conecta a la API con OAuth 2.1 (código de autorización con PKCE) y nunca maneja el PIN ni la contraseña (ADR-011). El MCP es solo para el superadmin y los administradores (ADR-012).

## Fuera del dominio (por ahora)

Se tratarán en módulos posteriores:

- Almacén central y productos básicos.
- Productos elaborados que se venden en tiendas.
- Inventario, ventas y caja.
- Apertura y cierre de turnos (día y noche).
- Copiar catálogos entre compañías (descartado por ahora).
