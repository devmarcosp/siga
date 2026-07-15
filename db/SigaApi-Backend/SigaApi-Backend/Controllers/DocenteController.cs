using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SigaApi.Data;
using SigaApi.Models;

namespace SigaApi.Controllers;

[ApiController]
[Route("api/docente")]
[Authorize(Roles = "DOCENTE")]
public class DocenteController(SigaDbContext db) : ControllerBase
{
    // El id del docente autenticado viaja dentro del token (NameIdentifier), nunca en la URL.
    private int IdDocenteActual => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private Task<List<int>> CursosIdsAsync() =>
        db.DocenteCursos.Where(dc => dc.IdDocente == IdDocenteActual).Select(dc => dc.IdCurso).ToListAsync();

    [HttpGet("cursos")]
    public async Task<IActionResult> Cursos()
    {
        var cursosIds = await CursosIdsAsync();
        var cursos = await db.Cursos.Where(c => cursosIds.Contains(c.IdCurso)).ToListAsync();
        return Ok(cursos.Select(c => new { c.IdCurso, c.NombreCurso, c.Nivel, c.Paralelo, c.Asignatura, c.AnioEscolar }));
    }

    [HttpGet("estudiantes")]
    public async Task<IActionResult> Estudiantes([FromQuery] int? idCurso)
    {
        var cursosIds = await CursosIdsAsync();
        var query = db.Estudiantes.Where(e => e.Activo && cursosIds.Contains(e.IdCurso));
        if (idCurso.HasValue) query = query.Where(e => e.IdCurso == idCurso);

        var resultado = await query.Select(e => new
        {
            e.IdEstudiante,
            e.Nombre,
            e.Rut,
            nombreCurso = e.Curso!.NombreCurso
        }).ToListAsync();
        return Ok(resultado);
    }

    [HttpGet("asistencia")]
    public async Task<IActionResult> Asistencia([FromQuery] int idCurso, [FromQuery] string fecha)
    {
        var cursosIds = await CursosIdsAsync();
        if (!cursosIds.Contains(idCurso)) return Forbid();

        var fechaFiltro = DateOnly.Parse(fecha);
        var estudiantes = await db.Estudiantes.Where(e => e.IdCurso == idCurso && e.Activo).ToListAsync();
        var resultado = new List<object>();
        foreach (var e in estudiantes)
        {
            var registro = await db.Asistencias.FirstOrDefaultAsync(a => a.IdEstudiante == e.IdEstudiante && a.Fecha == fechaFiltro);
            resultado.Add(new { e.IdEstudiante, e.Nombre, estado = registro?.Estado ?? "", observacion = registro?.Observacion ?? "" });
        }
        return Ok(resultado);
    }

    public record ItemAsistenciaDto(int IdEstudiante, string Fecha, string Estado, string? Observacion);

