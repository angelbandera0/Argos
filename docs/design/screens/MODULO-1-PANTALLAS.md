# Pantallas del módulo 1

> Diseño de pantallas de REQ-005 a REQ-009. Sigue `../DESIGN.md` y usa solo los tokens de `../tokens.css`. Las maquetas navegables están en `mockups/` (abre `mockups/index.html` desde un servidor local, por ejemplo `python3 -m http.server` dentro de `docs/design/`).
> Estado: **En revisión**. **[mi decisión]** = no estaba acordado y lo propongo aquí.

## 1. Principios para estas pantallas

1. **El PIN se escribe en seis casillas con el teclado numérico del sistema.** No hay teclado en pantalla: un único campo real (`DESIGN.md` §6.14) permite pegar, autocompletar y funciona con lectores de pantalla.
2. **Un solo mensaje de fallo al entrar.** Nunca dice si el usuario existe, si el PIN era el incorrecto o si está bloqueado (REQ-006, CA-12b).
3. **Lo que no se permite no se muestra; si se muestra, se explica.** Un operador no ve menús de gestión. Un administrador sin permiso para desactivar ve el botón desactivado y el motivo.
4. **Los secretos se muestran una sola vez.** El PIN nuevo aparece en un modal y no se puede cerrar sin haberlo copiado **[mi decisión]**.
5. **El estado de cada compañía, sede y tienda se ve siempre.** Chip "Activa" o "Desactivada" en cada fila.
6. **Todo en español**, tono directo, verbos de acción ("Guardar rol", "Desactivar compañía").

## 2. Navegación

| Vista | Patrón (DESIGN.md §5) |
|---|---|
| Web ≥ 1280 px | Panel lateral de 236 px con etiquetas |
| Tablet 768–1279 px | Barra de iconos de 84 px |
| Móvil < 768 px | Barra inferior flotante de 5 elementos |

| Rol | Opciones del menú |
|---|---|
| Superadmin | Administradores · Compañías · Historial |
| Administrador | Compañías · Usuarios · Roles · Catálogo · Historial |
| Operador | Solo lo que su rol permite: Productos, Historial de Productos |

- **Compañía activa [mi decisión].** Un administrador puede tener varias compañías. Una lista desplegable arriba elige con cuál trabaja; usuarios, categorías, productos y historial se filtran por ella. Un operador tiene una sola compañía y no ve el selector.
- **Tienda activa.** Un operador ve su tienda actual en la cabecera y puede cambiarla sin PIN (DR-013).
- **Historial** agrupa dos pestañas: "Operaciones" (por módulo) y "Accesos" (solo administradores).
- **Cerrar sesión [mi decisión].** Todos los roles tienen "Cerrar sesión" solo dentro del menú de perfil de la barra superior (avatar + nombre + rol, a la derecha, igual en web, tablet y móvil; `LogOut` en código); el panel lateral, el rail y la barra inferior no llevan usuario ni botón de salir. La etiqueta "MENÚ" del panel se restituye (web) [decisión del usuario, DESIGN (2).md]. La barra superior es común: fecha y hora en vivo (zona horaria del navegador, actualiza cada minuto), buscador y campana deshabilitados (`aria-disabled`, "Próximamente"; sin backend en el Módulo 1), slot de acción primaria y perfil a la derecha; el menú de perfil tiene cabecera (avatar, nombre, `usuario · rol`; correo para administradores y superadmin), "Ver perfil" (`/perfil`, solo lectura: nombre, usuario o correo, tipo de cuenta y compañía del operador) y "Cerrar sesión" en rojo. En la vista del operador la barra conserva el cambiador de tienda. La maqueta (`shell.js`) ya no muestra "Menú" ni el bloque de usuario, pero no dibuja la barra superior: divergencia anotada. Un operador termina su sesión de app (`ended_at`) y vuelve a `/entrar`; administradores y superadmin cierran su sesión de Auth y vuelven a `/login`. Si la sesión ya expiró, redirige igual sin error. Se borra la compañía activa del navegador.
- En móvil, "Accesos" y los ajustes de compañía viven dentro de sus pantallas, no en la barra inferior.

## 3. Inventario de pantallas

