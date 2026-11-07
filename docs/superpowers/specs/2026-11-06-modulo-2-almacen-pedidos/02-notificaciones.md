# 02 · Notificaciones

## Resultado esperado
Cada usuario recibe los avisos que le corresponden por su rol y alcance, los consulta desde la campana y desde una sección propia, y puede filtrarlos por módulo, operación y prioridad. Cualquier módulo puede emitir notificaciones.

## Entidad Notificación
Compañía, tienda (opcional), módulo emisor, operación, prioridad (info / aviso / urgente), título, texto corto, enlace a la entidad que la originó, creada en, destinatario, leída en (nulo = no leída), actor que la provocó.

## Reglas
- **N-01 [U]** Las notificaciones se clasifican por **módulo** y por **operación**; **[P]** además por prioridad y por tienda, para filtrar.
- **N-02 [P]** El destinatario se resuelve por **permiso + alcance**: se notifica a quienes tienen el permiso que corresponde en la tienda o compañía del hecho. Los módulos emisores declaran el permiso destino; no conocen usuarios concretos.
- **N-03 [P]** Cada destinatario recibe su propia copia, con su propio estado de lectura.
- **N-04 [P]** No se notifica al actor de su propia acción.
- **N-05 [U]** La campana de la barra funciona: contador de no leídas, últimas notificaciones, marcar como leída y «Ver todas».
- **N-06 [U]** Existe una sección de notificaciones con filtros (módulo, operación, prioridad, leída/no leída, tienda, fecha) y marcar como leídas.
- **N-07 [U]** El dashboard muestra **las solicitudes de reposición del día** y **las últimas diez notificaciones** del usuario.
- **N-08 [U]** Tiempo real o al cargar: pendiente (M2-Q03). El diseño no debe impedir cambiar de uno a otro.
- **N-09** El contenido de una notificación respeta M2-D04: no incluye costos para quien no tenga «ver costos».

## Eventos iniciales (módulo · operación → destinatarios)
- Solicitudes · creada → quienes atienden solicitudes de esa tienda.
- Solicitudes · atendida/rechazada → solicitante.
- Almacén · entrada inicial registrada por almacenero → administradores.
- Almacén · producto bajo o agotado → quienes ven existencias de esa ubicación.
- Pedidos · asignado → comprador.
- Pedidos · enviado a revisión → revisores del destino.
- Pedidos · devuelto / cumplido → comprador y quien lo armó.

## Permisos
Módulo «Notificaciones»: ver (las propias; no hay ver ajenas). No requiere permiso de crear: lo emite el sistema.

## Criterios de aceptación
- CA-01: DADO un hecho notificable, CUANDO ocurre, ENTONCES cada usuario con el permiso y alcance indicados recibe una notificación y quien lo provocó no.
- CA-02: DADO notificaciones sin leer, CUANDO el usuario abre una desde la campana, ENTONCES se marca leída y el contador baja.
- CA-03: DADO la sección de notificaciones, CUANDO filtra por módulo y operación, ENTONCES solo ve las coincidentes.
- CA-04: DADO el dashboard, ENTONCES muestra las solicitudes del día y las últimas diez notificaciones.
- CA-05: DADO un usuario sin «ver costos», ENTONCES ninguna de sus notificaciones muestra montos de costo.
