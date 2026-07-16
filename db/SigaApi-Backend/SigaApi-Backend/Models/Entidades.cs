using System.ComponentModel.DataAnnotations;

namespace SigaApi.Models;

public class Docente
{
    public int IdDocente { get; set; }
    public string Rut { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string Correo { get; set; } = "";
    public string ContrasenaHash { get; set; } = "";
    public string? Especialidad { get; set; }
    public bool Activo { get; set; } = true;

    public List<DocenteCurso> DocenteCursos { get; set; } = [];
}

public class Apoderado
{
    public int IdApoderado { get; set; }
    public string Rut { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string Correo { get; set; } = "";
    public string ContrasenaHash { get; set; } = "";
    public string? Telefono { get; set; }
    public bool Activo { get; set; } = true;
}

public class Administrador
{
    public int IdAdministrador { get; set; }
    public string Rut { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string Correo { get; set; } = "";
    public string ContrasenaHash { get; set; } = "";
    public bool Activo { get; set; } = true;
}

public class SolicitudRegistro
{
    public int IdSolicitudRegistro { get; set; }
    public string Rut { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string Correo { get; set; } = "";
    public string ContrasenaHash { get; set; } = "";
    public string Rol { get; set; } = "";
    public string Estado { get; set; } = "PENDIENTE";
    public DateTime FechaSolicitud { get; set; }
    public DateTime? FechaRevision { get; set; }
    public int? IdAdministradorRevisor { get; set; }
}

public class Curso
{
    public int IdCurso { get; set; }
    public string Nivel { get; set; } = "";
    public string Paralelo { get; set; } = "";
    public string Asignatura { get; set; } = "";
    public short AnioEscolar { get; set; }
    public int? IdDocenteJefe { get; set; }
    public bool Activo { get; set; } = true;

    public List<DocenteCurso> DocenteCursos { get; set; } = [];
    public List<Estudiante> Estudiantes { get; set; } = [];
    public List<EstudianteCurso> EstudianteCursos { get; set; } = [];

    // Propiedad calculada, no mapeada a columna: replica el "nombreCurso" que espera el frontend
    public string NombreCurso => $"{Asignatura} {Nivel}{Paralelo}";
}

public class DocenteCurso
{
    public int IdDocenteCurso { get; set; }
    public int IdDocente { get; set; }
    public int IdCurso { get; set; }
    public Docente? Docente { get; set; }
    public Curso? Curso { get; set; }
}

public class Estudiante
{
    public int IdEstudiante { get; set; }
    public string Rut { get; set; } = "";
    public string Nombre { get; set; } = "";
    public string? Correo { get; set; }
    public int IdCurso { get; set; }
    public int? IdApoderado { get; set; }
    public bool Activo { get; set; } = true;

    public Curso? Curso { get; set; }
    public Apoderado? Apoderado { get; set; }
    public List<EstudianteCurso> EstudianteCursos { get; set; } = [];
}

public class EstudianteCurso
{
    public int IdEstudianteCurso { get; set; }
    public int IdEstudiante { get; set; }
    public int IdCurso { get; set; }
    public DateTime FechaAsignacion { get; set; } = DateTime.UtcNow;
    public Estudiante? Estudiante { get; set; }
    public Curso? Curso { get; set; }
}

public class Asistencia
{
    public int IdAsistencia { get; set; }
    public int IdEstudiante { get; set; }
    public int IdCurso { get; set; }
    public DateOnly Fecha { get; set; }
    public string Estado { get; set; } = "";
    public string? Observacion { get; set; }
}

public class Calificacion
{
    public int IdCalificacion { get; set; }
    public int IdEstudiante { get; set; }
    public int IdCurso { get; set; }
    public string TipoEvaluacion { get; set; } = "";
    public string? Descripcion { get; set; }
    public decimal Nota { get; set; }
    public decimal Ponderacion { get; set; }
    public DateOnly FechaRegistro { get; set; }
    public DateOnly? FechaNota { get; set; }
}

public class Anotacion
{
    public int IdAnotacion { get; set; }
    public int IdEstudiante { get; set; }
    public int IdDocente { get; set; }
    public int? IdCurso { get; set; }
    public string Tipo { get; set; } = "";
    public string Observacion { get; set; } = "";
    public DateTime FechaRegistro { get; set; }
}

public class Material
{
    public int IdMaterial { get; set; }
    public int IdCurso { get; set; }
    public int? IdDocente { get; set; }
    public string Titulo { get; set; } = "";
    public string TipoArchivo { get; set; } = "";
    public string? RutaArchivo { get; set; }
    public DateTime FechaSubida { get; set; }
}

public class Alerta
{
    public int IdAlerta { get; set; }
    public int IdEstudiante { get; set; }
    public string TipoRiesgo { get; set; } = "";
    public string SemaforoEstado { get; set; } = "";
    public DateOnly Fecha { get; set; }
    public string? Observacion { get; set; }
}
