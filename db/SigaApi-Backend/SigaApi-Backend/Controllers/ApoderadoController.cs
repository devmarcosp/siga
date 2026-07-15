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
        var curso = await db.Cursos.FindAsync(est.IdCurso);

        return Ok(new { nombrePupilo = est.Nombre, curso = curso?.NombreCurso, promedio });
    }

    [HttpGet("calificaciones")]
    public async Task<IActionResult> Calificaciones()
    {
        var idPupilo = await IdPupiloAsync();
        return Ok(await db.Calificaciones.Where(c => c.IdEstudiante == idPupilo).ToListAsync());
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
        return Ok(await db.Anotaciones.Where(a => a.IdEstudiante == idPupilo).ToListAsync());
    }

    [HttpGet("materiales")]
    public async Task<IActionResult> Materiales()
    {
        var idPupilo = await IdPupiloAsync();
        var est = await db.Estudiantes.FindAsync(idPupilo ?? 0);
        if (est == null) return Ok(new List<object>());
        return Ok(await db.Materiales.Where(m => m.IdCurso == est.IdCurso).ToListAsync());
    }
}
