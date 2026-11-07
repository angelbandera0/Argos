select plan(26);

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

insert into ctx values
  ('op1', tests.create_user('operator', 'op1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'op2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op3', tests.create_user('operator', 'op3@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op4', tests.create_user('operator', 'op4@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Atiende'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Almacen'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'Borrado'),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'ana'), 'Excluido');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'orders', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'handle_requests', false),
  ('00000000-0000-0000-0000-0000000000d2', 'handle_requests', true),
  ('00000000-0000-0000-0000-0000000000d3', 'handle_requests', true),
  ('00000000-0000-0000-0000-0000000000d4', 'handle_requests', true);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3'),
  ((select v from ctx where k = 'op4'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d4');
update roles set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000d3';
insert into role_company_exclusions (role_id, company_id) values
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000a1');

select is(app.notify('00000000-0000-0000-0000-0000000000a1', 'requests', 'created', 'info', 't1', 'b', '/requests',
  '00000000-0000-0000-0000-0000000000f1', 'handle_requests'), 2, 'admin and the operator with the permission in the store are notified');
select is((select count(*)::int from notifications where title = 't1' and recipient_id in
  ((select v from ctx where k = 'op2'), (select v from ctx where k = 'op3'), (select v from ctx where k = 'op4'), (select v from ctx where k = 'dan'))),
  0, 'other store, deleted role, excluded company and other company admins are not notified');

select set_config('request.jwt.claim.sub', (select v::text from ctx where k = 'op1'), true);
select is(app.notify('00000000-0000-0000-0000-0000000000a1', 'requests', 'created', 'info', 't2', 'b', null,
  '00000000-0000-0000-0000-0000000000f1', 'handle_requests'), 1, 'only the admin is notified when the actor is the operator');
select is((select count(*)::int from notifications where title = 't2' and recipient_id = (select v from ctx where k = 'op1')),
  0, 'the actor is not notified of their own action');
select tests.clear_auth();

select is(app.notify('00000000-0000-0000-0000-0000000000a1', 'stock', 'low_stock', 'warning', 't3', 'b', null,
  '00000000-0000-0000-0000-0000000000f1', 'handle_requests', null, true), 3, 'the warehouse flag adds warehouse operators');
select is(app.notify('00000000-0000-0000-0000-0000000000a1', 'orders', 'assigned', 'info', 't4', 'b', null,
  '00000000-0000-0000-0000-0000000000f1', null, 'orders.view', false, false), 1, 'a module permission notifies its holders in the store');
select is(app.notify('00000000-0000-0000-0000-0000000000a1', 'orders', 'assigned', 'info', 't5', 'b', null,
  '00000000-0000-0000-0000-0000000000f1', 'handle_requests', 'orders.view', false, false), 1, 'a recipient matching both rules gets one row');
select is(app.notify('00000000-0000-0000-0000-0000000000a1', 'stock', 'initial_entry', 'info', 't6', 'b', null,
  null, 'handle_requests', null, false, false), 1, 'without a store only warehouse holders are notified');

select throws_ok($$select app.notify('00000000-0000-0000-0000-0000000000a1', 'bogus', 'x', 'info', 't', 'b', null)$$, '22023', null, 'invalid module');
select throws_ok($$select app.notify('00000000-0000-0000-0000-0000000000a1', 'stock', 'x', 'high', 't', 'b', null)$$, '22023', null, 'invalid priority');
select throws_ok($$select app.notify('00000000-0000-0000-0000-0000000000a1', 'stock', 'x', 'info', '', 'b', null)$$, '22023', null, 'empty title');
select throws_ok($$select app.notify('00000000-0000-0000-0000-0000000000a1', 'stock', 'x', 'info', repeat('x', 201), 'b', null)$$, '22023', null, 'title too long');

select tests.authenticate_as((select v from ctx where k = 'op1'));
select throws_ok($$select app.notify('00000000-0000-0000-0000-0000000000a1', 'stock', 'x', 'info', 't', 'b', null)$$, '42501', null, 'authenticated cannot call app.notify');
select is((select count(*)::int from notifications), 4, 'a user reads only their own notifications');
select is((select count(*)::int from notifications where recipient_id = (select v from ctx where k = 'ana')), 0, 'no access to other recipients');
select throws_ok($$insert into notifications (company_id, recipient_id, module, operation, priority, title, body)
  values ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'op1'), 'stock', 'x', 'info', 'z', '')$$, '42501', null, 'no direct insert');
select throws_ok($$delete from notifications$$, '42501', null, 'no direct delete');
select throws_ok($$update notifications set title = 'y'$$, '42501', null, 'only read_at is updatable');
select lives_ok($$update notifications set read_at = now() where title = 't1'$$, 'read_at is updatable on own notifications');
select is(public.unread_notifications_count(), 3, 'unread count');
select is(public.mark_notifications_read(array[(select id from notifications where title = 't3')]), 1, 'partial mark');
select is(public.unread_notifications_count(), 2, 'unread count after partial mark');
select is(public.mark_notifications_read(), 2, 'mark all');
select is(public.unread_notifications_count(), 0, 'nothing unread');

select tests.clear_auth();
select is((select count(*)::int from notifications where recipient_id = (select v from ctx where k = 'ana') and read_at is null), 3,
  'marking does not touch other recipients');
set local role anon;
select throws_ok($$select count(*) from notifications$$, '42501', null, 'anon has no access');
select tests.clear_auth();
select * from finish();
