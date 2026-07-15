using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SigaApi.Data;
using SigaApi.Models;

namespace SigaApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController(SigaDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var totalEstudiantes = await db.Estudiantes.CountAsync(e => e.Activo);
        var totalCursos = await db.Cursos.CountAsync(c => c.Activo);
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        var presentesHoy = await db.Asistencias.CountAsync(a => a.Fecha == hoy && (a.Estado == "PRESENTE" || a.Estado == "JUSTIFICADO"));
        var porcentajeAsistencia = totalEstudiantes > 0 ? Math.Round(presentesHoy * 100m / totalEstudiantes) : 0;
        var promedio = await db.Calificaciones.Select(c => (decimal?)c.Nota).AverageAsync() ?? 0;
        return Ok(new
        {
            totalEstudiantes,
            totalCursos,
            asistenciasHoy = $"{porcentajeAsistencia:0}%",
            promedioGeneral = promedio.ToString("0.0")
        });
    }

    [HttpGet("cursos")]
    public async Task<IActionResult> Cursos()
    {
        var cursos = await db.Cursos.Where(c => c.Activo).ToListAsync();
        var resultado = cursos.Select(c => new
        {
            c.IdCurso,
            c.NombreCurso,
            c.Nivel,
            c.Paralelo,
            c.AnioEscolar,
            c.Asignatura,
            totalEstudiantes = db.Estudiantes.Count(e => e.IdCurso == c.IdCurso && e.Activo)
        });
        return Ok(resultado);
    }

    [HttpPost("cursos")]
    public async Task<IActionResult> CrearCurso(Curso curso)
    {
        db.Cursos.Add(curso);
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpGet("cursos/{idCurso}/docentes")]
    public async Task<IActionResult> DocentesCurso(int idCurso)
    {
        var curso = await db.Cursos.FindAsync(idCurso);
        var docentes = await db.DocenteCursos
            .Where(dc => dc.IdCurso == idCurso)
            .Include(dc => dc.Docente)
            .Select(dc => new { nombreDocente = dc.Docente!.Nombre, asignatura = curso!.Asignatura })
            .ToListAsync();
        return Ok(docentes);
    }

    [HttpGet("estudiantes")]
    public async Task<IActionResult> Estudiantes([FromQuery] int? idCurso)
    {
        var query = db.Estudiantes.Where(e => e.Activo).Include(e => e.Curso).Include(e => e.Apoderado).AsQueryable();
        if (idCurso.HasValue) query = query.Where(e => e.IdCurso == idCurso);

        var resultado = await query.Select(e => new
        {
            e.IdEstudiante,
            e.Nombre,
            e.Rut,
            e.Correo,
            nombreCurso = e.Curso!.Asignatura + " " + e.Curso.Nivel + e.Curso.Paralelo,
            curso = e.Curso.Nivel + " " + e.Curso.Paralelo,
            apoderadoNombre = e.Apoderado != null ? e.Apoderado.Nombre : "Por asignar",
            apoderadoCorreo = e.Apoderado != null ? e.Apoderado.Correo : "Por asignar"
        }).ToListAsync();

        return Ok(resultado);
    }

    [HttpPost("estudiantes")]
    public async Task<IActionResult> CrearEstudiante(Estudiante estudiante)
    {
        db.Estudiantes.Add(estudiante);
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpPut("estudiantes/{id}")]
    public async Task<IActionResult> EditarEstudiante(int id, Estudiante datos)
    {
        var est = await db.Estudiantes.FindAsync(id);
        if (est == null) return NotFound(new { mensaje = "Estudiante no encontrado" });
        est.Nombre = datos.Nombre;
        est.Correo = datos.Correo;
        est.IdCurso = datos.IdCurso;
        est.IdApoderado = datos.IdApoderado;
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpDelete("estudiantes/{id}")]
    public async Task<IActionResult> EliminarEstudiante(int id)
    {
        var est = await db.Estudiantes.FindAsync(id);
        if (est == null) return NotFound();
        est.Activo = false; // baja logica, no se borra el historial academico
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpGet("docentes")]
    public async Task<IActionResult> Docentes()
    {
        var docentes = await db.Docentes.Where(d => d.Activo).ToListAsync();
        var resultado = docentes.Select(d => new
        {
            d.IdDocente,
            d.Rut,
            d.Nombre,
            identificador = d.Correo,
            d.Especialidad,
            rol = "DOCENTE",
            cursosAsignados = db.DocenteCursos.Where(dc => dc.IdDocente == d.IdDocente).Select(dc => dc.IdCurso).ToList()
        });
        return Ok(resultado);
    }

    public record NuevoDocenteDto(string Rut, string Nombre, string Identificador, string Contrasena, string? Especialidad, List<int>? CursosAsignados);
    public record EditarDocenteDto(string Rut, string Nombre, string Identificador, string? Contrasena, string? Especialidad, List<int>? CursosAsignados);

    [HttpPost("docentes")]
    public async Task<IActionResult> CrearDocente(NuevoDocenteDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Rut) || string.IsNullOrWhiteSpace(dto.Nombre) ||
            string.IsNullOrWhiteSpace(dto.Identificador) || string.IsNullOrWhiteSpace(dto.Contrasena))
            return BadRequest(new { mensaje = "RUT, nombre, correo y contraseña son obligatorios." });
        if (dto.CursosAsignados == null || dto.CursosAsignados.Count == 0)
            return BadRequest(new { mensaje = "Debes asignar al menos un curso al docente." });
        if (await db.Docentes.AnyAsync(d => d.Correo == dto.Identificador))
            return BadRequest(new { mensaje = "El correo electronico ya se encuentra registrado." });
        if (await db.Docentes.AnyAsync(d => d.Rut == dto.Rut.Trim()))
            return BadRequest(new { mensaje = "El RUT ya se encuentra registrado." });

        var cursosSolicitados = dto.CursosAsignados.Distinct().ToList();
        var cantidadCursosValidos = await db.Cursos.CountAsync(c => c.Activo && cursosSolicitados.Contains(c.IdCurso));
        if (cantidadCursosValidos != cursosSolicitados.Count)
            return BadRequest(new { mensaje = "Uno o mas cursos seleccionados no existen o estan inactivos." });

        var docente = new Docente
        {
            Rut = dto.Rut.Trim(),
            Nombre = dto.Nombre.Trim(),
            Correo = dto.Identificador.Trim(),
            ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena),
            Especialidad = string.IsNullOrWhiteSpace(dto.Especialidad) ? null : dto.Especialidad.Trim()
        };
        db.Docentes.Add(docente);
        await db.SaveChangesAsync();

        foreach (var idCurso in cursosSolicitados)
        {
            db.DocenteCursos.Add(new DocenteCurso { IdDocente = docente.IdDocente, IdCurso = idCurso });
        }
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpPut("docentes/{id}")]
    public async Task<IActionResult> EditarDocente(int id, EditarDocenteDto dto)
    {
        var docente = await db.Docentes.FindAsync(id);
        if (docente == null || !docente.Activo)
            return NotFound(new { mensaje = "Docente no encontrado." });

        var correo = dto.Identificador.Trim();
        var rut = dto.Rut.Trim();
        if (await db.Docentes.AnyAsync(d => d.IdDocente != id && d.Correo == correo))
            return BadRequest(new { mensaje = "El correo electronico ya se encuentra registrado." });
        if (!string.IsNullOrWhiteSpace(rut) && await db.Docentes.AnyAsync(d => d.IdDocente != id && d.Rut == rut))
            return BadRequest(new { mensaje = "El RUT ya se encuentra registrado." });

        docente.Rut = rut;
        docente.Nombre = dto.Nombre.Trim();
        docente.Correo = correo;
        docente.Especialidad = string.IsNullOrWhiteSpace(dto.Especialidad) ? null : dto.Especialidad.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Contrasena))
            docente.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena);

        var cursosSolicitados = (dto.CursosAsignados ?? []).Distinct().ToHashSet();
        var cursosValidos = await db.Cursos
            .Where(c => c.Activo && cursosSolicitados.Contains(c.IdCurso))
            .Select(c => c.IdCurso)
            .ToListAsync();
        if (cursosValidos.Count != cursosSolicitados.Count)
            return BadRequest(new { mensaje = "Uno o mas cursos seleccionados no existen o estan inactivos." });

        var asignacionesActuales = await db.DocenteCursos.Where(dc => dc.IdDocente == id).ToListAsync();
        db.DocenteCursos.RemoveRange(asignacionesActuales.Where(dc => !cursosSolicitados.Contains(dc.IdCurso)));
        var idsActuales = asignacionesActuales.Select(dc => dc.IdCurso).ToHashSet();
        foreach (var idCurso in cursosSolicitados.Where(idCurso => !idsActuales.Contains(idCurso)))
            db.DocenteCursos.Add(new DocenteCurso { IdDocente = id, IdCurso = idCurso });

        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpDelete("docentes/{identificador}")]
    public async Task<IActionResult> EliminarDocente(string identificador)
    {
        var docente = await db.Docentes.FirstOrDefaultAsync(d => d.Correo == identificador);
        if (docente == null) return NotFound();
        docente.Activo = false;
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpGet("apoderados")]
    public async Task<IActionResult> Apoderados()
    {
        var resultado = await db.Apoderados
            .Where(a => a.Activo)
            .Select(a => new
            {
                a.IdApoderado,
                a.Nombre,
                identificador = a.Correo,
                rol = "APODERADO",
                pupiloId = db.Estudiantes.Where(e => e.IdApoderado == a.IdApoderado && e.Activo).Select(e => (int?)e.IdEstudiante).FirstOrDefault(),
                pupiloNombre = db.Estudiantes.Where(e => e.IdApoderado == a.IdApoderado && e.Activo).Select(e => e.Nombre).FirstOrDefault(),
                pupiloCurso = db.Estudiantes.Where(e => e.IdApoderado == a.IdApoderado && e.Activo)
                    .Select(e => e.Curso!.Asignatura + " " + e.Curso.Nivel + e.Curso.Paralelo).FirstOrDefault()
            }).ToListAsync();
        return Ok(resultado);
    }

    public record NuevoApoderadoDto(string Rut, string Nombre, string Correo, string Contrasena, int PupiloId);

    [HttpPost("apoderados")]
    public async Task<IActionResult> CrearApoderado(NuevoApoderadoDto dto)
    {
        var apoderado = new Apoderado
        {
            Rut = dto.Rut,
            Nombre = dto.Nombre,
            Correo = dto.Correo,
            ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena)
        };
        db.Apoderados.Add(apoderado);
        await db.SaveChangesAsync();

        var pupilo = await db.Estudiantes.FindAsync(dto.PupiloId);
        if (pupilo != null) pupilo.IdApoderado = apoderado.IdApoderado;
        await db.SaveChangesAsync();

        return Ok(true);
    }

    [HttpGet("alertas")]
    public async Task<IActionResult> Alertas()
    {
        var resultado = await (
            from a in db.Alertas
            join e in db.Estudiantes on a.IdEstudiante equals e.IdEstudiante
            join curso in db.Cursos on e.IdCurso equals curso.IdCurso
            select new
            {
                a.IdAlerta,
                a.IdEstudiante,
                nombre = e.Nombre,
                nombreCurso = curso.Asignatura + " " + curso.Nivel + curso.Paralelo,
                a.TipoRiesgo,
                a.SemaforoEstado,
                a.Fecha,
                a.Observacion
            }).ToListAsync();
        return Ok(resultado);
    }

    [HttpGet("asistencia")]
    public async Task<IActionResult> Asistencia([FromQuery] int? idCurso)
    {
        var query = db.Asistencias.AsQueryable();
        if (idCurso.HasValue)
        {
            var estudiantesIds = db.Estudiantes.Where(e => e.IdCurso == idCurso).Select(e => e.IdEstudiante);
            query = query.Where(a => estudiantesIds.Contains(a.IdEstudiante));
        }
        return Ok(await (
            from a in query
            join e in db.Estudiantes on a.IdEstudiante equals e.IdEstudiante
            join curso in db.Cursos on e.IdCurso equals curso.IdCurso
            select new
            {
                a.IdAsistencia,
                a.IdEstudiante,
                nombreEstudiante = e.Nombre,
                e.IdCurso,
                nombreCurso = curso.Asignatura + " " + curso.Nivel + curso.Paralelo,
                a.Fecha,
                a.Estado,
                a.Observacion
            }).ToListAsync());
    }

    [HttpGet("calificaciones")]
    public async Task<IActionResult> Calificaciones([FromQuery] int? idCurso)
    {
        var query = db.Calificaciones.AsQueryable();
        if (idCurso.HasValue) query = query.Where(c => c.IdCurso == idCurso);
        return Ok(await (
            from c in query
            join e in db.Estudiantes on c.IdEstudiante equals e.IdEstudiante
            join curso in db.Cursos on c.IdCurso equals curso.IdCurso
            select new
            {
                c.IdCalificacion, c.IdEstudiante, nombreEstudiante = e.Nombre,
                c.IdCurso, nombreCurso = curso.Asignatura + " " + curso.Nivel + curso.Paralelo,
                asignatura = curso.Asignatura,
                c.TipoEvaluacion, c.Descripcion, c.Nota, c.Ponderacion,
                c.FechaRegistro, c.FechaNota
            }).ToListAsync());
    }
}