| ID | Pantalla | Ruta | Quién | REQ | Maqueta |
|---|---|---|---|---|---|
| A-01 | Entrar (superadmin y administradores) | `/login` | Superadmin, Administrador | 006 | — |
| A-02 | Segundo factor (TOTP) | `/login/2fa` | Superadmin, Administrador | 006 | — |
| A-03 | Cambiar contraseña inicial y enrolar TOTP | `/primer-ingreso` | Superadmin, Administrador | 006 | — |
| A-04 | Recuperar contraseña | `/recuperar` | Superadmin | 006 | — |
| A-05 | Entrar con PIN | `/entrar` | Operador | 006 | `01` |
| A-06 | Elegir tienda | `/tienda` | Operador | 006 | `01` |
| A-07 | Sesión terminada / sin tiendas | `/entrar` (estados) | Operador | 006 | `01` |
| S-01 | Administradores (lista) | `/superadmin/administradores` | Superadmin | 006 | — |
| S-02 | Nuevo administrador (contraseña temporal mostrada una vez) | `/superadmin/administradores/nuevo` | Superadmin | 006 | — |
| C-01 | Compañías (lista) | `/companias` | Admin, Superadmin | 005 | — |
| C-02 | Nueva compañía | `/companias/nueva` | Administrador | 005 | — |
| C-03 | Detalle de compañía: sedes y tiendas | `/companias/[id]` | Admin, Superadmin | 005 | `04` |
| C-04 | Administradores con acceso (dar y quitar) | `/companias/[id]/administradores` | Admin, Superadmin | 005 | — |
| C-05 | Ajustes (tope de sesión) | `/companias/[id]/ajustes` | Administrador | 005, 006 | — |
| C-06 | Desactivar y reactivar con motivo | modal en C-03, sedes y tiendas | Fundador, Superadmin | 005 | `04` |
| U-01 | Usuarios (lista) | `/usuarios` | Administrador | 006 | — |
| U-02 | Nuevo usuario | `/usuarios/nuevo` | Administrador | 006 | — |
| U-03 | Detalle de usuario: tiendas y rol, actividad | `/usuarios/[id]` | Administrador | 006 | `02` |
| U-04 | PIN nuevo (modal, una sola vez) | modal en U-03 | Administrador | 006 | `02` |
| R-01 | Roles (lista) | `/roles` | Administrador | 007 | — |
| R-02 | Editor de rol | `/roles/[id]` | Dueño del rol | 007 | `03` |
| K-01 | Categorías | `/categorias` | Administrador | 008 | — |
| P-01 | Productos (lista y filtros) | `/productos` | Administrador, Operador con "Ver" | 008 | — |
| P-02 | Producto (crear y editar) | `/productos/[id]` | Con "Crear" o "Editar" | 008 | — |
| H-01 | Historial de operaciones | `/historial/[modulo]` | Según permiso "Ver" del módulo | 009 | — |
| H-02 | Accesos | `/historial/accesos` | Administradores | 009 | — |
| L-01 | Placeholders de carga | — | — | — | `05` |

## 4. Pantallas con maqueta

### A-05 y A-06 · Entrar con PIN y elegir tienda (`01-login-pin.html`)

```
┌──────── Entrar ────────┐        ┌──── Elige tu tienda ────┐
│ ● Argos                │        │ (LP) Luis Pérez     [⏻] │
│ Usuario  [k7m2.caja1 ] │        │ SEDE CENTRO             │
│ PIN        👁 Mostrar   │        │ [▣ Tienda Obispo   ›]   │
│ [●][●][●][●][|][ ]     │        │ [▣ Tienda Galiano  ›]   │
│ Faltan 2 dígitos.      │        │ SEDE VEDADO             │
│ ¿Olvidaste tu PIN?     │        │ [▣ Calle 23 · no disp.] │
│ [      Entrar       ]  │        │ Tu sesión termina 22:30 │
└────────────────────────┘        └─────────────────────────┘
```

