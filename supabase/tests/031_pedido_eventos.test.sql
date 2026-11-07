select plan(7);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'pe-ana@test.dev')),
  ('dan', tests.create_user('admin', 'pe-dan@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));
insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select ok(public.create_pedido('[{"product_id":"00000000-0000-0000-0000-0000000000e1","dest":"warehouse","qty":5,"unit":"Saco","content":100}]') is not null, 'admin creates an order');
select is((select kind from pedido_eventos), 'created', 'creating records a created event');
select is((select actor from pedido_eventos), (select v from ctx where k = 'ana'), 'the event stores the actor');
select lives_ok($$select public.assign_pedido_buyer((select order_id from pedido_eventos limit 1), (select v from ctx where k = 'ana'))$$, 'admin assigns a buyer');
select is((select array_agg(kind order by at, kind) from pedido_eventos), array['assigned', 'created'], 'assigning appends an assigned event');
select throws_ok($$insert into pedido_eventos (company_id, order_id, kind) values ('00000000-0000-0000-0000-0000000000a1', (select order_id from pedido_eventos limit 1), 'created')$$, '42501', null, 'authenticated cannot write events directly');
select tests.authenticate_as((select v from ctx where k = 'dan'));
select is((select count(*)::int from pedido_eventos), 0, 'other companies do not see the events');
select tests.clear_auth();

select * from finish();
