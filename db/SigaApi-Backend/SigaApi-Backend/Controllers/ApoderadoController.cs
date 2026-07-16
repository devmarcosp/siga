using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SigaApi.Data;

namespace SigaApi.Controllers;

[ApiController]
[Route("api/apoderado")]
[Authorize(Roles = "APODERADO")]
public class ApoderadoController(SigaDbContext db) : ControllerBase
{
    private int IdApoderadoActual => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private Task<int?> IdPupiloAsync() =>
        db.Estudiantes.Where(e => e.IdApoderado == IdApoderadoActual).Select(e => (int?)e.IdEstudiante).FirstOrDefaultAsync();

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var idPupilo = await IdPupiloAsync();
        var est = await db.Estudiantes.FindAsync(idPupilo ?? 0);
        if (est == null) return Ok(new { nombrePupilo = "No asignado", curso = "N/A", promedio = "0.0" });

        var notas = await db.Calificaciones.Where(c => c.IdEstudiante == idPupilo).ToListAsync();
        var promedio = notas.Count > 0 ? notas.Average(n => n.Nota).ToString("0.0") : "0.0";
        var cursos = await db.EstudianteCursos
            .Where(ec => ec.IdEstudiante == est.IdEstudiante)
            .Select(ec => ec.Curso!.Asignatura + " " + ec.Curso.Nivel + ec.Curso.Paralelo)
            .ToListAsync();

        return Ok(new { nombrePupilo = est.Nombre, curso = string.Join(", ", cursos), cursos, promedio });
    }

    [HttpGet("calificaciones")]
    public async Task<IActionResult> Calificaciones()
    {
        var idPupilo = await IdPupiloAsync();
        var resultado = await (
            from c in db.Calificaciones
            join e in db.Estudiantes on c.IdEstudiante equals e.IdEstudiante
            join curso in db.Cursos on c.IdCurso equals curso.IdCurso
            where c.IdEstudiante == idPupilo
            select new
            {
                c.IdCalificacion,
                c.IdEstudiante,
                nombreEstudiante = e.Nombre,
                c.IdCurso,
                nombreCurso = curso.Asignatura + " " + curso.Nivel + curso.Paralelo,
                asignatura = curso.Asignatura,
                c.TipoEvaluacion,
                c.Descripcion,
                c.Nota,
                c.Ponderacion,
                c.FechaRegistro,
                c.FechaNota
            }).ToListAsync();
        return Ok(resultado);
    }

    [HttpGet("asistencia")]
    public async Task<IActionResult> Asistencia()
    {
        var idPupilo = await IdPupiloAsync();
        return Ok(await db.Asistencias.Where(a => a.IdEstudiante == idPupilo).ToListAsync());
    }

    [HttpGet("anotaciones")]
    public async Task<IActionResult> Anotaciones()
    {
        var idPupilo = await IdPupiloAsync();
        var resultado = await (
            from a in db.Anotaciones
            join e in db.Estudiantes on a.IdEstudiante equals e.IdEstudiante
            join curso in db.Cursos on (a.IdCurso ?? e.IdCurso) equals curso.IdCurso
            join docente in db.Docentes on a.IdDocente equals docente.IdDocente
            where a.IdEstudiante == idPupilo
            select new
            {
                id = a.IdAnotacion,
                a.IdAnotacion,
                a.IdEstudiante,
                nombreEstudiante = e.Nombre,
                a.IdDocente,
                nombreDocente = docente.Nombre,
                idCurso = (int?)curso.IdCurso,
                nombreCurso = curso.Asignatura + " " + curso.Nivel + curso.Paralelo,
                asignatura = curso.Asignatura,
                tipo = a.Tipo,
                tipoAnotacion = a.Tipo,
                observacion = a.Observacion,
                detalles = a.Observacion,
                a.FechaRegistro
            }).ToListAsync();
        return Ok(resultado);
    }

    [HttpGet("materiales")]
    public async Task<IActionResult> Materiales()
    {
        var idPupilo = await IdPupiloAsync();
        if (!idPupilo.HasValue) return Ok(new List<object>());
        var cursosIds = db.EstudianteCursos.Where(ec => ec.IdEstudiante == idPupilo.Value).Select(ec => ec.IdCurso);
        return Ok(await (
            from m in db.Materiales
            join curso in db.Cursos on m.IdCurso equals curso.IdCurso
            where cursosIds.Contains(m.IdCurso)
            select new
            {
                m.IdMaterial,
                m.IdCurso,
                nombreCurso = curso.Asignatura + " " + curso.Nivel + curso.Paralelo,
                asignatura = curso.Asignatura,
                m.IdDocente,
                m.Titulo,
                m.TipoArchivo,
                m.RutaArchivo,
                m.FechaSubida
            }).ToListAsync());
    }
}
