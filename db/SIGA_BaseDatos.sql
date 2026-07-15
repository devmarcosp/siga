/* =====================================================================
   SIGA - Sistema Integrado de Gestion Academica
   Script de inicializacion de esquema - SQL Server / Azure SQL
   Ejecutar conectado directamente a la base de datos SIGA.
   Normalizado a 3FN. Sin tabla "Usuario" generica: cada rol guarda
   sus propias credenciales (correo + hash de contrasena).
   ===================================================================== */

/* =====================================================================
   1. ROLES CON LOGIN PROPIO (sin tabla puente "Usuario")
   ===================================================================== */

CREATE TABLE Administrador (
    idAdministrador INT IDENTITY(1,1) PRIMARY KEY,
    rut             VARCHAR(12)     NOT NULL,
    nombre          NVARCHAR(150)   NOT NULL,
    correo          NVARCHAR(150)   NOT NULL,   -- identificador de login
    contrasenaHash  VARCHAR(100)    NOT NULL,  -- hash bcrypt generado por la aplicacion
    activo          BIT             NOT NULL DEFAULT 1,
    fechaCreacion   DATETIME2       NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_Administrador_rut UNIQUE (rut),
    CONSTRAINT UQ_Administrador_correo UNIQUE (correo)
);
GO

CREATE TABLE Docente (
    idDocente       INT IDENTITY(1,1) PRIMARY KEY,
    rut             VARCHAR(12)     NOT NULL,
    nombre          NVARCHAR(150)   NOT NULL,
    correo          NVARCHAR(150)   NOT NULL,
    contrasenaHash  VARCHAR(100)    NOT NULL,
    especialidad    NVARCHAR(100)   NULL,       -- ej. Matematicas, Historia
    activo          BIT             NOT NULL DEFAULT 1,
    fechaCreacion   DATETIME2       NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_Docente_rut UNIQUE (rut),
    CONSTRAINT UQ_Docente_correo UNIQUE (correo)
);
GO

CREATE TABLE Apoderado (
    idApoderado     INT IDENTITY(1,1) PRIMARY KEY,
    rut             VARCHAR(12)     NOT NULL,
    nombre          NVARCHAR(150)   NOT NULL,
    correo          NVARCHAR(150)   NOT NULL,
    contrasenaHash  VARCHAR(100)    NOT NULL,
    telefono        VARCHAR(20)     NULL,
    activo          BIT             NOT NULL DEFAULT 1,
    fechaCreacion   DATETIME2       NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_Apoderado_rut UNIQUE (rut),
    CONSTRAINT UQ_Apoderado_correo UNIQUE (correo)
);
GO

CREATE TABLE SolicitudRegistro (
    idSolicitudRegistro INT IDENTITY(1,1) PRIMARY KEY,
    rut VARCHAR(12) NOT NULL,
    nombre NVARCHAR(150) NOT NULL,
    correo NVARCHAR(150) NOT NULL,
    contrasenaHash VARCHAR(100) NOT NULL,
    rol VARCHAR(12) NOT NULL,
    estado VARCHAR(12) NOT NULL DEFAULT 'PENDIENTE',
    fechaSolicitud DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fechaRevision DATETIME2 NULL,
    idAdministradorRevisor INT NULL,
    CONSTRAINT CK_SolicitudRegistro_rol CHECK (rol IN ('DOCENTE','APODERADO')),
    CONSTRAINT CK_SolicitudRegistro_estado CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
    CONSTRAINT FK_SolicitudRegistro_Admin FOREIGN KEY (idAdministradorRevisor)
        REFERENCES Administrador(idAdministrador)
);
GO

/* =====================================================================
   2. CURSOS Y RELACION CON DOCENTES
   ===================================================================== */

CREATE TABLE Curso (
    idCurso         INT IDENTITY(1,1) PRIMARY KEY,
    nivel           NVARCHAR(30)    NOT NULL,   -- '8vo Basico', '1ro Medio'
    paralelo        CHAR(1)         NOT NULL,   -- 'A', 'B'
    asignatura      NVARCHAR(60)    NOT NULL,   -- 'Matematicas', 'Historia'
    anioEscolar     SMALLINT        NOT NULL,
    idDocenteJefe   INT             NULL,                 -- profesor jefe / guia del curso
    activo          BIT             NOT NULL DEFAULT 1,
    CONSTRAINT UQ_Curso UNIQUE (nivel, paralelo, asignatura, anioEscolar),
    CONSTRAINT FK_Curso_DocenteJefe FOREIGN KEY (idDocenteJefe)
        REFERENCES Docente(idDocente) ON DELETE SET NULL
);
GO

