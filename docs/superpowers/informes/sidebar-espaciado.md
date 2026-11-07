# Sidebar: espaciado y padding interno

Referencias: imagen 6 (objetivo) muestra selector arriba, rótulos con aire superior, filas altas con separación visible, pastilla activa con margen lateral respecto al panel e insignia «6» en círculo blanco. Imagen 7 (actual) muestra filas juntas, rótulos/iconos casi al borde y pastilla tocando ambos bordes.

Cambios (solo escritorio, >=1280 px; riel de tablet y barra móvil intactos):

| Valor | Antes | Después |
|---|---|---|
| Alto de fila (`--size-nav-item`, tokens.css) | 40px | 44px |
| Gap entre filas (`.side`) | --space-1-5 (6px) | --space-2 (8px) |
| Padding lateral del panel | --space-3-5 (14px) | --space-4 (16px) (+14px del item = sangría de icono/rótulo 30px) |
| Margen superior entre secciones | --space-3 (12px) | --space-5 (20px) |
| Espacio superior del rótulo | --space-1 | --space-2 |

Archivos: app/globals.css (bloque `@media (min-width: 1280px)` al final), docs/design/tokens.css. CompanySelector no se tocó: es hijo directo de `.side` y hereda el nuevo padding.

Verificación visual pendiente.
