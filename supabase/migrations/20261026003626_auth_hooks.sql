create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  p record;
  claims jsonb := event -> 'claims';
begin
  select kind, company_id, must_change_password into p
  from public.profiles
  where id = (event ->> 'user_id')::uuid and deleted_at is null;

  claims := claims || jsonb_build_object('must_change_password', coalesce(p.must_change_password, false));
  if found then
    claims := claims || jsonb_build_object('user_kind', p.kind::text);
    if p.company_id is not null then
      claims := claims || jsonb_build_object('company_id', p.company_id);
    end if;
  end if;
  return jsonb_set(event, '{claims}', claims);
end;
$$;

create function public.register_pin_failure(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  uname text := lower(trim(p_username));
  uid uuid;
  attempts int;
  is_locked boolean := false;
begin
  update public.profiles
  set failed_pin_attempts = failed_pin_attempts + 1
  where username = uname and kind = 'operator' and status = 'active' and deleted_at is null
  returning id, failed_pin_attempts into uid, attempts;

  if uid is null then
    return jsonb_build_object('locked', false, 'user_id', null);
  end if;

  insert into public.auth_events (user_id, username_attempted, event, channel)
  values (uid, uname, 'login_failed', 'system');

  if attempts >= 5 then
    update public.profiles set status = 'locked' where id = uid;
    insert into public.auth_events (user_id, username_attempted, event, channel)
    values (uid, uname, 'locked', 'system');
    is_locked := true;
  end if;
  return jsonb_build_object('locked', is_locked, 'user_id', uid);
end;
$$;

create function public.reset_pin_failures(p_user_id uuid)
returns void
language sql
security definer
set search_path = pg_catalog
as $$
  update public.profiles set failed_pin_attempts = 0 where id = p_user_id;
$$;

create function public.unlock_profile(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  update public.profiles set status = 'active', failed_pin_attempts = 0
  where id = p_user_id and status = 'locked';
  if found then
    insert into public.auth_events (user_id, event, channel) values (p_user_id, 'unlocked', 'system');
  end if;
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

revoke execute on function public.register_pin_failure(text), public.reset_pin_failures(uuid), public.unlock_profile(uuid) from public, anon, authenticated;
grant execute on function public.register_pin_failure(text), public.reset_pin_failures(uuid), public.unlock_profile(uuid) to service_role;
