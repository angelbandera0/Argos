# Evaluación del proceso de desarrollo frente a una software factory

Estado: borrador de correo de estado y lista de trabajo para retomar. Fecha de la evaluación: 2026-10-29.

## Borrador del correo

**Asunto: Argos: evaluación del proceso de desarrollo frente a los estándares de una software factory**

Hola,

En el día de hoy estuve trabajando en evaluar el proceso con el que desarrollamos Argos, para comprobar si cumple lo que se espera de una *software factory*: una línea de producción estandarizada, automatizada, medible y repetible. Lo revisé contra el repositorio, no por impresión. No pude ver la configuración de Vercel ni los ajustes del repositorio remoto en GitHub, así que cualquier CI que exista fuera del código no aparece en este análisis.

**Conclusión**

Mi valoración es que el proceso es una línea de producción asistida por IA, bien montada pero a mitad de camino de una factory completa. Tiene buenos métodos de producción (proceso definido, reutilización y automatización local), pero le faltan los controles industriales: integración continua, entornos separados, revisión de cambios y métricas de entrega. Nota global aproximada: **2,6 sobre 5**.

**Resultado por dimensión (0 a 5)**

| Dimensión | Nota | Evidencia principal |
|---|---|---|
| Proceso definido y repetible | 4 | Plan de 36 tareas, comando `/tarea`, skill y agente de proyecto, regla de tamaño de tarea |
| Especificación y trazabilidad | 3 | 9 requisitos con criterios de aceptación, documentos de dominio y decisiones. Falta la matriz de trazabilidad |
| Reutilización | 4 | Librería de componentes Argos UI con galería, andamiaje y guía de patrones |
| Automatización local | 4 | `pnpm verify`, 62 archivos de prueba y 11 de base de datos |
| Automatización en servidor (CI/CD) | 1 | No hay pipeline ni hooks de commit |
| Entornos y despliegue | 1 | Un solo proyecto de base de datos para desarrollo, pruebas y datos reales |
| Calidad y puertas de control | 2 | Sin medición de cobertura ni pruebas end-to-end; revisión por tarea omitida |
| Gobierno y control de cambios | 1 | Un autor, 182 commits, sin ramas de revisión; la evidencia del proceso no está versionada |
| Seguridad | 2 | Buen diseño, pero la revisión de seguridad sigue pendiente y no hay análisis de dependencias |
| Métricas | 2 | Se mide el consumo de tokens, no el tiempo de entrega ni los defectos |
| Mejora continua | 4 | Cada error se convirtió en una regla escrita |

**Lo que funciona bien**

El proceso es repetible: cada tarea sigue el mismo flujo y se cierra con un informe corto. La reutilización es alta, y la mejora continua también: los errores se convierten en reglas y herramientas, y con ellas bajó el costo de las tareas de interfaz de unas 50 llamadas a unas 15.

**Dónde están las brechas, con evidencia que ya vivimos**

- **Entorno compartido:** las pruebas fallaron al aparecer datos reales creados desde la interfaz, y las pruebas de integración dejan filas de prueba que no se pueden borrar.
- **Sin puertas automáticas:** cuatro errores de interfaz los encontré a mano en el navegador, y el error de Vercel apareció directamente en producción.
- **Sin revisión independiente:** un solo autor, sin *pull requests*, y la revisión de seguridad diferida desde las primeras tareas.

**Plan que propongo, por orden de retorno**

1. CI en GitHub Actions que ejecute `pnpm verify` en cada push y pull request.
2. Separar entornos: base de datos de pruebas aparte, vistas previas distintas de producción y migraciones promovidas por el pipeline.
3. Flujo de ramas con revisión, protección de la rama principal y lista de verificación.
4. Ejecutar la revisión de seguridad pendiente y añadir análisis de dependencias y de secretos.
5. Prueba de humo automática en navegador que recoja solo errores de consola.
6. Matriz de trazabilidad automática de requisito a criterio y a prueba.
7. Versionar el ledger y los informes del proceso en el repositorio.
8. Métricas de entrega mínimas: tiempo por tarea, proporción de correcciones y defectos tras el cierre.

**Siguiente paso:** voy a preparar el plan detallado del CI y de los entornos, que son las dos dimensiones con peor nota y las que más riesgo reducen.

Un saludo,
[tu nombre]

## Trabajo para retomar

Orden de retorno propuesto. Marcar al completar.

- [ ] 1. CI en GitHub Actions con `pnpm verify` en cada push y pull request.
- [ ] 2. Entornos separados: Supabase de pruebas (proyecto o rama aparte), vistas previas de Vercel distintas de producción, migraciones promovidas por el pipeline.
- [ ] 3. Flujo de ramas con revisión: ramas por tarea, pull request con lista de verificación, protección de `main`, `/code-review` como puerta.
- [ ] 4. Revisión de seguridad diferida (bloques Base de datos, Auth y Adaptadores; ver `docs/superpowers/revisiones-pendientes.md`), análisis de dependencias y de secretos en el CI.
- [ ] 5. Prueba de humo en navegador (Playwright) que recoja solo errores y avisos de consola de `/ui` y las rutas públicas.
- [ ] 6. Matriz de trazabilidad automática requisito → criterio → prueba (Tarea 36 del plan).
- [ ] 7. Versionar `.superpowers/` (ledger e informes) o moverlo a `docs/`.
- [ ] 8. Métricas de entrega mínimas: tiempo por tarea, proporción de correcciones sobre tareas nuevas, defectos hallados tras el cierre.

## Limitaciones de la evaluación

- Las notas son una valoración, no una medición normada (CMMI, DORA u otro).
- "Sin CI" vale solo para lo que está en el repositorio: no se vio la configuración de Vercel ni de GitHub.
- Las comparaciones de consumo entre tareas son entre tareas parecidas, no un experimento controlado.
