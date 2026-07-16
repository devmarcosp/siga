/* Verificacion posterior a 002_EstudianteCurso.sql */

IF OBJECT_ID(N'dbo.EstudianteCurso', N'U') IS NULL
    THROW 51000, 'Falta ejecutar 002_EstudianteCurso.sql.', 1;

SELECT
    (SELECT COUNT(*) FROM dbo.Curso WHERE activo = 1) AS cursosActivos,
    (SELECT COUNT(*) FROM dbo.Estudiante WHERE activo = 1) AS estudiantesActivos,
    (SELECT COUNT(*) FROM dbo.EstudianteCurso) AS matriculas,
    (SELECT COUNT(*) FROM dbo.Apoderado WHERE activo = 1) AS apoderadosActivos;

SELECT e.idEstudiante, e.rut, e.nombre
FROM dbo.Estudiante AS e
WHERE e.activo = 1
  AND NOT EXISTS (
      SELECT 1 FROM dbo.EstudianteCurso AS ec
      WHERE ec.idEstudiante = e.idEstudiante
  );

SELECT ec.idEstudiante, ec.idCurso, COUNT(*) AS duplicados
FROM dbo.EstudianteCurso AS ec
GROUP BY ec.idEstudiante, ec.idCurso
HAVING COUNT(*) > 1;

SELECT a.idAsistencia, a.idEstudiante, a.idCurso, a.fecha
FROM dbo.Asistencia AS a
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.EstudianteCurso AS ec
    WHERE ec.idEstudiante = a.idEstudiante
      AND ec.idCurso = a.idCurso
);

SELECT a.idApoderado, a.nombre, COUNT(e.idEstudiante) AS pupilosAsignados
FROM dbo.Apoderado AS a
LEFT JOIN dbo.Estudiante AS e
    ON e.idApoderado = a.idApoderado AND e.activo = 1
WHERE a.activo = 1
GROUP BY a.idApoderado, a.nombre
ORDER BY a.nombre;

-- La siguiente consulta es solo de diagnostico. Debe devolver cero filas.
-- Detecta datos de demostracion que pudieron repetirse si se ejecuto por
-- accidente el script completo de inicializacion sobre una base existente.
SELECT 'CALIFICACION' AS tipoRegistro,
       CONCAT(idEstudiante, '|', idCurso, '|', tipoEvaluacion, '|', nota, '|', fechaRegistro) AS clave,
       COUNT(*) AS repeticiones
FROM dbo.Calificacion
GROUP BY idEstudiante, idCurso, tipoEvaluacion, nota, fechaRegistro
HAVING COUNT(*) > 1
UNION ALL
SELECT 'ANOTACION',
       CONCAT(idEstudiante, '|', idDocente, '|', ISNULL(idCurso, 0), '|', tipo, '|', observacion),
       COUNT(*)
FROM dbo.Anotacion
GROUP BY idEstudiante, idDocente, idCurso, tipo, observacion
HAVING COUNT(*) > 1
UNION ALL
SELECT 'MATERIAL',
       CONCAT(idCurso, '|', ISNULL(idDocente, 0), '|', titulo, '|', tipoArchivo, '|', rutaArchivo),
       COUNT(*)
FROM dbo.Material
GROUP BY idCurso, idDocente, titulo, tipoArchivo, rutaArchivo
HAVING COUNT(*) > 1
UNION ALL
SELECT 'ALERTA',
       CONCAT(idEstudiante, '|', tipoRiesgo, '|', semaforoEstado, '|', fecha),
       COUNT(*)
FROM dbo.Alerta
GROUP BY idEstudiante, tipoRiesgo, semaforoEstado, fecha
HAVING COUNT(*) > 1;
