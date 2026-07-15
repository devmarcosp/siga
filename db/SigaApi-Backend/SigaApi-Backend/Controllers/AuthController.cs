using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SigaApi.Data;

namespace SigaApi.Controllers;

public record LoginRequest(string Identificador, string Contrasena);

[ApiController]
[Route("api/auth")]
public class AuthController(SigaDbContext db, IConfiguration config) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Identificador) || string.IsNullOrWhiteSpace(req.Contrasena))
            return BadRequest(new { mensaje = "Debes ingresar usuario y contraseña." });

        var identificador = req.Identificador.Trim();
        // Se busca el correo en las 3 tablas de rol (no hay tabla Usuario central)
        var admin = await db.Administradores.FirstOrDefaultAsync(a => a.Correo == identificador && a.Activo);
        if (admin != null && ContrasenaValida(req.Contrasena, admin.ContrasenaHash))
            return Ok(GenerarRespuesta(admin.IdAdministrador, admin.Nombre, "ADMIN"));

        var docente = await db.Docentes.FirstOrDefaultAsync(d => d.Correo == identificador && d.Activo);
        if (docente != null && ContrasenaValida(req.Contrasena, docente.ContrasenaHash))
        {
            var cursosAsignados = await db.DocenteCursos
                .Where(dc => dc.IdDocente == docente.IdDocente)
                .Select(dc => dc.IdCurso)
                .ToListAsync();
            return Ok(GenerarRespuesta(docente.IdDocente, docente.Nombre, "DOCENTE", cursosAsignados: cursosAsignados));
        }

        var apoderado = await db.Apoderados.FirstOrDefaultAsync(a => a.Correo == identificador && a.Activo);
        if (apoderado != null && ContrasenaValida(req.Contrasena, apoderado.ContrasenaHash))
        {
            var pupilo = await db.Estudiantes.FirstOrDefaultAsync(e => e.IdApoderado == apoderado.IdApoderado);
            return Ok(GenerarRespuesta(apoderado.IdApoderado, apoderado.Nombre, "APODERADO", pupiloId: pupilo?.IdEstudiante));
        }

        return Unauthorized(new { mensaje = "Credenciales invalidas" });
    }

    private static bool ContrasenaValida(string contrasena, string? hash)
    {
        if (string.IsNullOrWhiteSpace(hash)) return false;
        try { return BCrypt.Net.BCrypt.Verify(contrasena, hash); }
        catch (ArgumentException) { return false; }
        catch (FormatException) { return false; }
    }

    [HttpPost("logout")]
    public IActionResult Logout() => Ok(true);

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var rol = User.FindFirstValue(ClaimTypes.Role)!;
        if (rol == "ADMIN") return Ok(new { identificador = id, nombre = (await db.Administradores.FindAsync(id))?.Nombre, rol });
        if (rol == "DOCENTE")
        {
            var docente = await db.Docentes.FindAsync(id);
            var cursosAsignados = await db.DocenteCursos.Where(x => x.IdDocente == id).Select(x => x.IdCurso).ToListAsync();
            return Ok(new { identificador = id, nombre = docente?.Nombre, rol, cursosAsignados });
        }
        var apoderado = await db.Apoderados.FindAsync(id);
        var pupiloId = await db.Estudiantes.Where(x => x.IdApoderado == id).Select(x => (int?)x.IdEstudiante).FirstOrDefaultAsync();
        return Ok(new { identificador = id, nombre = apoderado?.Nombre, rol, pupiloId });
    }

    private object GenerarRespuesta(int id, string nombre, string rol, List<int>? cursosAsignados = null, int? pupiloId = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, id.ToString()),
            new(ClaimTypes.Role, rol)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new
        {
            identificador = id,
            nombre,
            rol,
            token = new JwtSecurityTokenHandler().WriteToken(token),
            cursosAsignados,
            pupiloId
        };
    }
}
