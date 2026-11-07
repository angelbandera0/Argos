# T16c · Bajas, ajustes, sobrantes y motivos

- `components/stock/ops-dialogs.tsx` (WriteOffDialog/Button, SurplusDialog/Button, AdjustLotDialog), lógica zod en `ops-logic.ts`, acciones en `app/(app)/existencias/ops-actions.ts`.
- Baja: motivo estándar/personalizado, «otro» exige descripción (zod y caso de uso); sale FIFO. Habilitada en lista y detalle (almacén).
- Ajuste: acción de fila en pestaña Lotes (restitución hasta cantidad inicial, descuento hasta lo restante). Sobrante: en detalle, costo solo con `costs`.
- Motivos: `/existencias/motivos` (solo admin; entrada «Motivos de baja» en el menú Almacén): crear (código derivado del nombre), renombrar, activar/desactivar, eliminar; estándar sin renombrar/eliminar.
- Sin hacer: elegir lotes en la baja, sobrante desde la lista, verificación visual.