    [HttpPost("asistencia")]
    public async Task<IActionResult> GuardarAsistencia(List<ItemAsistenciaDto> items)
    {
        var cursosIds = await CursosIdsAsync();
        var estudiantesPermitidos = await db.Estudiantes
            .Where(e => e.Activo && cursosIds.Contains(e.IdCurso)).Select(e => e.IdEstudiante).ToListAsync();
        foreach (var i in items)
        {
            if (!estudiantesPermitidos.Contains(i.IdEstudiante)) return Forbid();
            if (!DateOnly.TryParse(i.Fecha, out var fecha)) return BadRequest(new { mensaje = "Fecha inválida." });
            if (i.Estado is not ("PRESENTE" or "AUSENTE" or "TARDANZA" or "JUSTIFICADO"))
                return BadRequest(new { mensaje = "Estado de asistencia inválido." });
            var existente = await db.Asistencias.FirstOrDefaultAsync(a => a.IdEstudiante == i.IdEstudiante && a.Fecha == fecha);
            if (existente != null)
            {
                existente.Estado = i.Estado;
                existente.Observacion = i.Observacion;
            }
            else
            {
                db.Asistencias.Add(new Asistencia { IdEstudiante = i.IdEstudiante, Fecha = fecha, Estado = i.Estado, Observacion = i.Observacion });
            }
        }
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpGet("calificaciones")]
    public async Task<IActionResult> Calificaciones([FromQuery] int? idCurso)
    {
        var cursosIds = await CursosIdsAsync();
        var query = db.Calificaciones.Where(c => cursosIds.Contains(c.IdCurso));
        if (idCurso.HasValue) query = query.Where(c => c.IdCurso == idCurso);

        var resultado = await (
            from c in query
            join e in db.Estudiantes on c.IdEstudiante equals e.IdEstudiante
            join curso in db.Cursos on c.IdCurso equals curso.IdCurso
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

    [HttpPost("calificaciones")]
    public async Task<IActionResult> CrearCalificacion(Calificacion data)
    {
        var cursosIds = await CursosIdsAsync();
        if (!cursosIds.Contains(data.IdCurso)) return BadRequest(new { mensaje = "No tienes acceso a este curso" });
        if (!await db.Estudiantes.AnyAsync(e => e.IdEstudiante == data.IdEstudiante && e.IdCurso == data.IdCurso && e.Activo))
            return BadRequest(new { mensaje = "El estudiante no pertenece al curso." });

        data.FechaRegistro = data.FechaRegistro == default ? DateOnly.FromDateTime(DateTime.Now) : data.FechaRegistro;
        db.Calificaciones.Add(data);
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpPut("calificaciones/{id}")]
    public async Task<IActionResult> EditarCalificacion(int id, Calificacion data)
    {
        var cal = await db.Calificaciones.FindAsync(id);
        if (cal == null) return NotFound(new { mensaje = "Calificacion no encontrada" });
        if (!(await CursosIdsAsync()).Contains(cal.IdCurso)) return Forbid();
        cal.Nota = data.Nota;
        cal.Ponderacion = data.Ponderacion;
        cal.TipoEvaluacion = data.TipoEvaluacion;
        cal.Descripcion = data.Descripcion;
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpDelete("calificaciones/{id}")]
    public async Task<IActionResult> EliminarCalificacion(int id)
    {
        var cal = await db.Calificaciones.FindAsync(id);
        if (cal == null) return NotFound();
        if (!(await CursosIdsAsync()).Contains(cal.IdCurso)) return Forbid();
        db.Calificaciones.Remove(cal);
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpGet("anotaciones")]
    public async Task<IActionResult> Anotaciones()
    {
        var anotaciones = await (
            from a in db.Anotaciones
            join e in db.Estudiantes on a.IdEstudiante equals e.IdEstudiante
            join curso in db.Cursos on (a.IdCurso ?? e.IdCurso) equals curso.IdCurso
            join docente in db.Docentes on a.IdDocente equals docente.IdDocente
            where a.IdDocente == IdDocenteActual
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
        return Ok(anotaciones);
    }

    public record NuevaAnotacionDto(int IdEstudiante, int? IdCurso, string Tipo, string Observacion);

    [HttpPost("anotaciones")]
    public async Task<IActionResult> CrearAnotacion(NuevaAnotacionDto dto)
    {
        var cursosIds = await CursosIdsAsync();
        var estudiante = await db.Estudiantes.FindAsync(dto.IdEstudiante);
        if (estudiante == null || !cursosIds.Contains(estudiante.IdCurso)) return Forbid();
        if (dto.IdCurso.HasValue && dto.IdCurso != estudiante.IdCurso) return BadRequest(new { mensaje = "Curso inválido." });
        if (dto.Tipo is not ("POSITIVA" or "NEGATIVA" or "NEUTRA")) return BadRequest(new { mensaje = "Tipo inválido." });
        db.Anotaciones.Add(new Anotacion
        {
            IdEstudiante = dto.IdEstudiante,
            IdDocente = IdDocenteActual,
            IdCurso = dto.IdCurso,
            Tipo = dto.Tipo,
            Observacion = dto.Observacion,
            FechaRegistro = DateTime.Now
        });
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpGet("materiales")]
    public async Task<IActionResult> Materiales([FromQuery] int? idCurso)
    {
        var cursosIds = await CursosIdsAsync();
        var query = db.Materiales.Where(m => cursosIds.Contains(m.IdCurso));
        if (idCurso.HasValue) query = query.Where(m => m.IdCurso == idCurso);
        return Ok(await query.ToListAsync());
    }

    [HttpPost("materiales")]
    public async Task<IActionResult> SubirMaterial(IFormFile file, [FromForm] int idCurso)
    {
        var cursosIds = await CursosIdsAsync();
        if (!cursosIds.Contains(idCurso)) return BadRequest(new { mensaje = "No tienes acceso a este curso" });
        if (file.Length == 0 || file.Length > 10 * 1024 * 1024) return BadRequest(new { mensaje = "El archivo debe pesar entre 1 byte y 10 MB." });
        var extensionesPermitidas = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".pdf", ".ppt", ".pptx", ".doc", ".docx", ".xls", ".xlsx" };
        var nombreOriginal = Path.GetFileName(file.FileName);
        var extension = Path.GetExtension(nombreOriginal);
        if (!extensionesPermitidas.Contains(extension)) return BadRequest(new { mensaje = "Tipo de archivo no permitido." });

        // Se guarda el archivo en disco (wwwroot/materiales) y solo la ruta en la BD.
        var carpeta = Path.Combine("wwwroot", "materiales");
        Directory.CreateDirectory(carpeta);
        var nombreArchivo = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var rutaFisica = Path.Combine(carpeta, nombreArchivo);
        await using (var stream = new FileStream(rutaFisica, FileMode.Create))
            await file.CopyToAsync(stream);

        db.Materiales.Add(new Material
        {
            IdCurso = idCurso,
            IdDocente = IdDocenteActual,
            Titulo = nombreOriginal,
            TipoArchivo = extension.TrimStart('.').ToUpperInvariant(),
            RutaArchivo = $"/materiales/{nombreArchivo}",
            FechaSubida = DateTime.Now
        });
        await db.SaveChangesAsync();
        return Ok(true);
    }

    [HttpDelete("materiales/{id}")]
    public async Task<IActionResult> EliminarMaterial(int id)
    {
        var mat = await db.Materiales.FindAsync(id);
        if (mat == null) return NotFound();
        if (mat.IdDocente != IdDocenteActual) return Forbid();
        if (!string.IsNullOrWhiteSpace(mat.RutaArchivo))
        {
            var ruta = Path.Combine("wwwroot", mat.RutaArchivo.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(ruta)) System.IO.File.Delete(ruta);
        }
        db.Materiales.Remove(mat);
        await db.SaveChangesAsync();
        return Ok(true);
    }
}
