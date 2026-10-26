# Pruebas de base de datos (pgTAP)

**Atajo:** `pnpm test:db` ejecuta todos los archivos (o `pnpm test:db 005` uno solo) contra `DATABASE_URL` de `.env.local` y imprime solo el resumen; `pnpm db:apply supabase/migrations/<archivo>.sql` aplica una migración y la renombra a su versión. No hay que pegar SQL. La receta de abajo (MCP `execute_sql`) queda como respaldo.

Sin Docker ni Supabase CLI: las pruebas corren contra el proyecto cloud `argos` (`wqzeqrjzahtqufasrydb`) con `execute_sql` del MCP de Supabase. Todo va dentro de `begin ... rollback`, así que no queda ningún dato ni el esquema `tests`.

Versiones de migración = las que reporta el remoto (`list_migrations`): 20261025171215_core_schema, 20261025171423_core_schema_trigger_search_path, 20261025225316_core_schema_integrity, 20261025231302_rls_core, 20261025232102_companies_founder_immutable, 20261025232901_core_guards, 20261025233004_core_guards_actor_fix, 20261025233843_core_guards_lock_company_and_status_audit, 20261025234533_roles, 20261025235924_user_stores_sessions, 20261026000650_catalog, 20261026000921_catalog_product_delete (renombradas desde 140000/140100 locales).

## Hallazgos de `execute_sql`

- Acepta varias sentencias y devuelve solo las filas de la última sentencia con resultado.
- pgTAP no guarda los resultados por prueba, así que cada aserción se inserta en una tabla temporal `tap` y al final se agrega el texto TAP.
- Un error (p. ej. tabla inexistente) aborta y se devuelve como error: eso es el RED.

## Receta

Se compone una sola consulta:

```
begin;
<000_helpers.sql>
create temp table tap (n int generated always as identity, line text); grant all on tap to public;
<archivo .test.sql con las aserciones envueltas>
select string_agg(line, E'\n' order by n) as tap from tap;
rollback;
```

Las aserciones se envuelven con esta transformación mecánica sobre el archivo de prueba:

```sh
perl -pe 's/^select (plan|ok|is|matches|throws_ok|lives_ok)\(/insert into tap (line) select $1(/; s/^select \* from finish\(\);/insert into tap (line) select * from finish();/' supabase/tests/001_core_schema.test.sql
```

Pegar el resultado completo en `execute_sql`. Salida esperada: líneas `1..N` y `ok n - ...`; cualquier `not ok` o línea `# Looks like...` es un fallo. Las nuevas pruebas deben empezar cada aserción al inicio de línea con una de las funciones del `perl` (o ampliar la expresión).

## Comprobar que no queda nada

```sql
select (select count(*) from auth.users), (select count(*) from public.profiles),
       (select count(*) from pg_namespace where nspname = 'tests');
```
