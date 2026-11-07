select plan(20);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('dan', tests.create_user('admin', 'dan@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));
insert into ctx values ('op1', tests.create_user('operator', 'viewer@test.dev', '00000000-0000-0000-0000-0000000000a1'));
insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1');
insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Viewer');
insert into role_permissions (role_id, module, can_view) values ('00000000-0000-0000-0000-0000000000d1', 'currencies', true);
insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1');

insert into currencies (id, company_id, code, name, symbol) values
  ('00000000-0000-0000-0000-000000000c01', '00000000-0000-0000-0000-0000000000a1', 'MXN', 'Peso', '$');

select throws_ok($$insert into currencies (company_id, code, name, symbol) values ('00000000-0000-0000-0000-0000000000a1', 'MXN', 'Otro', '$')$$,
  '23505', null, 'D-03: a repeated code is rejected');
select throws_ok($$insert into currencies (company_id, code, name, symbol) values ('00000000-0000-0000-0000-0000000000a1', ' mxn ', 'Otro', '$')$$,
  '23505', null, 'a repeated code with another case is rejected');
select lives_ok($$insert into currencies (company_id, code, name, symbol) values ('00000000-0000-0000-0000-0000000000b2', 'MXN', 'Peso', '$')$$,
  'the same code is free in another company');
select throws_ok($$insert into currencies (company_id, code, name, symbol, decimals) values ('00000000-0000-0000-0000-0000000000a1', 'XXX', 'X', 'x', 5)$$,
  '23514', null, 'decimals are limited to 0-4');

insert into currency_denominations (id, company_id, currency_id, value, kind) values
  ('00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000c01', 100, 'bill');
select throws_ok($$insert into currency_denominations (company_id, currency_id, value, kind) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000c01', 100, 'coin')$$,
  '23505', null, 'CA-02: a repeated value is rejected');
select throws_ok($$insert into currency_denominations (company_id, currency_id, value, kind) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000c01', 0, 'coin')$$,
  '23514', null, 'the value must be positive');
select throws_ok($$insert into currency_denominations (company_id, currency_id, value, kind) values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000c01', 5, 'coin')$$,
  '23503', null, 'a denomination cannot point to a currency of another company');

insert into currencies (id, company_id, code, name, symbol, is_default) values
  ('00000000-0000-0000-0000-000000000c02', '00000000-0000-0000-0000-0000000000a1', 'USD', 'Dólar', '$', true);
update currencies set is_default = true where id = '00000000-0000-0000-0000-000000000c01';
select is((select count(*)::int from currencies where company_id = '00000000-0000-0000-0000-0000000000a1' and is_default), 1, 'D-03: only one default per company');
select is((select id from currencies where company_id = '00000000-0000-0000-0000-0000000000a1' and is_default), '00000000-0000-0000-0000-000000000c01'::uuid, 'marking a default unmarks the previous one');

select ok((select count(*) from audit_log where entity_type = 'currencies' and module = 'currencies' and action = 'create') >= 3, 'D-06: creating currencies is audited under the currencies module');
select ok((select count(*) from audit_log where entity_type = 'currency_denominations' and module = 'currencies') = 1, 'D-06: denominations are audited');

update currencies set active = false where id = '00000000-0000-0000-0000-000000000c02';
select is((select count(*)::int from audit_log where entity_id = '00000000-0000-0000-0000-000000000c02' and action = 'deactivate'), 1, 'deactivating is audited');

create or replace function app.currency_in_use(p_currency uuid) returns boolean language sql as $$ select p_currency = '00000000-0000-0000-0000-000000000c01' $$;
select throws_ok($$update currencies set deleted_at = now() where id = '00000000-0000-0000-0000-000000000c01'$$,
  'P0001', 'CURRENCY_IN_USE', 'D-04: a currency in use cannot be deleted');
select throws_ok($$update currency_denominations set deleted_at = now() where id = '00000000-0000-0000-0000-000000000d01'$$,
  'P0001', 'CURRENCY_IN_USE', 'D-04: a denomination of a currency in use cannot be deleted');
select lives_ok($$update currencies set active = false where id = '00000000-0000-0000-0000-000000000c01'$$, 'D-04: a currency in use can be deactivated');
select lives_ok($$update currencies set deleted_at = now() where id = '00000000-0000-0000-0000-000000000c02'$$, 'a currency not in use is soft-deleted');

select tests.authenticate_as((select v from ctx where k = 'dan'));
select is((select count(*)::int from currencies where company_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'an admin of another company sees no currencies');
select throws_ok($$insert into currencies (company_id, code, name, symbol) values ('00000000-0000-0000-0000-0000000000a1', 'EUR', 'Euro', '€')$$,
  '42501', null, 'an admin cannot write in another company');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select is((select count(*)::int from currencies), 1, 'an operator reads the live currencies of their company');
select throws_ok($$insert into currencies (company_id, code, name, symbol) values ('00000000-0000-0000-0000-0000000000a1', 'EUR', 'Euro', '€')$$,
  '42501', null, 'an operator cannot write currencies');

select tests.clear_auth();
select * from finish();