- Web y tablet: tarjeta de panel centrada de 480 px, con el logotipo arriba a la izquierda de la página. Móvil: pantalla completa sobre `--color-panel`, con el botón "Entrar" fijo abajo.
- El usuario se escribe completo (`código.nombre`, DR-011). El PIN se introduce en seis casillas: la activa lleva borde rojo y cursor; las llenas, un punto, o el dígito si se pulsa "Mostrar".
- "Entrar" está desactivado hasta que hay usuario y seis dígitos.
- "¿Olvidaste tu PIN?" abre un aviso: solo un administrador puede dar un PIN nuevo (DR-011), que debe pedir a quien administra su compañía.
- Al enviar, el botón pasa a "Entrando…" con spinner y queda desactivado.
- Cualquier fallo marca las seis casillas en rojo y muestra: "Usuario o PIN incorrectos, o el usuario está bloqueado. Si sigue pasando, pide ayuda a un administrador." No hay variantes y nunca se dice cuántos intentos quedan: sería revelar que el usuario existe (REQ-006, CA-12b).
- Las tiendas se agrupan por sede y muestran el rol del usuario en cada una. Una tienda cuya cadena compañía → sede → tienda no está activa aparece desactivada con el motivo "No disponible: tienda desactivada" (DR-015).
- Debajo se indica la hora de fin de sesión, calculada con el menor de: un día, el tope de la compañía y el tiempo del rol **[mi decisión]**.
- Sin tiendas disponibles: pantalla con explicación y "Cerrar sesión". Sesión terminada: pantalla con "Volver a entrar".

### U-03 y U-04 · Detalle de usuario y PIN nuevo (`02-detalle-usuario.html`)

- Cabecera: avatar, nombre, username (`código.nombre`), estado ("Activo" o "Bloqueado") y acciones. "Desbloquear" (principal) solo aparece si está bloqueado y avisa de que se genera un PIN nuevo y se cierran las sesiones.
- Pestaña "Tiendas y rol": interruptor "Mismo rol en todas las tiendas" (activado por defecto, DR-009). Desactivado, cada tienda tiene su propio selector de rol.
- Si el rol lo creó otro administrador, la fila muestra "Rol de otro administrador" y no deja cambiarlo (DR-008).
- Pestaña "Actividad": accesos del usuario (solo administradores).
- Cambiar PIN: primero un modal de confirmación; después otro con el PIN en grande. Se copia con "Copiar PIN"; "Ya lo copié" se activa al copiar y Escape no cierra el modal hasta entonces.

### R-02 · Editor de rol (`03-editor-roles.html`)

- Tres tarjetas: datos (nombre y tiempo de sesión), compañías donde vale (interruptores, todas activadas por defecto, DR-008) y permisos por módulo.
- Permisos: casillas Ver, Crear, Editar y Eliminar por módulo. Activar cualquiera de las otras exige "Ver", y quitar "Ver" las desactiva **[mi decisión]**. Un aviso recuerda que la gestión de compañías, sedes, tiendas, usuarios, roles y categorías es solo de administradores.
- El tiempo de sesión nunca supera el tope de la compañía. La etiqueta "Solo tú ves y editas este rol" recuerda DR-008.
- Errores: nombre repetido ("Ya tienes un rol llamado “Cajero”. Elige otro nombre.").

### C-03 y C-06 · Compañía y desactivación (`04-desactivar-compania.html`)

- Árbol de sedes y tiendas con chip de estado en cada nivel. Debajo, la tarjeta "Estado de la compañía".
- "Desactivar compañía" abre un modal con los siete motivos (cierre definitivo, cierre temporal, reestructuración, remodelación, creada por error, fin de contrato o acuerdo, otro). "Otro" exige un texto. El botón confirmar sigue desactivado hasta tener motivo.
- El modal avisa de la cascada: lo que cuelga queda inaccesible y cada nivel conserva su estado (DR-015).
- Sin permiso (no es el fundador ni el superadmin): el botón aparece desactivado con el texto "Solo el fundador o el superadmin pueden desactivarla. El fundador es …".
- Desactivada: aviso con el motivo, quién y cuándo, y el botón "Reactivar compañía".

## 5. Pantallas sin maqueta

Siguen los mismos componentes de `DESIGN.md`; lo específico:

