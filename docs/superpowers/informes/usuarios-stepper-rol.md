# Usuarios: stepper y vista previa del rol

- `components/users/user-stepper.tsx` (antes new-user-form): un solo componente `mode="create"|"edit"`. Crear: Datos, Rol, Tiendas, Resumen (PIN se genera al crear y sigue el diálogo «Usuario creado»). Editar: Rol, Tiendas, Resumen.
- Todos los campos viajan desde inputs ocultos controlados (`userFields`); los visibles no llevan `name`. Prueba SSR en `tests/unit/user-stepper.test.ts`.
- Vuelta al paso con error: `NewUserState.field` (servidor) + `stepForField`; roles: `roleErrorStep` (nameError -> paso 1).
- Vista previa: `components/users/role-preview.tsx` reutiliza PermissionsReadOnly/SpecialsReadOnly (6 módulos, Almacén general), compañías, sesión y usuarios; cambia con el rol; avisa e impide si no vale en la compañía; estado vacío.
- Edición: `updateUserAction` (un rol para todas las tiendas). Si el usuario tiene roles mixtos o ajenos, la página mantiene `AssignmentsForm`.
- verify:fast OK (848 casos). Sin navegador.
