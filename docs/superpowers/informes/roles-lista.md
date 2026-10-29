# /roles como grilla de tarjetas

- Cabecera con descripción, barra (buscador, separador, chips «Todas las compañías»/una por compañía en `?compania=`, «n roles»), `EntityCard` por rol (icono llave red-tint, compañías permitidas, chips Ver/Crear/Editar/Eliminar de Productos, sesión, pila de avatares y «n usuarios»/«Ninguno», «Editar rol» contorno rojo), menú «⋯» con Eliminar rol (`DeleteRoleDialog` ahora controlable) y tarjeta punteada «Crear un rol nuevo». Vacío con `EmptyState`; `loading.tsx` con la misma forma. `role-table.tsx` eliminado.
- Datos: nuevo `RoleRepository.listUsers` (lectura de `user_stores` + `profiles`, RLS, sin migraciones); lógica pura en `components/roles/role-card-data.ts` con test.
- Omitido: rol del sistema (candado, «Del sistema», «No se puede editar»: no existe tal rol en el modelo); «Ver usuarios» (`/usuarios` no tiene filtro por rol); «Duplicar» (no hay caso de uso). Tarjeta final sin la frase de duplicar.
- Pendiente: comprobar en navegador (`/verificar-ui`); avatares por nombre de usuario (tono determinista, no el color exacto de la captura).
