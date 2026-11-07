revoke all on public.role_special_permissions from anon;
revoke truncate, references, trigger on public.role_special_permissions from authenticated;
