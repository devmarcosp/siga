using Microsoft.EntityFrameworkCore;
using SigaApi.Models;

namespace SigaApi.Data;

public class SigaDbContext(DbContextOptions<SigaDbContext> options) : DbContext(options)
{
    public DbSet<Docente> Docentes => Set<Docente>();
    public DbSet<Apoderado> Apoderados => Set<Apoderado>();
    public DbSet<Administrador> Administradores => Set<Administrador>();
    public DbSet<Curso> Cursos => Set<Curso>();
    public DbSet<DocenteCurso> DocenteCursos => Set<DocenteCurso>();
    public DbSet<Estudiante> Estudiantes => Set<Estudiante>();
    public DbSet<EstudianteCurso> EstudianteCursos => Set<EstudianteCurso>();
    public DbSet<Asistencia> Asistencias => Set<Asistencia>();
    public DbSet<Calificacion> Calificaciones => Set<Calificacion>();
    public DbSet<Anotacion> Anotaciones => Set<Anotacion>();
    public DbSet<Material> Materiales => Set<Material>();
    public DbSet<Alerta> Alertas => Set<Alerta>();
    public DbSet<SolicitudRegistro> SolicitudesRegistro => Set<SolicitudRegistro>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Las tablas y columnas ya existen (creadas por SIGA_BaseDatos.sql).
        // Aqui solo describimos como EF Core debe leerlas/escribirlas.

        modelBuilder.Entity<Docente>(e =>
        {
            e.ToTable("Docente");
            e.HasKey(x => x.IdDocente);
        });

        modelBuilder.Entity<Apoderado>(e =>
        {
            e.ToTable("Apoderado");
            e.HasKey(x => x.IdApoderado);
        });

        modelBuilder.Entity<Administrador>(e =>
        {
            e.ToTable("Administrador");
            e.HasKey(x => x.IdAdministrador);
        });

        modelBuilder.Entity<SolicitudRegistro>(e =>
        {
            e.ToTable("SolicitudRegistro");
            e.HasKey(x => x.IdSolicitudRegistro);
        });

        modelBuilder.Entity<Curso>(e =>
        {
            e.ToTable("Curso");
            e.HasKey(x => x.IdCurso);
            e.Ignore(x => x.NombreCurso); // calculada en C#, no existe como columna
        });

        modelBuilder.Entity<DocenteCurso>(e =>
        {
            e.ToTable("DocenteCurso");
            e.HasKey(x => x.IdDocenteCurso);
            e.HasOne(x => x.Docente).WithMany(d => d.DocenteCursos).HasForeignKey(x => x.IdDocente);
            e.HasOne(x => x.Curso).WithMany(c => c.DocenteCursos).HasForeignKey(x => x.IdCurso);
        });

        modelBuilder.Entity<Estudiante>(e =>
        {
            e.ToTable("Estudiante");
            e.HasKey(x => x.IdEstudiante);
            e.HasOne(x => x.Curso).WithMany(c => c.Estudiantes).HasForeignKey(x => x.IdCurso);
            e.HasOne(x => x.Apoderado).WithMany().HasForeignKey(x => x.IdApoderado);
        });

        modelBuilder.Entity<EstudianteCurso>(e =>
        {
            e.ToTable("EstudianteCurso");
            e.HasKey(x => x.IdEstudianteCurso);
            e.HasIndex(x => new { x.IdEstudiante, x.IdCurso }).IsUnique();
            e.HasOne(x => x.Estudiante).WithMany(x => x.EstudianteCursos).HasForeignKey(x => x.IdEstudiante);
            e.HasOne(x => x.Curso).WithMany(x => x.EstudianteCursos).HasForeignKey(x => x.IdCurso);
        });

        modelBuilder.Entity<Asistencia>(e =>
        {
            e.ToTable("Asistencia");
            e.HasKey(x => x.IdAsistencia);
            e.HasIndex(x => new { x.IdEstudiante, x.IdCurso, x.Fecha }).IsUnique();
        });

        modelBuilder.Entity<Calificacion>(e =>
        {
            e.ToTable("Calificacion");
            e.HasKey(x => x.IdCalificacion);
            e.Property(x => x.Nota).HasColumnType("decimal(3,1)");
            e.Property(x => x.Ponderacion).HasColumnType("decimal(5,2)");
        });

        modelBuilder.Entity<Anotacion>(e =>
        {
            e.ToTable("Anotacion");
            e.HasKey(x => x.IdAnotacion);
        });

        modelBuilder.Entity<Material>(e =>
        {
            e.ToTable("Material");
            e.HasKey(x => x.IdMaterial);
        });

        modelBuilder.Entity<Alerta>(e =>
        {
            e.ToTable("Alerta");
            e.HasKey(x => x.IdAlerta);
        });
    }
}
