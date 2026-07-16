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
        var presentesHoy = await db.Asistencias
            .Where(a => a.Fecha == hoy && (a.Estado == "PRESENTE" || a.Estado == "JUSTIFICADO"))
            .Select(a => a.IdEstudiante)
            .Distinct()
            .CountAsync();
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
        var resultado = await db.Cursos
            .Where(c => c.Activo)
            .Select(c => new
            {
                c.IdCurso,
                nombreCurso = c.Asignatura + " " + c.Nivel + c.Paralelo,
                c.Nivel,
                c.Paralelo,
                c.AnioEscolar,
                c.Asignatura,
                totalEstudiantes = db.EstudianteCursos.Count(ec => ec.IdCurso == c.IdCurso && ec.Estudiante!.Activo),
                estudiantesAsignados = db.EstudianteCursos
                    .Where(ec => ec.IdCurso == c.IdCurso && ec.Estudiante!.Activo)
                    .Select(ec => ec.IdEstudiante)
                    .ToList()
            })
            .ToListAsync();
        return Ok(resultado);
    }

    public record NuevoCursoDto(string Nivel, string Paralelo, string Asignatura, short AnioEscolar, List<int>? EstudiantesAsignados);

    [HttpPost("cursos")]
    public async Task<IActionResult> CrearCurso(NuevoCursoDto dto)
    {
        var nivel = dto.Nivel.Trim();
        var paralelo = dto.Paralelo.Trim().ToUpperInvariant();
        var asignatura = dto.Asignatura.Trim();
        if (string.IsNullOrWhiteSpace(nivel) || string.IsNullOrWhiteSpace(paralelo) || string.IsNullOrWhiteSpace(asignatura))
            return BadRequest(new { mensaje = "Nivel, paralelo y asignatura son obligatorios." });
        if (await db.Cursos.AnyAsync(c => c.Activo && c.Nivel == nivel && c.Paralelo == paralelo && c.Asignatura == asignatura && c.AnioEscolar == dto.AnioEscolar))
            return Conflict(new { mensaje = "Ese curso ya existe para el año indicado." });

        var estudiantesIds = (dto.EstudiantesAsignados ?? []).Distinct().ToList();
        var estudiantesValidos = await db.Estudiantes
            .Where(e => e.Activo && estudiantesIds.Contains(e.IdEstudiante))
            .Select(e => e.IdEstudiante)
            .ToListAsync();
        if (estudiantesValidos.Count != estudiantesIds.Count)
            return BadRequest(new { mensaje = "Uno o más alumnos seleccionados no existen o están inactivos." });

        await using var transaction = await db.Database.BeginTransactionAsync();
        var curso = new Curso { Nivel = nivel, Paralelo = paralelo, Asignatura = asignatura, AnioEscolar = dto.AnioEscolar };
        db.Cursos.Add(curso);
        await db.SaveChangesAsync();
        foreach (var idEstudiante in estudiantesIds)
            db.EstudianteCursos.Add(new EstudianteCurso { IdEstudiante = idEstudiante, IdCurso = curso.IdCurso });
        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            curso.IdCurso,
            nombreCurso = curso.NombreCurso,
            curso.Nivel,
            curso.Paralelo,
            curso.Asignatura,
            curso.AnioEscolar,
            totalEstudiantes = estudiantesIds.Count,
            estudiantesAsignados = estudiantesIds
        });
    }

    [HttpPut("cursos/{idCurso}/estudiantes")]
    public async Task<IActionResult> AsignarEstudiantesCurso(int idCurso, List<int> estudiantesIds)
    {
        if (!await db.Cursos.AnyAsync(c => c.IdCurso == idCurso && c.Activo))
            return NotFound(new { mensaje = "Curso no encontrado." });

        var solicitados = estudiantesIds.Distinct().ToHashSet();
        var validos = await db.Estudiantes
            .Where(e => e.Activo && solicitados.Contains(e.IdEstudiante))
            .Select(e => e.IdEstudiante)
            .ToListAsync();
        if (validos.Count != solicitados.Count)
            return BadRequest(new { mensaje = "Uno o más alumnos seleccionados no existen o están inactivos." });

        var actuales = await db.EstudianteCursos.Where(ec => ec.IdCurso == idCurso).ToListAsync();
        var removidos = actuales.Where(ec => !solicitados.Contains(ec.IdEstudiante)).ToList();
        if (removidos.Count > 0)
        {
            var removidosIds = removidos.Select(ec => ec.IdEstudiante).ToList();
            var alternativas = await db.EstudianteCursos
                .Where(ec => removidosIds.Contains(ec.IdEstudiante) && ec.IdCurso != idCurso)
                .ToListAsync();
            var sinAlternativa = removidosIds.Where(id => alternativas.All(ec => ec.IdEstudiante != id)).ToList();
            if (sinAlternativa.Count > 0)
                return BadRequest(new { mensaje = "No puedes retirar a un alumno de su único curso. Asígnalo primero a otro curso." });

            var estudiantesRemovidos = await db.Estudiantes.Where(e => removidosIds.Contains(e.IdEstudiante)).ToListAsync();
            foreach (var estudiante in estudiantesRemovidos.Where(e => e.IdCurso == idCurso))
                estudiante.IdCurso = alternativas.First(ec => ec.IdEstudiante == estudiante.IdEstudiante).IdCurso;
        }
        db.EstudianteCursos.RemoveRange(removidos);
        var idsActuales = actuales.Select(ec => ec.IdEstudiante).ToHashSet();
        foreach (var idEstudiante in solicitados.Where(id => !idsActuales.Contains(id)))
            db.EstudianteCursos.Add(new EstudianteCurso { IdEstudiante = idEstudiante, IdCurso = idCurso });

        await db.SaveChangesAsync();
        return Ok(new { idCurso, estudiantesAsignados = solicitados.Order().ToList(), totalEstudiantes = solicitados.Count });
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
        if (idCurso.HasValue)
            query = query.Where(e => db.EstudianteCursos.Any(ec => ec.IdEstudiante == e.IdEstudiante && ec.IdCurso == idCurso));

        var resultado = await query.Select(e => new
        {
            e.IdEstudiante,
            e.IdCurso,
            e.Nombre,
            e.Rut,
            e.Correo,
            nombreCurso = e.Curso!.Asignatura + " " + e.Curso.Nivel + e.Curso.Paralelo,
            curso = e.Curso.Nivel + " " + e.Curso.Paralelo,
            cursosAsignados = db.EstudianteCursos
                .Where(ec => ec.IdEstudiante == e.IdEstudiante)
                .Select(ec => ec.IdCurso)
                .ToList(),
            nombresCursos = db.EstudianteCursos
                .Where(ec => ec.IdEstudiante == e.IdEstudiante)
                .Select(ec => ec.Curso!.Asignatura + " " + ec.Curso.Nivel + ec.Curso.Paralelo)
                .ToList(),
            apoderadoNombre = e.Apoderado != null ? e.Apoderado.Nombre : "Por asignar",
            apoderadoCorreo = e.Apoderado != null ? e.Apoderado.Correo : "Por asignar"
        }).ToListAsync();

        return Ok(resultado);
    }

    public record NuevoEstudianteDto(string Rut, string Nombre, string? Correo, List<int>? CursosAsignados, int? IdCurso);

    [HttpPost("estudiantes")]
    public async Task<IActionResult> CrearEstudiante(NuevoEstudianteDto dto)
    {
        var cursosIds = (dto.CursosAsignados ?? (dto.IdCurso.HasValue ? [dto.IdCurso.Value] : [])).Distinct().ToList();
        if (cursosIds.Count == 0) return BadRequest(new { mensaje = "Debes asignar al menos un curso." });
        if (await db.Estudiantes.AnyAsync(e => e.Rut == dto.Rut.Trim()))
            return Conflict(new { mensaje = "El RUT ya se encuentra registrado." });
        var cursosValidos = await db.Cursos.CountAsync(c => c.Activo && cursosIds.Contains(c.IdCurso));
        if (cursosValidos != cursosIds.Count)
            return BadRequest(new { mensaje = "Uno o más cursos seleccionados no existen o están inactivos." });

        await using var transaction = await db.Database.BeginTransactionAsync();
        var estudiante = new Estudiante
        {
            Rut = dto.Rut.Trim(),
            Nombre = dto.Nombre.Trim(),
            Correo = string.IsNullOrWhiteSpace(dto.Correo) ? null : dto.Correo.Trim(),
            IdCurso = cursosIds[0]
        };
        db.Estudiantes.Add(estudiante);
        await db.SaveChangesAsync();
        foreach (var idCursoAsignado in cursosIds)
            db.EstudianteCursos.Add(new EstudianteCurso { IdEstudiante = estudiante.IdEstudiante, IdCurso = idCursoAsignado });
        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new { estudiante.IdEstudiante, estudiante.Rut, estudiante.Nombre, estudiante.Correo, cursosAsignados = cursosIds });
    }

    public record EditarEstudianteDto(string Rut, string Nombre, string? Correo, List<int>? CursosAsignados, int? IdCurso);

    [HttpPut("estudiantes/{id}")]
    public async Task<IActionResult> EditarEstudiante(int id, EditarEstudianteDto datos)
    {
        var est = await db.Estudiantes.FindAsync(id);
        if (est == null) return NotFound(new { mensaje = "Estudiante no encontrado" });
        var cursosIds = (datos.CursosAsignados ?? (datos.IdCurso.HasValue ? [datos.IdCurso.Value] : [])).Distinct().ToHashSet();
        if (cursosIds.Count == 0) return BadRequest(new { mensaje = "Debes asignar al menos un curso." });
        if (await db.Cursos.CountAsync(c => c.Activo && cursosIds.Contains(c.IdCurso)) != cursosIds.Count)
            return BadRequest(new { mensaje = "Uno o más cursos seleccionados no existen o están inactivos." });
        if (await db.Estudiantes.AnyAsync(e => e.IdEstudiante != id && e.Rut == datos.Rut.Trim()))
            return BadRequest(new { mensaje = "El RUT ya se encuentra registrado." });
        est.Rut = datos.Rut.Trim();
        est.Nombre = datos.Nombre.Trim();
        est.Correo = string.IsNullOrWhiteSpace(datos.Correo) ? null : datos.Correo.Trim();
        est.IdCurso = cursosIds.Contains(est.IdCurso) ? est.IdCurso : cursosIds.Order().First();

        var asignaciones = await db.EstudianteCursos.Where(ec => ec.IdEstudiante == id).ToListAsync();
        db.EstudianteCursos.RemoveRange(asignaciones.Where(ec => !cursosIds.Contains(ec.IdCurso)));
        var idsActuales = asignaciones.Select(ec => ec.IdCurso).ToHashSet();
        foreach (var idCurso in cursosIds.Where(idCurso => !idsActuales.Contains(idCurso)))
            db.EstudianteCursos.Add(new EstudianteCurso { IdEstudiante = id, IdCurso = idCurso });
        await db.SaveChangesAsync();
        return Ok(new { est.IdEstudiante, est.Rut, est.Nombre, est.Correo, cursosAsignados = cursosIds.Order().ToList() });
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

        await using var transaction = await db.Database.BeginTransactionAsync();
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
        await transaction.CommitAsync();
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
        if (cursosSolicitados.Count == 0)
            return BadRequest(new { mensaje = "El docente debe tener al menos un curso asignado." });
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
                a.Rut,
                a.Nombre,
                identificador = a.Correo,
                a.Telefono,
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
        var rut = dto.Rut.Trim();
        var correo = dto.Correo.Trim();
        if (string.IsNullOrWhiteSpace(rut) || string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(dto.Contrasena))
            return BadRequest(new { mensaje = "RUT, nombre, correo y contraseña son obligatorios." });
        if (await db.Apoderados.AnyAsync(a => a.Rut == rut))
            return Conflict(new { mensaje = "El RUT ya se encuentra registrado." });
        if (await db.Apoderados.AnyAsync(a => a.Correo == correo))
            return Conflict(new { mensaje = "El correo ya se encuentra registrado." });
        var pupilo = await db.Estudiantes.FirstOrDefaultAsync(e => e.IdEstudiante == dto.PupiloId && e.Activo);
        if (pupilo == null) return BadRequest(new { mensaje = "El pupilo seleccionado no existe o está inactivo." });

        await using var transaction = await db.Database.BeginTransactionAsync();
        var apoderado = new Apoderado
        {
            Rut = rut,
            Nombre = dto.Nombre.Trim(),
            Correo = correo,
            ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena)
        };
        db.Apoderados.Add(apoderado);
        await db.SaveChangesAsync();

        pupilo.IdApoderado = apoderado.IdApoderado;
        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new { apoderado.IdApoderado, apoderado.Rut, apoderado.Nombre, identificador = apoderado.Correo, pupiloId = pupilo.IdEstudiante, pupiloNombre = pupilo.Nombre });
    }

    public record EditarApoderadoDto(string Rut, string Nombre, string Correo, string? Contrasena, string? Telefono, int? PupiloId);

    [HttpPut("apoderados/{id}")]
    public async Task<IActionResult> EditarApoderado(int id, EditarApoderadoDto dto)
    {
        var apoderado = await db.Apoderados.FindAsync(id);
        if (apoderado == null || !apoderado.Activo)
            return NotFound(new { mensaje = "Apoderado no encontrado." });

        var rut = dto.Rut.Trim();
        var correo = dto.Correo.Trim();
        if (await db.Apoderados.AnyAsync(a => a.IdApoderado != id && a.Rut == rut))
            return Conflict(new { mensaje = "El RUT ya se encuentra registrado." });
        if (await db.Apoderados.AnyAsync(a => a.IdApoderado != id && a.Correo == correo))
            return Conflict(new { mensaje = "El correo ya se encuentra registrado." });

        Estudiante? nuevoPupilo = null;
        if (dto.PupiloId.HasValue)
        {
            nuevoPupilo = await db.Estudiantes.FirstOrDefaultAsync(e => e.IdEstudiante == dto.PupiloId && e.Activo);
            if (nuevoPupilo == null) return BadRequest(new { mensaje = "El pupilo seleccionado no existe o está inactivo." });
        }

        apoderado.Rut = rut;
        apoderado.Nombre = dto.Nombre.Trim();
        apoderado.Correo = correo;
        apoderado.Telefono = string.IsNullOrWhiteSpace(dto.Telefono) ? null : dto.Telefono.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Contrasena))
            apoderado.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena);

        var pupilosAnteriores = await db.Estudiantes.Where(e => e.IdApoderado == id).ToListAsync();
        foreach (var estudiante in pupilosAnteriores) estudiante.IdApoderado = null;
        if (nuevoPupilo != null) nuevoPupilo.IdApoderado = id;

        await db.SaveChangesAsync();
        return Ok(new
        {
            apoderado.IdApoderado,
            apoderado.Rut,
            apoderado.Nombre,
            identificador = apoderado.Correo,
            apoderado.Telefono,
            pupiloId = nuevoPupilo?.IdEstudiante,
            pupiloNombre = nuevoPupilo?.Nombre
        });
    }

    [HttpDelete("apoderados/{id}")]
    public async Task<IActionResult> EliminarApoderado(int id)
    {
        var apoderado = await db.Apoderados.FindAsync(id);
        if (apoderado == null) return NotFound(new { mensaje = "Apoderado no encontrado." });
        apoderado.Activo = false;
        var pupilos = await db.Estudiantes.Where(e => e.IdApoderado == id).ToListAsync();
        foreach (var pupilo in pupilos) pupilo.IdApoderado = null;
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
            query = query.Where(a => a.IdCurso == idCurso.Value);
        return Ok(await (
            from a in query
            join e in db.Estudiantes on a.IdEstudiante equals e.IdEstudiante
            join curso in db.Cursos on a.IdCurso equals curso.IdCurso
            select new
            {
                a.IdAsistencia,
                a.IdEstudiante,
                nombreEstudiante = e.Nombre,
                a.IdCurso,
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
