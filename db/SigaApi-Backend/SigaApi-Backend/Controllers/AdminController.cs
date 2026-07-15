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
        return Ok(new { totalEstudiantes, totalCursos, asistenciasHoy = "94%", promedioGeneral = "5.8" });
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
            nombreCurso = e.Curso!.NombreCurso,
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
            d.Nombre,
            identificador = d.Correo,
            d.Especialidad,
            rol = "DOCENTE",
            cursosAsignados = db.DocenteCursos.Where(dc => dc.IdDocente == d.IdDocente).Select(dc => dc.IdCurso).ToList()
        });
        return Ok(resultado);
    }

    public record NuevoDocenteDto(string Rut, string Nombre, string Identificador, string Contrasena, string? Especialidad, List<int>? CursosAsignados);

    [HttpPost("docentes")]
    public async Task<IActionResult> CrearDocente(NuevoDocenteDto dto)
    {
        if (await db.Docentes.AnyAsync(d => d.Correo == dto.Identificador))
            return BadRequest(new { mensaje = "El correo electronico ya se encuentra registrado." });

        var docente = new Docente
        {
            Rut = dto.Rut,
            Nombre = dto.Nombre,
            Correo = dto.Identificador,
            ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena),
            Especialidad = dto.Especialidad
        };
        db.Docentes.Add(docente);
        await db.SaveChangesAsync();

        if (dto.CursosAsignados != null)
        {
            foreach (var idCurso in dto.CursosAsignados)
                db.DocenteCursos.Add(new DocenteCurso { IdDocente = docente.IdDocente, IdCurso = idCurso });
            await db.SaveChangesAsync();
        }
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
        var apoderados = await db.Apoderados.Where(a => a.Activo).ToListAsync();
        return Ok(apoderados.Select(a => new { a.IdApoderado, a.Nombre, identificador = a.Correo, rol = "APODERADO" }));
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
        var alertas = await db.Alertas.ToListAsync();
        var resultado = alertas.Select(a => new
        {
            nombre = db.Estudiantes.Where(e => e.IdEstudiante == a.IdEstudiante).Select(e => e.Nombre).FirstOrDefault(),
            a.TipoRiesgo,
            a.SemaforoEstado,
            a.Fecha
        });
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
        return Ok(await query.ToListAsync());
    }

    [HttpGet("calificaciones")]
    public async Task<IActionResult> Calificaciones([FromQuery] int? idCurso)
    {
        var query = db.Calificaciones.AsQueryable();
        if (idCurso.HasValue) query = query.Where(c => c.IdCurso == idCurso);
        return Ok(await query.Select(c => new
        {
            c.IdCalificacion, c.IdEstudiante, c.IdCurso, c.TipoEvaluacion, c.Descripcion,
            c.Nota, c.Ponderacion, c.FechaRegistro, c.FechaNota,
            nombreEstudiante = db.Estudiantes.Where(e => e.IdEstudiante == c.IdEstudiante).Select(e => e.Nombre).FirstOrDefault()
        }).ToListAsync());
    }
}
