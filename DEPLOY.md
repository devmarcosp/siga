# Despliegue de SIGA

## Desarrollo local

Esta versión utiliza siempre ASP.NET y SQL como fuente de datos. No abras `index.html` con Live Server, porque las operaciones administrativas necesitan la API.

```bash
cd db/SigaApi-Backend/SigaApi-Backend
dotnet run
```

Abre la URL indicada por ASP.NET en la terminal.

## Aplicación con backend

1. Crea una base SQL Server o Azure SQL y ejecuta `db/SIGA_BaseDatos.sql`.
2. Construye la imagen usando el `Dockerfile` de la raíz.
3. Configura estas variables de entorno en el proveedor:

   - `ConnectionStrings__SigaDb`: cadena de conexión completa a SQL Server.
   - `Jwt__Key`: clave aleatoria de al menos 32 caracteres.
   - `ASPNETCORE_ENVIRONMENT=Production`.

4. Expón el puerto `8080` y configura la comprobación de salud en `/health`.

El proyecto ASP.NET incorpora el frontend raíz al publicar y reemplaza `js/config.js` por la configuración de backend. No se deben publicar datos académicos reales hasta revisar privacidad, respaldos, monitoreo y políticas institucionales.

## Actualizar una base existente

Antes de desplegar esta versión sobre la base actual, ejecuta en Azure SQL:

```text
db/migrations/002_EstudianteCurso.sql
```

La migración crea la matrícula N:M, copia automáticamente el curso principal actual de cada alumno y separa la asistencia por alumno, curso y fecha. Es idempotente: puede volver a ejecutarse sin duplicar registros.

Comprueba el resultado con:

```text
db/migrations/VERIFY_002.sql
```

Las consultas de estudiantes sin matrícula, relaciones duplicadas y asistencias sin una matrícula coincidente deben devolver cero filas. Como comprobación resumida también puedes ejecutar:

```sql
SELECT c.asignatura, c.nivel, c.paralelo, COUNT(ec.idEstudiante) AS alumnos
FROM Curso c
LEFT JOIN EstudianteCurso ec ON ec.idCurso = c.idCurso
WHERE c.activo = 1
GROUP BY c.idCurso, c.asignatura, c.nivel, c.paralelo
ORDER BY c.nivel, c.paralelo, c.asignatura;
```
