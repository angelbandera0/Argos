# REQ-005 — Organización: compañías, sedes y tiendas

- **Módulo:** Organización
- **Estado:** En revisión
- **Prioridad:** Imprescindible
- **Actor(es):** Administrador, Superadmin

## Resultado esperado
Un administrador estructura su negocio en compañías, sedes y tiendas, controla quién más gestiona cada compañía y puede dejar fuera de uso lo que ya no opera sin perder ningún dato.

## Criterios de aceptación

- CA-01: DADO un administrador sin compañías, CUANDO crea una compañía, ENTONCES queda registrado como su fundador, la compañía aparece solo para los administradores con acceso a ella y el sistema le asigna un código corto único e inmutable de 4 caracteres.
- CA-02: DADO una compañía, CUANDO un administrador con acceso crea una sede y dentro de ella una tienda, ENTONCES la jerarquía compañía → sede → tienda queda establecida.
- CA-03: DADO una compañía, CUANDO cualquiera de sus administradores o el superadmin da acceso a otro administrador, ENTONCES este puede gestionarla.
- CA-04: DADO un administrador que no es el fundador, CUANDO intenta quitar el acceso a otro administrador, ENTONCES se rechaza. Solo el fundador o el superadmin pueden hacerlo.
- CA-05: DADO el fundador de una compañía, CUANDO él mismo o el superadmin intenta quitarle el acceso, ENTONCES se rechaza.
- CA-06: DADO una compañía, sede o tienda con datos asociados, CUANDO alguien intenta eliminarla, ENTONCES se rechaza y solo se permite desactivarla.
- CA-07: DADO una compañía, sede o tienda, CUANDO un usuario que no es el fundador ni el superadmin intenta desactivarla, ENTONCES se rechaza.
- CA-08: DADO el fundador o el superadmin, CUANDO desactiva una compañía, sede o tienda, ENTONCES debe indicar un motivo; sin motivo no se desactiva. Los motivos predefinidos son: cierre definitivo, cierre temporal, reestructuración, remodelación, creada por error, fin de contrato o acuerdo, y otro (texto obligatorio).
- CA-09: DADO una tienda desactivada, CUANDO un usuario asignado a ella inicia sesión, ENTONCES no puede entrar a esa tienda y sigue pudiendo entrar a sus otras tiendas.
- CA-10: DADO los ajustes de una compañía, CUANDO un administrador cambia el tope de sesión, ENTONCES el cambio se aplica y queda en el historial. Un usuario que no es administrador no puede cambiarlo.
- CA-11: DADO un administrador ajeno a una compañía, CUANDO intenta ver o modificar sus sedes y tiendas, ENTONCES no puede.
- CA-12: DADO una compañía, sede o tienda desactivada, CUANDO el fundador o el superadmin la reactiva indicando un motivo libre, ENTONCES vuelve a operar y la reactivación queda en el historial. Otro usuario no puede reactivarla.
- CA-13: DADO una compañía o sede desactivada, CUANDO un usuario intenta entrar a una tienda que cuelga de ella, ENTONCES no puede, aunque la tienda esté activa; y CUANDO se reactiva la compañía o sede, ENTONCES las tiendas que estaban activas vuelven a operar y las que estaban desactivadas siguen desactivadas.
- CA-14: DADO una compañía, sede o tienda sin datos asociados (sin usuarios, productos, categorías ni operaciones posteriores a su creación), CUANDO el fundador o el superadmin la elimina, ENTONCES se aplica borrado lógico.
- CA-15 [decisión del usuario]: DADO una compañía, sede o tienda, CUANDO un administrador con acceso (o el superadmin) cambia su nombre, ENTONCES el cambio se aplica y queda en el historial con el nombre anterior y el nuevo. El nombre no puede quedar vacío ni repetirse entre hermanas (compañías del mismo administrador, sedes de una compañía, tiendas de una sede, sin distinguir mayúsculas). El código de la compañía no cambia.

## Restricciones
P-01, P-02, P-03, T-03, T-04. Reglas DR-001, DR-003 a DR-007, DR-012, DR-014, DR-015.

## Fuera de alcance
- Datos operativos de las tiendas (inventario, ventas, turnos).
- Copiar o mover sedes y tiendas entre compañías.

## Exposición
- **API REST:** por definir en el diseño.
- **MCP:** no se expone (ADR-012). Justificación: es gestión de acceso y estructura, de alto riesgo.

## Dependencias y preguntas abiertas
REQ-006, REQ-009.

## Notas para el manual
Se completa al implementar (D-04).
