# Rol: matriz única de permisos

- Todos los módulos (Productos, Divisas, Existencias, Solicitudes, Pedidos, Notificaciones) en una sola tabla; datos en `ALL_MODULES` (role-form-logic.ts). Notificaciones solo "Ver" (resto deshabilitado con title).
- Plantillas de la matriz se aplican a todos los módulos.
- Permisos especiales en su sección propia, agrupados por módulo (`SpecialPermissions`); sin acordeones.
- Textos corregidos (Divisas sin tasas de cambio).
- Verificación visual pendiente.
