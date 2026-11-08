# Roles: cards, detalle, stepper

- (a) Card: solo nombre (enlace), compañías, sesión, usuarios; Editar pasa al menú ⋯ junto a Eliminar; quitado el tile «Crear un rol nuevo» y la acción del estado vacío; cabecera «Crear rol». Detalle `/roles/[id]` (solo lectura); edición en `/roles/[id]/editar`.
- (b) `RoleStepper` (crear y editar): Datos, Compañías, Permisos, Especiales, Resumen; validación por paso, estado conservado, botón final «Crear rol»/«Guardar cambios». Lógica pura en `role-form-logic.ts`.
- (c) Switch «Almacén general» a la derecha del permiso (`.ui-special-row`), solo si está activo y es de ámbito.
- Pruebas: `pnpm verify:fast` OK (842 casos). Sin navegador; el controlador debe revisar visualmente. En edición no hay salto directo por clic en el Steps (solo Atrás/Siguiente).
