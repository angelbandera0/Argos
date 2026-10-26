# Pasos manuales en el panel de Supabase

## Custom Access Token Hook
1. Authentication > Hooks > Custom Access Token.
2. Tipo: Postgres function; esquema `public`, función `custom_access_token_hook`.
3. Guardar. Añade `user_kind`, `company_id` (operadores) y `must_change_password` al JWT.

## MFA (TOTP)
1. Authentication > Sign In / Providers > Multi-Factor Authentication.
2. Activar TOTP (enroll y verify).

No existe Password Verification Hook (requiere Teams/Enterprise): el bloqueo del PIN lo hace `register_pin_failure`, llamada desde el servidor con `service_role`.
