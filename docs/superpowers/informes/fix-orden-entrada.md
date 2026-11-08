# Fix: orden del flujo de entrada (Inicial y Directa)

- Orden: Producto > Presentación (granel / existentes / nueva, sin selector de unidad mezclado) > Cantidad (etiqueta dinámica; granel con unidad de la familia) > Contenido de cada presentación (cantidad + unidad, precargado con el habitual, obligatorio en nueva) > Unidad base (solo sin configurar, por defecto la unidad usada) > Costo/Divisa/«No conozco el costo».
- Resumen vivo «25 sacos × 10 lb = 250 lb» (+ equivalente en base si difiere), en milésimas exactas.
- Costo ahora siempre por unidad base, con «= X por saco» como pista. Quitado `pricePerPresentation` de la acción.
- `registerEntryAction`: guarda config si falta, crea presentación (nombre + contenido), contenido distinto del habitual = sobrescritura por lote; sin registrar si falla la configuración.
- Lógica en `components/stock/entry-logic.ts`; pruebas en `tests/unit/entry-logic.test.ts`. Sin navegador.
- Cambio posterior: quitados el aviso «aún no se almacena» y el selector «Unidad base»; la base se deduce (`deriveBaseUnit`: unidad del Contenido, o la de Cantidad a granel; 'u' si es conteo).
- `registerEntryAction` activa el producto (storable + base deducida) con `configure_units` antes de registrar; sin permiso o sin base deducible no registra nada (error traducido).
- Resumen y «Costo por <base>» usan la base deducida; productos ya configurados sin cambios. Pruebas actualizadas.
