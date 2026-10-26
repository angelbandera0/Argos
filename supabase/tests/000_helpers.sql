create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.create_user(kind text, email text, company uuid default null)
returns uuid
language plpgsql
as $$
declare
  uid uuid := gen_random_uuid();
  local_part text := lower(split_part(email, '@', 1));
  uname text;
begin
  -- Borra el superadmin real para no chocar con profiles_single_superadmin; solo es válido porque las pruebas siempre corren en begin/rollback.
  if kind = 'superadmin' then
    delete from auth.users where id in (select p.id from public.profiles p where p.kind = 'superadmin' and p.created_at < now());
  end if;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email, '', now(), '{}', '{}', now(), now());

  if kind = 'operator' then
    uname := (select c.code from public.companies c where c.id = company) || '.' || local_part;
  end if;

  insert into public.profiles (id, kind, username, display_name, company_id)
  values (uid, kind::public.profile_kind, uname, local_part, case when kind = 'operator' then company end);

  return uid;
end;
$$;

create or replace function tests.authenticate_as(user_id uuid, aal text default 'aal2', session_id uuid default gen_random_uuid())
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', user_id, 'role', 'authenticated', 'aal', aal, 'session_id', session_id)::text, true);
  set local role authenticated;
end;
$$;

create or replace function tests.clear_auth()
returns void
language plpgsql
as $$
begin
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;
