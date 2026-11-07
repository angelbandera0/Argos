# Informe T00 · Documentos base del Módulo 2

Estado: completada (solo documentación, sin código). Modelo: Haiku 5.5.

## Cambios
- `docs/requirements/REQ-007-roles-y-permisos.md`: CA-01 amplía módulos nuevos y permisos especiales (referencia a spec 05); «Fuera de alcance» sin inventario. Resto sin cambios.
- `docs/DOMAIN.md`: DR-019 (ubicaciones), DR-020 (producto almacenable), DR-021 (lote con costo), DR-022 (libro de movimientos), DR-023 (solicitud), DR-024 (pedido de compra), DR-025 (divisa y denominación), DR-026 (notificación). Quitado «Almacén central y productos básicos» de «Fuera del dominio».
- `docs/DECISIONS.md`: ADR-013 (libro inmutable, Propuesta), ADR-014 (costos con RLS, Propuesta), ADR-015 (PEPS con lote elegible, Propuesta), ADR-016 (costo = reportado, Aceptada), ADR-017 (stock solo al confirmar, Aceptada).
- `docs/OPEN_QUESTIONS.md`: M2-Q01 a M2-Q08 en la misma tabla; la nota de cabecera distingue Q-xxx y M2-Qxx.
- `docs/requirements/REQ-010` a `REQ-013`: creados desde la plantilla, estado Borrador, con CA de los archivos 01 a 04 de la spec.
- `docs/REQUIREMENTS.md`: sección «Módulo 2» con los cuatro REQ.
- `docs/README.md`: sin cambios (su tabla no lista REQ individuales).

## Criterios de decisión
- Se incluyeron como reglas las decisiones [U] y las [P] que son M2-Dxx en 00-vision. Las demás [P] (p. ej. S-03, S-14, R-03, R-09, N-02 a N-04, D-03, D-04) quedan solo en la spec.
- Las preguntas abiertas no se convirtieron en reglas; las DR las citan como pendientes.

## Pruebas
No aplican (sin código). `pnpm verify` no se ejecutó. `scripts/worktree-setup.sh` falló por corepack/pnpm en Node 18 (`Invalid host defined options`); no bloquea un cambio solo documental.

## Inquietudes
- Prioridad de REQ-010 a REQ-013 fijada en «Imprescindible» (la spec no la indica); confirmar.
- El Co-Authored-By pedido era Sonnet 5.5, pero el commit usa Haiku 5.5, que es el modelo que hizo el trabajo.
