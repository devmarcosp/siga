using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SigaApi.Data;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// ----------------------------------------------------
// 1. Conexion a SQL Server (viene de appsettings.json)
// ----------------------------------------------------
var connectionString = builder.Configuration.GetConnectionString("SigaDb");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("Configura ConnectionStrings__SigaDb como variable de entorno.");
builder.Services.AddDbContext<SigaDbContext>(options => options.UseSqlServer(connectionString));

// ----------------------------------------------------
// 2. Autenticacion JWT (el login devuelve un token real)
// ----------------------------------------------------
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Configura Jwt__Key con al menos 32 caracteres.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

// ----------------------------------------------------
// 3. CORS: solo hace falta si el frontend corre en un
//    servidor/puerto distinto al de esta API. Como el
//    frontend vive en wwwroot de este mismo proyecto,
//    normalmente NO se necesita, pero se deja disponible
//    por si mas adelante separas los proyectos.
// ----------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendSiga", policy =>
    {
        policy.WithOrigins("http://127.0.0.1:5500", "http://localhost:5500")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Sirve los archivos de Proyecto/ (css, js, pages, src) como archivos estaticos
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("FrontendSiga");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
