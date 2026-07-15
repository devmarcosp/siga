using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SigaApi.Data;
using SigaApi.Models;

namespace SigaApi.Controllers;

public record NuevaSolicitudDto(string Rut, string Nombre, string Correo, string Contrasena, string Rol);

[ApiController]
[Route("api/registro")]
public class RegistroController(SigaDbContext db) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Crear(NuevaSolicitudDto dto)
    {
        var correo = dto.Correo.Trim().ToLowerInvariant();
        var rol = dto.Rol.Trim().ToUpperInvariant();
        if (rol is not ("DOCENTE" or "APODERADO")) return BadRequest(new { mensaje = "Rol no permitido." });
        if (dto.Nombre.Trim().Length is < 3 or > 150) return BadRequest(new { mensaje = "Nombre inválido." });
        if (!Regex.IsMatch(correo, @"^[^\s@]+@[^\s@]+\.[^\s@]+$")) return BadRequest(new { mensaje = "Correo inválido." });
        if (dto.Contrasena.Length < 8) return BadRequest(new { mensaje = "La contraseña debe tener al menos 8 caracteres." });

        var existe = await db.Administradores.AnyAsync(x => x.Correo == correo) ||
                     await db.Docentes.AnyAsync(x => x.Correo == correo) ||
                     await db.Apoderados.AnyAsync(x => x.Correo == correo) ||
                     await db.SolicitudesRegistro.AnyAsync(x => x.Correo == correo && x.Estado == "PENDIENTE");
        if (existe) return Conflict(new { mensaje = "El correo ya está registrado o pendiente de revisión." });

        db.SolicitudesRegistro.Add(new SolicitudRegistro
        {
            Rut = dto.Rut.Trim(), Nombre = dto.Nombre.Trim(), Correo = correo, Rol = rol,
            ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena),
            Estado = "PENDIENTE", FechaSolicitud = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
        return Accepted(new { mensaje = "Solicitud enviada para aprobación." });
    }

    [Authorize(Roles = "ADMIN")]
    [HttpGet("pendientes")]
    public async Task<IActionResult> Pendientes() => Ok(await db.SolicitudesRegistro
        .Where(x => x.Estado == "PENDIENTE").OrderBy(x => x.FechaSolicitud)
        .Select(x => new { id = x.IdSolicitudRegistro, x.Nombre, identificador = x.Correo, x.Rut, x.Rol, x.FechaSolicitud })
        .ToListAsync());

    [Authorize(Roles = "ADMIN")]
    [HttpPost("{id:int}/aprobar")]
    public async Task<IActionResult> Aprobar(int id)
    {
        var solicitud = await db.SolicitudesRegistro.FirstOrDefaultAsync(x => x.IdSolicitudRegistro == id && x.Estado == "PENDIENTE");
        if (solicitud == null) return NotFound(new { mensaje = "Solicitud pendiente no encontrada." });

        if (solicitud.Rol == "DOCENTE") db.Docentes.Add(new Docente { Rut = solicitud.Rut, Nombre = solicitud.Nombre, Correo = solicitud.Correo, ContrasenaHash = solicitud.ContrasenaHash });
        else db.Apoderados.Add(new Apoderado { Rut = solicitud.Rut, Nombre = solicitud.Nombre, Correo = solicitud.Correo, ContrasenaHash = solicitud.ContrasenaHash });

        solicitud.Estado = "APROBADA";
        solicitud.FechaRevision = DateTime.UtcNow;
        solicitud.IdAdministradorRevisor = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await db.SaveChangesAsync();
        return Ok(new { mensaje = "Cuenta aprobada y habilitada." });
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("{id:int}/rechazar")]
    public async Task<IActionResult> Rechazar(int id)
    {
        var solicitud = await db.SolicitudesRegistro.FirstOrDefaultAsync(x => x.IdSolicitudRegistro == id && x.Estado == "PENDIENTE");
        if (solicitud == null) return NotFound(new { mensaje = "Solicitud pendiente no encontrada." });
        solicitud.Estado = "RECHAZADA";
        solicitud.FechaRevision = DateTime.UtcNow;
        solicitud.IdAdministradorRevisor = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await db.SaveChangesAsync();
        return Ok(new { mensaje = "Solicitud rechazada." });
    }
}