- **A-01 · A-04:** formulario centrado como A-05, con correo y contraseña. El error también es genérico ("Correo o contraseña incorrectos.").
- **A-02:** seis casillas para el código TOTP, con foco automático y botón "Verificar".
- **A-03:** primer ingreso. Dos pasos: nueva contraseña (mínimo 12 caracteres, con indicador de longitud, sin reglas de composición forzadas) y enrolar TOTP (código QR y campo de verificación).
- **S-01 · C-01 · U-01 · R-01 · P-01:** lista en filas sobre panel, con buscador, filtro y botón principal "Nuevo …". Estado vacío: icono, una frase y el botón de crear.
- **S-02:** formulario de correo y nombre; al crear, modal con la contraseña temporal mostrada una sola vez, igual que el PIN (U-04).
- **C-04:** lista de administradores con acceso. "Quitar acceso" solo para el fundador o el superadmin; la fila del fundador lleva la etiqueta "Fundador" y no tiene esa acción (DR-005).
- **C-05:** campo "Tope de sesión" (horas, máximo 24). Guardar queda en el historial.
- **U-02:** nombre, nombre de usuario (el prefijo `código.` es fijo y se muestra delante), rol, tiendas. Al guardar, modal del PIN (U-04).
- **K-01 y P-02:** formularios con nombre, categoría (una sola), descripción opcional y estado activo. Error de nombre repetido dentro de la compañía.
- **H-01:** tabla con fecha, quién, acción, módulo y canal. Cada fila abre un detalle con el valor anterior y el nuevo. Filtros por módulo, usuario y fechas. Un operador solo ve los módulos que su rol puede ver.
- **H-02:** igual que H-01, con los eventos de acceso; los PIN y contraseñas nunca aparecen.

## 6. Estados comunes

| Estado | Tratamiento |
|---|---|
| Cargando | Placeholder con la forma final (§7) |
| Vacío | Icono en círculo, una frase que explica y el botón de la primera acción |
| Error de campo | Texto rojo bajo el campo con icono; el campo se marca con borde rojo y `aria-invalid` |
| Error de la operación | Aviso rojo claro arriba del formulario: qué pasó y cómo seguir. No se pide disculpas |
| Sin permiso | Opción oculta o desactivada con la razón; la página directa muestra "No tienes acceso a esto" |
| Operación en curso | Botón desactivado con spinner y texto en gerundio ("Guardando…") |
| Éxito | Aviso breve que usa el mismo verbo del botón ("Guardado") |

## 7. Placeholders de carga (`mockups/05-carga.html`)

Definidos en `DESIGN.md` §6.15 y `tokens.css`.

- **Contenido:** `.skeleton` con la forma final de la lista, el formulario o la tabla. Dentro de un panel se usa `.skeleton-on-panel`.
- **Acciones:** `.spinner` dentro del botón, que queda desactivado y mantiene su ancho.
- **Navegación:** `.route-progress`, barra roja fina arriba.
- Se pintan solo si la carga pasa de 150 ms; el contenedor lleva `aria-busy` y "Cargando…" solo para lectores de pantalla.
- Con movimiento reducido el brillo se detiene y la barra queda fija.
- En la implementación, cada ruta con datos lleva su `loading.tsx` con el placeholder de esa pantalla (hay uno por cada patrón de la maqueta 05: lista, formulario, historial, detalle).

## 8. Accesibilidad específica

- El PIN es un único `<input>` real con su etiqueta y un texto de ayuda enlazado ("Faltan 2 dígitos."); las casillas son decorativas (`aria-hidden`). El campo es de tipo contraseña, así que los dígitos no se leen en voz alta salvo con "Mostrar".
- El modal del PIN y los de confirmación usan `<dialog>`: el foco queda atrapado y vuelve al botón que lo abrió.
- Los interruptores son `role="switch"` con su etiqueta; los estados se dicen con texto además del color (chips con palabra).
- Objetivos táctiles de 44 px o más, incluidas las casillas de permisos (con su etiqueta clicable).
- El mensaje de error de login se anuncia con `role="alert"`.

## 9. Decisiones mías y pendientes

**Mías (marcadas arriba):** selector de compañía activa; el modal del PIN no se cierra sin copiarlo; "Ver" obligatorio para el resto de permisos; hora de fin de sesión visible en la elección de tienda.

**Ajuste respecto a la referencia de login:** el diseño que me pasaste decía "PIN incorrecto. Te quedan 2 intentos." Lo cambié por el mensaje genérico, porque indicar los intentos restantes confirma que el usuario existe.

**Pendientes:** el nombre de producto del sistema es provisional ("Argos"); no hay logo; los iconos son de estilo Lucide dibujados a mano en las maquetas y se sustituyen por `lucide-react` al implementar.
