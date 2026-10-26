select plan(2);

select is((select string_agg(c.relname, ', ') from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity), null,
  'every public table has RLS enabled');

select is((select string_agg(c.relname, ', ') from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p') and c.relrowsecurity
    and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  ), null,
  'every public table with RLS has at least one policy');

select * from finish();
