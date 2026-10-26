select plan(22);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));

insert into ctx values
  ('op1', tests.create_user('operator', 'caja1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'caja2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op3', tests.create_user('operator', 'caja3@test.dev', '00000000-0000-0000-0000-0000000000a1'));

update profiles set must_change_password = true where id = (select v from ctx where k = 'op1');
update profiles set status = 'locked', failed_pin_attempts = 5 where id = (select v from ctx where k = 'op2');
update profiles set status = 'deactivated' where id = (select v from ctx where k = 'op3');

select is((select register_pin_failure('k7m2.caja1') ->> 'locked'), 'false', '1st failure does not lock');
select is((select register_pin_failure('k7m2.caja1') ->> 'locked'), 'false', '2nd failure does not lock');
select is((select register_pin_failure('K7M2.Caja1 ') ->> 'locked'), 'false', '3rd failure does not lock (username normalized)');
select is((select register_pin_failure('k7m2.caja1') ->> 'locked'), 'false', '4th failure does not lock');
select is((select failed_pin_attempts from profiles where id = (select v from ctx where k = 'op1')), 4, 'counter is 4 before the lock');
select is((select register_pin_failure('k7m2.caja1') ->> 'locked'), 'true', '5th failure locks');
select ok((select status = 'locked' and failed_pin_attempts = 5 from profiles where id = (select v from ctx where k = 'op1')), 'profile is locked with counter 5');
select is((select count(*)::int from auth_events where user_id = (select v from ctx where k = 'op1') and event = 'login_failed' and username_attempted = 'k7m2.caja1'), 5, 'each failure leaves a login_failed event');
select is((select count(*)::int from auth_events where user_id = (select v from ctx where k = 'op1') and event = 'locked' and username_attempted = 'k7m2.caja1'), 1, 'the lock leaves a locked event');

select reset_pin_failures((select v from ctx where k = 'op1'));
select ok((select status = 'locked' and failed_pin_attempts = 0 from profiles where id = (select v from ctx where k = 'op1')), 'reset zeroes the counter and keeps the locked status');

select is((select register_pin_failure('k7m2.caja2')), '{"locked": false, "user_id": null}'::jsonb, 'locked profile: no-op, same response');
select is((select failed_pin_attempts from profiles where id = (select v from ctx where k = 'op2')), 5, 'locked profile counter unchanged');
select is((select register_pin_failure('k7m2.caja3')), '{"locked": false, "user_id": null}'::jsonb, 'deactivated profile: no-op');
select is((select register_pin_failure('ana')), '{"locked": false, "user_id": null}'::jsonb, 'admin / nonexistent username: no-op');

select unlock_profile((select v from ctx where k = 'op1'));
select ok((select status = 'active' and failed_pin_attempts = 0 from profiles where id = (select v from ctx where k = 'op1')), 'unlock leaves active with counter 0');
select is((select count(*)::int from auth_events where user_id = (select v from ctx where k = 'op1') and event = 'unlocked'), 1, 'unlock leaves an unlocked event');

select ok(not has_function_privilege('anon', 'public.register_pin_failure(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.register_pin_failure(text)', 'execute')
  and not has_function_privilege('authenticated', 'public.reset_pin_failures(uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.unlock_profile(uuid)', 'execute')
  and has_function_privilege('service_role', 'public.unlock_profile(uuid)', 'execute'), 'only service_role executes the lockout functions');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1');
select throws_ok($$select register_pin_failure('k7m2.caja1')$$, '42501', null, 'authenticated cannot call register_pin_failure');
select throws_ok($$select unlock_profile(gen_random_uuid())$$, '42501', null, 'authenticated cannot call unlock_profile');
select tests.clear_auth();

select is(
  (select custom_access_token_hook(jsonb_build_object('user_id', (select v from ctx where k = 'op1'), 'claims', '{"aal": "aal1"}'::jsonb)) -> 'claims'),
  jsonb_build_object('aal', 'aal1', 'user_kind', 'operator', 'must_change_password', true, 'company_id', '00000000-0000-0000-0000-0000000000a1'),
  'hook adds user_kind, company_id and must_change_password for operators, no active store');
select is(
  (select custom_access_token_hook(jsonb_build_object('user_id', (select v from ctx where k = 'ana'), 'claims', '{}'::jsonb)) -> 'claims'),
  '{"user_kind": "admin", "must_change_password": false}'::jsonb,
  'hook adds user_kind and always must_change_password for admins, no company_id');

select ok((select count(*) from auth_events where created_at >= transaction_timestamp() and username_attempted ~* '^[0-9]{6}$') = 0, 'Review Focus 2: no PIN stored in auth_events');

select * from finish();
