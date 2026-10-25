# Modelo de Dominio

> Glosario y relaciones del negocio. Solo entra lo **confirmado**. Lo dudoso va a `OPEN_QUESTIONS.md`.

Estado: **Vacío** — pendiente de la primera información del negocio.

## Glosario

| Término | Definición | Estado |
|---|---|---|
| Empresa | _por definir_ | Pendiente |
| Entidad | _por definir — ¿persona jurídica? ¿unidad de negocio? ver Q-001_ | Pendiente |
| Local | _por definir_ | Pendiente |

## Jerarquía organizativa

```
Empresa
 └── Entidad (1..N)        ← por confirmar
      └── Local (1..N)     ← por confirmar
```

## Reglas de dominio

> Se irán numerando como `DR-001`, `DR-002`…

## Fuera del dominio

> Lo que explícitamente el sistema **no** gestiona.
