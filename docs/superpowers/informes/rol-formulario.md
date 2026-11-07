# Formulario de rol (nuevo y editar), §6.38

- Layout 2 columnas: `FormShell aside` (`.form-shell-wide`, tokens nuevos `--size-form-wide` 820 y `--size-summary` 340; < 1024 px el panel va debajo). Excepción al ancho de 480 documentada en PATRONES-UI.
- Componentes nuevos (galería `/ui`, DESIGN-resumen, PATRONES-UI): `FormSection`, `SummaryPanel`/`SummaryCard`/`Checklist`, `ChoiceCard`, `ChoicePills`; `CheckboxBox` (casilla sin etiqueta) y `FormSubmit` exportados.
- `role-form.tsx` (3 secciones, resumen, validación al salir del campo y al enviar), `permission-matrix.tsx` (plantillas, matriz, Todo mixto, Ver bloqueado, bloque «Solo para administradores»), lógica pura en `role-form-logic.ts` con test. `loading.tsx` de ambas rutas con la misma forma.
- Contrato intacto: el formulario emite campos ocultos (`hours`, `company`, `products.*`) porque un checkbox deshabilitado (Ver bloqueado) no se envía.
- Sesión: Tope (vacío), 4, 8, 12, 24 h; si el rol guardado tiene otro valor se añade como píldora.
- Omitido (sin soporte): campo Descripción (el modelo no lo guarda; Nombre ocupa todo el ancho); barra fija inferior de botones en < 1024 px (el panel va debajo con sus botones).
- Pendiente: `/verificar-ui` en navegador (no se usó); reiniciar `pnpm dev` (CSS y archivos nuevos).