-- Tabla puente N:M -> un docente puede dictar varios cursos,
-- y un curso puede tener mas de un docente (ej. reemplazo, co-docencia).
CREATE TABLE DocenteCurso (
    idDocenteCurso  INT IDENTITY(1,1) PRIMARY KEY,
    idDocente       INT NOT NULL,
    idCurso         INT NOT NULL,
    CONSTRAINT UQ_DocenteCurso UNIQUE (idDocente, idCurso),
    CONSTRAINT FK_DocenteCurso_Docente FOREIGN KEY (idDocente)
        REFERENCES Docente(idDocente) ON DELETE CASCADE,
    CONSTRAINT FK_DocenteCurso_Curso FOREIGN KEY (idCurso)
        REFERENCES Curso(idCurso) ON DELETE CASCADE
);
GO

/* =====================================================================
   3. ESTUDIANTES (sin login propio, segun el mock actual)
   ===================================================================== */

CREATE TABLE Estudiante (
    idEstudiante    INT IDENTITY(1,1) PRIMARY KEY,
    rut             VARCHAR(12)   NOT NULL,
    nombre          NVARCHAR(150) NOT NULL,
    correo          NVARCHAR(150) NULL,
    idCurso         INT NOT NULL,
    idApoderado     INT NULL,
    activo          BIT NOT NULL DEFAULT 1,
    fechaCreacion   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_Estudiante_rut UNIQUE (rut),
    CONSTRAINT FK_Estudiante_Curso FOREIGN KEY (idCurso)
        REFERENCES Curso(idCurso),
    CONSTRAINT FK_Estudiante_Apoderado FOREIGN KEY (idApoderado)
        REFERENCES Apoderado(idApoderado) ON DELETE SET NULL
);
GO

/* =====================================================================
   4. ASISTENCIA
   ===================================================================== */

CREATE TABLE Asistencia (
    idAsistencia    INT IDENTITY(1,1) PRIMARY KEY,
    idEstudiante    INT             NOT NULL,
    fecha           DATE            NOT NULL,
    estado          VARCHAR(12)     NOT NULL,
    observacion     NVARCHAR(300)   NULL,
    CONSTRAINT UQ_Asistencia_EstFecha UNIQUE (idEstudiante, fecha),
    CONSTRAINT CK_Asistencia_Estado CHECK (estado IN ('PRESENTE','AUSENTE','TARDANZA','JUSTIFICADO')),
    CONSTRAINT FK_Asistencia_Estudiante FOREIGN KEY (idEstudiante)
        REFERENCES Estudiante(idEstudiante) ON DELETE CASCADE
);
GO

/* =====================================================================
   5. CALIFICACIONES
   ===================================================================== */

CREATE TABLE Calificacion (
    idCalificacion  INT IDENTITY(1,1) PRIMARY KEY,
    idEstudiante    INT             NOT NULL,
    idCurso         INT             NOT NULL,
    tipoEvaluacion  NVARCHAR(60)    NOT NULL,     -- 'Prueba 1', 'Trabajo Grupal'
    descripcion     NVARCHAR(200)   NULL,
    nota            DECIMAL(3,1)    NOT NULL,
    ponderacion     DECIMAL(5,2)    NOT NULL,
    fechaRegistro   DATE            NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
    fechaNota       DATE            NULL,
    CONSTRAINT CK_Calificacion_Nota CHECK (nota BETWEEN 1.0 AND 7.0),
    CONSTRAINT CK_Calificacion_Ponderacion CHECK (ponderacion BETWEEN 0 AND 100),
    CONSTRAINT FK_Calificacion_Estudiante FOREIGN KEY (idEstudiante)
        REFERENCES Estudiante(idEstudiante) ON DELETE CASCADE,
    CONSTRAINT FK_Calificacion_Curso FOREIGN KEY (idCurso)
        REFERENCES Curso(idCurso)
);
GO

/* =====================================================================
   6. ANOTACIONES (observaciones positivas/negativas)
   ===================================================================== */

