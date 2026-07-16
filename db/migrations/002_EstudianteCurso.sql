/* =====================================================================
   SIGA - Migracion 002: matricula N:M entre estudiantes y cursos
   Ejecutar antes del primer despliegue de esta version sobre Azure SQL.
   Es idempotente: si la tabla existe, solo completa relaciones faltantes.
   ===================================================================== */

SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.EstudianteCurso', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EstudianteCurso (
        idEstudianteCurso INT IDENTITY(1,1) PRIMARY KEY,
        idEstudiante      INT NOT NULL,
        idCurso           INT NOT NULL,
        fechaAsignacion   DATETIME2 NOT NULL
            CONSTRAINT DF_EstudianteCurso_fechaAsignacion DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_EstudianteCurso UNIQUE (idEstudiante, idCurso),
        CONSTRAINT FK_EstudianteCurso_Estudiante FOREIGN KEY (idEstudiante)
            REFERENCES dbo.Estudiante(idEstudiante) ON DELETE CASCADE,
        CONSTRAINT FK_EstudianteCurso_Curso FOREIGN KEY (idCurso)
            REFERENCES dbo.Curso(idCurso) ON DELETE CASCADE
    );
END;

INSERT INTO dbo.EstudianteCurso (idEstudiante, idCurso)
SELECT e.idEstudiante, e.idCurso
FROM dbo.Estudiante AS e
WHERE e.activo = 1
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.EstudianteCurso AS ec
      WHERE ec.idEstudiante = e.idEstudiante
        AND ec.idCurso = e.idCurso
  );

IF COL_LENGTH(N'dbo.Asistencia', N'idCurso') IS NULL
BEGIN
    ALTER TABLE dbo.Asistencia ADD idCurso INT NULL;
END;

-- SQL Server compila el lote antes de ejecutar el ALTER TABLE. El SQL
-- dinamico permite utilizar la columna aunque haya sido creada en este lote.
EXEC sys.sp_executesql N'
    UPDATE a
    SET a.idCurso = e.idCurso
    FROM dbo.Asistencia AS a
    INNER JOIN dbo.Estudiante AS e ON e.idEstudiante = a.idEstudiante
    WHERE a.idCurso IS NULL;
';

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE [name] = N'UQ_Asistencia_EstFecha')
BEGIN
    ALTER TABLE dbo.Asistencia DROP CONSTRAINT UQ_Asistencia_EstFecha;
END;

EXEC sys.sp_executesql N'
    ALTER TABLE dbo.Asistencia ALTER COLUMN idCurso INT NOT NULL;
';

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_Asistencia_Curso')
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.Asistencia ADD CONSTRAINT FK_Asistencia_Curso
            FOREIGN KEY (idCurso) REFERENCES dbo.Curso(idCurso);
    ';
END;

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [name] = N'UQ_Asistencia_EstCursoFecha')
BEGIN
    EXEC sys.sp_executesql N'
        ALTER TABLE dbo.Asistencia ADD CONSTRAINT UQ_Asistencia_EstCursoFecha
            UNIQUE (idEstudiante, idCurso, fecha);
    ';
END;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT COUNT(*) AS matriculasMigradas FROM dbo.EstudianteCurso;
