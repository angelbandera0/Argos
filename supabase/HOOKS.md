# Pasos manuales en el panel de Supabase

## Custom Access Token Hook
1. Authentication > Hooks > Custom Access Token.
2. Tipo: Postgres function; esquema `public`, función `custom_access_token_hook`.
3. Guardar. Añade `user_kind`, `company_id` (operadores) y `must_change_password` al JWT.

## MFA (TOTP)
1. Authentication > Multi-Factor Authentication (MFA).
2. TOTP (App Authenticator): **Enabled** (no "Verify Enabled", que impide el enrolamiento). Máximo de factores: 10.
3. Dejar SMS MFA (requiere Pro) y "Limit duration of AAL1 sessions" desactivados; este último podría cortar sesiones de operadores sin MFA (por comprobar en la Tarea 16).

Verificado el 2026-10-26: el hook añade `user_kind`, `must_change_password` y `company_id`; el enrolamiento TOTP responde 200.

No existe Password Verification Hook (requiere Teams/Enterprise): el bloqueo del PIN lo hace `register_pin_failure`, llamada desde el servidor con `service_role`.