CREATE TABLE Anotacion (
    idAnotacion     INT IDENTITY(1,1) PRIMARY KEY,
    idEstudiante    INT             NOT NULL,
    idDocente       INT             NOT NULL,              -- quien la redacta
    idCurso         INT             NULL,
    tipo            VARCHAR(10)     NOT NULL,
    observacion     NVARCHAR(500)   NOT NULL,
    fechaRegistro   DATETIME2       NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT CK_Anotacion_Tipo CHECK (tipo IN ('POSITIVA','NEGATIVA','NEUTRA')),
    CONSTRAINT FK_Anotacion_Estudiante FOREIGN KEY (idEstudiante)
        REFERENCES Estudiante(idEstudiante) ON DELETE CASCADE,
    CONSTRAINT FK_Anotacion_Docente FOREIGN KEY (idDocente)
        REFERENCES Docente(idDocente),
    CONSTRAINT FK_Anotacion_Curso FOREIGN KEY (idCurso)
        REFERENCES Curso(idCurso) ON DELETE SET NULL
);
GO

/* =====================================================================
   7. MATERIALES DE APOYO
   ===================================================================== */

CREATE TABLE Material (
    idMaterial      INT IDENTITY(1,1) PRIMARY KEY,
    idCurso         INT             NOT NULL,
    idDocente       INT             NULL,                  -- quien lo subio
    titulo          NVARCHAR(200)   NOT NULL,
    tipoArchivo     VARCHAR(10)     NOT NULL,       -- 'PDF', 'PPTX', etc.
    rutaArchivo     NVARCHAR(400)   NULL,         -- ruta/URL del archivo (recomendado)
    contenido       VARBINARY(MAX)  NULL,        -- opcional si se guarda el binario en BD
    fechaSubida     DATETIME2       NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Material_Curso FOREIGN KEY (idCurso)
        REFERENCES Curso(idCurso) ON DELETE CASCADE,
    CONSTRAINT FK_Material_Docente FOREIGN KEY (idDocente)
        REFERENCES Docente(idDocente) ON DELETE SET NULL
);
GO

/* =====================================================================
   8. ALERTAS DE RIESGO (semaforo)
   ===================================================================== */

CREATE TABLE Alerta (
    idAlerta        INT IDENTITY(1,1) PRIMARY KEY,
    idEstudiante    INT             NOT NULL,
    tipoRiesgo      NVARCHAR(100)   NOT NULL,     -- 'Inasistencia', 'Bajo Rendimiento'
    semaforoEstado  VARCHAR(10)     NOT NULL,
    fecha           DATE            NOT NULL DEFAULT CAST(SYSDATETIME() AS DATE),
    observacion     NVARCHAR(300)   NULL,
    CONSTRAINT CK_Alerta_Semaforo CHECK (semaforoEstado IN ('VERDE','AMARILLO','ROJO')),
    CONSTRAINT FK_Alerta_Estudiante FOREIGN KEY (idEstudiante)
        REFERENCES Estudiante(idEstudiante) ON DELETE CASCADE
);
GO

/* =====================================================================
   9. INDICES DE APOYO (busquedas y joins frecuentes)
   ===================================================================== */

CREATE INDEX IX_Estudiante_Curso ON Estudiante(idCurso);
CREATE INDEX IX_Estudiante_Apoderado ON Estudiante(idApoderado);
CREATE INDEX IX_Calificacion_Estudiante ON Calificacion(idEstudiante);
CREATE INDEX IX_Calificacion_Curso ON Calificacion(idCurso);
CREATE INDEX IX_Asistencia_Estudiante ON Asistencia(idEstudiante);
CREATE INDEX IX_Anotacion_Estudiante ON Anotacion(idEstudiante);
CREATE INDEX IX_Material_Curso ON Material(idCurso);
CREATE INDEX IX_Alerta_Estudiante ON Alerta(idEstudiante);
GO

/* =====================================================================
   10. VISTA DE APOYO: nombre de curso como en el mock ('Matematicas 8A')
   util para no perder compatibilidad con la UI actual sin duplicar datos.
   ===================================================================== */

CREATE VIEW vw_CursoNombre AS
SELECT
    idCurso,
    CONCAT(asignatura, ' ', nivel, paralelo) AS nombreCurso,
    nivel, paralelo, asignatura, anioEscolar, idDocenteJefe
FROM Curso;
GO

/* =====================================================================
   11. DATOS DE PRUEBA (equivalentes al MOCK_DB de api.js)
   Hash bcrypt de una clave temporal de demostracion. Debe cambiarse al desplegar.
   ===================================================================== */

INSERT INTO Administrador (rut, nombre, correo, contrasenaHash)
VALUES ('11.111.111-1', 'Administrador SIGA', 'admin@siga.cl', '$2y$12$TQH//.B6pBy/LFVqQth2b.M2NN.tsJAUqwpf7FhWRJFC7tduGiLGm');

