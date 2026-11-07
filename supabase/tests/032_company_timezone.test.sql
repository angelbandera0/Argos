select plan(4);

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000c1', 'Tz', 'tz01', tests.create_user('admin', 'tz-ana@test.dev'));

select is((select timezone from companies where id = '00000000-0000-0000-0000-0000000000c1'), 'UTC', 'default UTC');
update companies set timezone = 'America/Bogota' where id = '00000000-0000-0000-0000-0000000000c1';
select is((select timezone from companies where id = '00000000-0000-0000-0000-0000000000c1'), 'America/Bogota', 'valid IANA zone accepted');
select throws_ok($$update companies set timezone = 'Mars/Base' where id = '00000000-0000-0000-0000-0000000000c1'$$, '22023', null, 'invalid zone rejected');
select throws_ok($$update companies set timezone = '' where id = '00000000-0000-0000-0000-0000000000c1'$$, '22023', null, 'empty zone rejected');

select * from finish();
