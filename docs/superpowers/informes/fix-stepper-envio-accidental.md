# Fix: steppers no envían desde pasos intermedios

- Siguiente/Atrás: `type="button"` con keys `next`/`back`; el envío es `<Button key="submit" type="submit">` distinto, montado solo en el último paso (React no reutiliza el nodo).
- `components/ui/step-guard.ts` (`canSubmitStep`): `onSubmit` en paso intermedio hace preventDefault + avanzar (Enter avanza con validación); `action` envuelta (`guardedAction`) que nunca invoca el servidor fuera del último paso.
- `stepMsg` se limpia al editar cualquier campo (nombre, usuario, sugerencia, rol, tiendas; rol: nombre, compañías).
- Pruebas: `tests/unit/stepper-submit-guard.test.ts` (estructurales + render del paso 1). No hay DOM en el entorno, así que Enter/limpieza se verifican por guardia pura y estructura del código.