INSERT INTO Docente (rut, nombre, correo, contrasenaHash, especialidad)
VALUES
('22.222.222-2', 'Andrea Torres', 'a.torres@upla.cl', '$2y$12$TQH//.B6pBy/LFVqQth2b.M2NN.tsJAUqwpf7FhWRJFC7tduGiLGm', 'Matematicas'),
('33.333.333-3', 'Pedro Soto', 'p.soto@upla.cl', '$2y$12$TQH//.B6pBy/LFVqQth2b.M2NN.tsJAUqwpf7FhWRJFC7tduGiLGm', 'Lenguaje'),
('88.888.888.8', 'Guian Barrios', 'g.barrios@upla.cl', '$2y$12$TQH//.B6pBy/LFVqQth2b.M2NN.tsJAUqwpf7FhWRJFC7tduGiLGm', 'Historia');

INSERT INTO Apoderado (rut, nombre, correo, contrasenaHash)
VALUES
('44.444.444-4', 'Juan Perez', 'j.perez@email.cl', '$2y$12$TQH//.B6pBy/LFVqQth2b.M2NN.tsJAUqwpf7FhWRJFC7tduGiLGm'),
('55.555.555-5', 'Carlos Ruiz', 'c.ruiz@mail.cl', '$2y$12$TQH//.B6pBy/LFVqQth2b.M2NN.tsJAUqwpf7FhWRJFC7tduGiLGm'),
('66.666.666-6', 'Maria Diaz', 'm.diaz@mail.cl', '$2y$12$TQH//.B6pBy/LFVqQth2b.M2NN.tsJAUqwpf7FhWRJFC7tduGiLGm'),
('77.777.777-7', 'Liam Andrae', 'l.andrae@email.cl', '$2y$12$TQH//.B6pBy/LFVqQth2b.M2NN.tsJAUqwpf7FhWRJFC7tduGiLGm');

INSERT INTO Curso (nivel, paralelo, asignatura, anioEscolar, idDocenteJefe)
VALUES
('8vo Basico', 'A', 'Matematicas', 2024, 1),
('8vo Basico', 'B', 'Lenguaje', 2024, 2),
('6to Basico', 'A', 'Historia', 2024, 3);

INSERT INTO DocenteCurso (idDocente, idCurso) VALUES (1,1), (2,2), (3,3);

INSERT INTO Estudiante (rut, nombre, correo, idCurso, idApoderado)
VALUES
('12.345.678-9', 'Sofia Gonzalez', 'sofia.g@edu.cl', 1, 1),
('13.456.789-0', 'Martin Ruiz', 'martin.r@edu.cl', 1, 2),
('14.567.890-1', 'Valentina Diaz', 'vale.d@edu.cl', 2, 3),
('15.678.901-2', 'Antonio Caseres', 'andy.c@edu.cl', 3, 4);

INSERT INTO Asistencia (idEstudiante, fecha, estado, observacion)
VALUES
(1, '2024-05-20', 'PRESENTE', NULL),
(2, '2024-05-20', 'TARDANZA', 'Llego 10 min tarde'),
(3, '2024-05-19', 'AUSENTE', 'Sin justificar');

INSERT INTO Calificacion (idEstudiante, idCurso, tipoEvaluacion, descripcion, nota, ponderacion, fechaRegistro, fechaNota)
VALUES
(1, 1, 'Prueba 1', 'Prueba 1', 6.5, 30, '2024-05-10', '2024-05-10'),
(1, 1, 'Trabajo Grupal', 'Trabajo Grupal', 5.8, 20, '2024-05-15', '2024-05-15'),
(3, 2, 'Prueba 1', 'Prueba 1', 5.5, 30, '2024-05-10', '2024-05-10');

INSERT INTO Anotacion (idEstudiante, idDocente, idCurso, tipo, observacion)
VALUES
(1, 1, 1, 'POSITIVA', 'Excelente participacion en clase de algebra.'),
(2, 1, 1, 'NEGATIVA', 'Interrumpio constantemente la clase de geometria.');

INSERT INTO Material (idCurso, idDocente, titulo, tipoArchivo, rutaArchivo)
VALUES
(1, 1, 'Guia de Ecuaciones Lineales', 'PDF', '/materiales/guia-ecuaciones.pdf'),
(3, NULL, 'Presentacion Revolucion Francesa', 'PPTX', '/materiales/rev-francesa.pptx');

INSERT INTO Alerta (idEstudiante, tipoRiesgo, semaforoEstado, fecha)
VALUES
(2, 'Inasistencia', 'AMARILLO', '2024-05-20');

GO

