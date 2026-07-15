# Despliegue de SIGA

## Demo estática

Publica la raíz del proyecto en Cloudflare Pages, Netlify o GitHub Pages. `js/config.js` mantiene `useBackend: false`, por lo que los datos permanecen en el navegador y solo sirven para demostración.

## Aplicación con backend

1. Crea una base SQL Server o Azure SQL y ejecuta `db/SIGA_BaseDatos.sql`.
2. Construye la imagen usando el `Dockerfile` de la raíz.
3. Configura estas variables de entorno en el proveedor:

   - `ConnectionStrings__SigaDb`: cadena de conexión completa a SQL Server.
   - `Jwt__Key`: clave aleatoria de al menos 32 caracteres.
   - `ASPNETCORE_ENVIRONMENT=Production`.

4. Expón el puerto `8080` y configura la comprobación de salud en `/health`.

El proyecto ASP.NET incorpora el frontend raíz al publicar y reemplaza `js/config.js` por la configuración de backend. No se deben publicar datos académicos reales hasta revisar privacidad, respaldos, monitoreo y políticas institucionales.
