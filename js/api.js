/**
CAPA DE DATOS SIMULADOS (MOCK DATA)
*/
const MOCK_DB = {
    users: [
        { identificador: 'admin@siga.cl', contrasena: '1234', nombre: 'Administrador SIGA', rol: 'ADMIN', token: 'mock-token-admin' },
        { identificador: 'a.torres@upla.cl', contrasena: '1234', nombre: 'Andrea Torres', rol: 'DOCENTE', token: 'mock-token-docente', cursosAsignados: [1, 2, 3] },
        { identificador: 'j.perez@email.cl', contrasena: '1234', nombre: 'Juan Pérez', rol: 'APODERADO', token: 'mock-token-apoderado', pupiloId: 101 }
    ],
    pendingUsers: JSON.parse(localStorage.getItem('siga_pending_users') || '[]'),
    cursos: [
        { idCurso: 1, nombreCurso: 'Matemáticas 8°A', nivel: '8vo Básico', paralelo: 'A', anioEscolar: 2024, totalEstudiantes: 32, asignatura: 'Matemáticas' },
        { idCurso: 2, nombreCurso: 'Lenguaje 8°B', nivel: '8vo Básico', paralelo: 'B', anioEscolar: 2024, totalEstudiantes: 30, asignatura: 'Lenguaje' },
        { idCurso: 3, nombreCurso: 'Historia 1°M', nivel: '1ro Medio', paralelo: 'A', anioEscolar: 2024, totalEstudiantes: 35, asignatura: 'Historia' }
    ],
    estudiantes: [
        { idEstudiante: 101, nombre: 'Sofía González', rut: '12.345.678-9', curso: '8vo Básico A', nombreCurso: 'Matemáticas 8°A', apoderadoNombre: 'Juan Pérez', apoderadoCorreo: 'j.perez@email.cl', docenteGuia: 'Andrea Torres', correo: 'sofia.g@edu.cl' },
        { idEstudiante: 102, nombre: 'Martín Ruiz', rut: '13.456.789-0', curso: '8vo Básico A', nombreCurso: 'Matemáticas 8°A', apoderadoNombre: 'Carlos Ruiz', apoderadoCorreo: 'c.ruiz@mail.cl', docenteGuia: 'Andrea Torres', correo: 'martin.r@edu.cl' },
        { idEstudiante: 103, nombre: 'Valentina Díaz', rut: '14.567.890-1', curso: '8vo Básico B', nombreCurso: 'Lenguaje 8°B', apoderadoNombre: 'María Díaz', apoderadoCorreo: 'm.diaz@mail.cl', docenteGuia: 'Pedro Soto', correo: 'vale.d@edu.cl' }
    ],
    asistencia: [
        { idEstudiante: 101, fecha: '2024-05-20', estado: 'PRESENTE', observacion: '' },
        { idEstudiante: 102, fecha: '2024-05-20', estado: 'TARDANZA', observacion: 'Llegó 10 min tarde' },
        { idEstudiante: 103, fecha: '2024-05-19', estado: 'AUSENTE', observacion: 'Sin justificar' }
    ],
    calificaciones: [
        { idCalificacion: 1, idEstudiante: 101, idCurso: 1, nombreEstudiante: 'Sofía González', nombreCurso: 'Matemáticas 8°A', asignatura: 'Matemáticas', tipoEvaluacion: 'Prueba 1', descripcion: 'Prueba 1', nota: 6.5, ponderacion: 30, fechaRegistro: '2024-05-10', fechaNota: '2024-05-10' },
        { idCalificacion: 2, idEstudiante: 101, idCurso: 1, nombreEstudiante: 'Sofía González', nombreCurso: 'Matemáticas 8°A', asignatura: 'Matemáticas', tipoEvaluacion: 'Trabajo Grupal', descripcion: 'Trabajo Grupal', nota: 5.8, ponderacion: 20, fechaRegistro: '2024-05-15', fechaNota: '2024-05-15' },
        { idCalificacion: 3, idEstudiante: 103, idCurso: 2, nombreEstudiante: 'Valentina Díaz', nombreCurso: 'Lenguaje 8°B', asignatura: 'Lenguaje', tipoEvaluacion: 'Prueba 1', descripcion: 'Prueba 1', nota: 5.5, ponderacion: 30, fechaRegistro: '2024-05-10', fechaNota: '2024-05-10' }
    ],
    anotaciones: [
        { id: 1, idEstudiante: 101, nombreEstudiante: 'Sofía González', tipo: 'POSITIVA', tipoAnotacion: 'POSITIVA', observacion: 'Excelente participación en clase de álgebra.', detalles: 'Excelente participación en clase de álgebra.', fechaRegistro: '2024-05-12', nombreDocente: 'Andrea Torres', asignatura: 'Matemáticas' },
        { id: 2, idEstudiante: 102, nombreEstudiante: 'Martín Ruiz', tipo: 'NEGATIVA', tipoAnotacion: 'NEGATIVA', observacion: 'Interrumpió constantemente la clase.', detalles: 'Interrumpió constantemente la clase de geometría.', fechaRegistro: '2024-05-14', nombreDocente: 'Andrea Torres', asignatura: 'Matemáticas' }
    ],
    materiales: [
        { idMaterial: 1, titulo: 'Guía de Ecuaciones Lineales', asignatura: 'Matemáticas', tipoArchivo: 'PDF', idCurso: 1 },
        { idMaterial: 2, titulo: 'Presentación Revolución Francesa', asignatura: 'Historia', tipoArchivo: 'PPTX', idCurso: 3 }
    ],
    alertas: [
        { nombre: 'Martín Ruiz', tipoRiesgo: 'Inasistencia', semaforoEstado: 'AMARILLO', fecha: '2024-05-20' },
        { nombre: 'Javiera López', tipoRiesgo: 'Bajo Rendimiento', semaforoEstado: 'ROJO', fecha: '2024-05-18' }
    ],

    // === HORARIO (SOLO DEMO) ===
    // Basado en la tabla Curso (asignatura, nivel, paralelo) y DocenteCurso.
    // Bloques de clase + recreos/almuerzo de una jornada escolar típica.
    bloques: [
        { id: 1, tipo: 'CLASE', inicio: '08:00', fin: '08:45' },
        { id: 2, tipo: 'CLASE', inicio: '08:50', fin: '09:35' },
        { id: 0, tipo: 'RECREO', inicio: '09:35', fin: '09:55', nombre: 'Recreo' },
        { id: 3, tipo: 'CLASE', inicio: '09:55', fin: '10:40' },
        { id: 4, tipo: 'CLASE', inicio: '10:45', fin: '11:30' },
        { id: 0, tipo: 'RECREO', inicio: '11:30', fin: '11:45', nombre: 'Recreo' },
        { id: 5, tipo: 'CLASE', inicio: '11:45', fin: '12:30' },
        { id: 0, tipo: 'ALMUERZO', inicio: '12:30', fin: '13:25', nombre: 'Almuerzo' },
        { id: 6, tipo: 'CLASE', inicio: '13:30', fin: '14:15' }
    ],
    // Horario semanal del docente (1=Lunes … 5=Viernes) → bloques con curso asignado (idCurso de MOCK_DB.cursos)
    horarioDocente: {
        1: [{ bloque: 1, idCurso: 1, sala: 'Sala 201' }, { bloque: 2, idCurso: 1, sala: 'Sala 201' }, { bloque: 3, idCurso: 2, sala: 'Sala 105' }, { bloque: 4, idCurso: 2, sala: 'Sala 105' }, { bloque: 6, idCurso: 3, sala: 'Sala 302' }],
        2: [{ bloque: 1, idCurso: 3, sala: 'Sala 302' }, { bloque: 2, idCurso: 3, sala: 'Sala 302' }, { bloque: 3, idCurso: 1, sala: 'Sala 201' }, { bloque: 5, idCurso: 2, sala: 'Sala 105' }, { bloque: 6, idCurso: 2, sala: 'Sala 105' }],
        3: [{ bloque: 1, idCurso: 2, sala: 'Sala 105' }, { bloque: 2, idCurso: 1, sala: 'Sala 201' }, { bloque: 3, idCurso: 1, sala: 'Sala 201' }, { bloque: 4, idCurso: 3, sala: 'Sala 302' }, { bloque: 5, idCurso: 3, sala: 'Sala 302' }],
        4: [{ bloque: 2, idCurso: 2, sala: 'Sala 105' }, { bloque: 3, idCurso: 3, sala: 'Sala 302' }, { bloque: 4, idCurso: 1, sala: 'Sala 201' }, { bloque: 5, idCurso: 1, sala: 'Sala 201' }, { bloque: 6, idCurso: 2, sala: 'Sala 105' }],
        5: [{ bloque: 1, idCurso: 1, sala: 'Sala 201' }, { bloque: 2, idCurso: 3, sala: 'Sala 302' }, { bloque: 3, idCurso: 2, sala: 'Sala 105' }, { bloque: 4, idCurso: 1, sala: 'Sala 201' }, { bloque: 6, idCurso: 3, sala: 'Sala 302' }]
    },
    // Horario semanal del pupilo (curso 8vo Básico A) → asignatura + docente + sala por bloque
    horarioPupilo: {
        1: [{ bloque: 1, asignatura: 'Matemáticas', docente: 'Andrea Torres', sala: 'Sala 201' }, { bloque: 2, asignatura: 'Matemáticas', docente: 'Andrea Torres', sala: 'Sala 201' }, { bloque: 3, asignatura: 'Lenguaje', docente: 'Pedro Soto', sala: 'Sala 201' }, { bloque: 4, asignatura: 'Historia', docente: 'Carlos Muñoz', sala: 'Sala 201' }, { bloque: 5, asignatura: 'Ciencias Naturales', docente: 'María Rojas', sala: 'Lab. Ciencias' }, { bloque: 6, asignatura: 'Inglés', docente: 'Laura Vega', sala: 'Sala 201' }],
        2: [{ bloque: 1, asignatura: 'Lenguaje', docente: 'Pedro Soto', sala: 'Sala 201' }, { bloque: 2, asignatura: 'Lenguaje', docente: 'Pedro Soto', sala: 'Sala 201' }, { bloque: 3, asignatura: 'Matemáticas', docente: 'Andrea Torres', sala: 'Sala 201' }, { bloque: 4, asignatura: 'Ed. Física', docente: 'Diego Paredes', sala: 'Gimnasio' }, { bloque: 5, asignatura: 'Ed. Física', docente: 'Diego Paredes', sala: 'Gimnasio' }, { bloque: 6, asignatura: 'Música', docente: 'Camila Silva', sala: 'Sala Música' }],
        3: [{ bloque: 1, asignatura: 'Historia', docente: 'Carlos Muñoz', sala: 'Sala 201' }, { bloque: 2, asignatura: 'Historia', docente: 'Carlos Muñoz', sala: 'Sala 201' }, { bloque: 3, asignatura: 'Ciencias Naturales', docente: 'María Rojas', sala: 'Lab. Ciencias' }, { bloque: 4, asignatura: 'Matemáticas', docente: 'Andrea Torres', sala: 'Sala 201' }, { bloque: 5, asignatura: 'Inglés', docente: 'Laura Vega', sala: 'Sala 201' }, { bloque: 6, asignatura: 'Tecnología', docente: 'Rodrigo Núñez', sala: 'Sala Computación' }],
        4: [{ bloque: 1, asignatura: 'Ciencias Naturales', docente: 'María Rojas', sala: 'Lab. Ciencias' }, { bloque: 2, asignatura: 'Ciencias Naturales', docente: 'María Rojas', sala: 'Lab. Ciencias' }, { bloque: 3, asignatura: 'Lenguaje', docente: 'Pedro Soto', sala: 'Sala 201' }, { bloque: 4, asignatura: 'Matemáticas', docente: 'Andrea Torres', sala: 'Sala 201' }, { bloque: 5, asignatura: 'Artes Visuales', docente: 'Camila Silva', sala: 'Taller Artes' }, { bloque: 6, asignatura: 'Artes Visuales', docente: 'Camila Silva', sala: 'Taller Artes' }],
        5: [{ bloque: 1, asignatura: 'Inglés', docente: 'Laura Vega', sala: 'Sala 201' }, { bloque: 2, asignatura: 'Matemáticas', docente: 'Andrea Torres', sala: 'Sala 201' }, { bloque: 3, asignatura: 'Historia', docente: 'Carlos Muñoz', sala: 'Sala 201' }, { bloque: 4, asignatura: 'Lenguaje', docente: 'Pedro Soto', sala: 'Sala 201' }, { bloque: 5, asignatura: 'Orientación', docente: 'Andrea Torres', sala: 'Sala 201' }, { bloque: 6, asignatura: 'Ed. Física', docente: 'Diego Paredes', sala: 'Gimnasio' }]
    }
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));
let authToken = localStorage.getItem('siga_token') || '';

function setToken(token) {
    authToken = token || '';
    if (token) localStorage.setItem('siga_token', token);
    else localStorage.removeItem('siga_token');
}

// ==========================================
// FUNCIONES AUXILIARES PARA FILTRAR DOCENTE
// ==========================================
const getCurrentUser = () => {
    return MOCK_DB.users.find(u => u.token === authToken);
};

const getDocenteCursosIds = () => {
    const user = getCurrentUser();
    if (!user || user.rol !== 'DOCENTE') return [];
    return user.cursosAsignados || [];
};

// ==========================================
// AUTH API
// ==========================================
const AuthApi = {
    login: async (identificador, contrasena) => {
        await delay(600);
        const user = MOCK_DB.users.find(u => u.identificador === identificador && u.contrasena === contrasena);
        if (!user) throw new Error('Credenciales inválidas');
        return { ...user };
    },
    logout: async () => { await delay(300); return true; },
    me: async () => {
        await delay(300);
        const user = MOCK_DB.users.find(u => u.token === authToken);
        if (!user) throw new Error('Sesión expirada');
        return { ...user };
    },
    register: async (data) => {
        await delay(500);
        const correo = data.identificador.trim().toLowerCase();
        const exists = MOCK_DB.users.some(u => u.identificador.toLowerCase() === correo) ||
            MOCK_DB.pendingUsers.some(u => u.identificador.toLowerCase() === correo);
        if (exists) throw new Error('Este correo ya está registrado o pendiente de aprobación.');
        MOCK_DB.pendingUsers.push({
            id: Date.now(), nombre: data.nombre.trim(), identificador: correo,
            rut: data.rut.trim(), contrasena: data.contrasena, rol: data.rol,
            estado: 'PENDIENTE', fechaSolicitud: new Date().toISOString()
        });
        localStorage.setItem('siga_pending_users', JSON.stringify(MOCK_DB.pendingUsers));
        return true;
    }
};

// Conserva en esta demo estática las cuentas que el administrador aprobó.
JSON.parse(localStorage.getItem('siga_approved_users') || '[]').forEach(user => {
    if (!MOCK_DB.users.some(u => u.identificador === user.identificador)) MOCK_DB.users.push(user);
});

// ==========================================
// ADMIN API
// ==========================================
const AdminApi = {
    solicitudes: async () => MOCK_DB.pendingUsers,
    aprobarSolicitud: async (id) => {
        const solicitud = MOCK_DB.pendingUsers.find(s => s.id === id);
        if (!solicitud) throw new Error('La solicitud ya no existe.');
        const user = { ...solicitud, token: `mock-token-${id}` };
        delete user.id; delete user.estado; delete user.fechaSolicitud;
        if (user.rol === 'DOCENTE') user.cursosAsignados = [];
        MOCK_DB.users.push(user);
        MOCK_DB.pendingUsers = MOCK_DB.pendingUsers.filter(s => s.id !== id);
        localStorage.setItem('siga_pending_users', JSON.stringify(MOCK_DB.pendingUsers));
        localStorage.setItem('siga_approved_users', JSON.stringify(MOCK_DB.users.filter(u => String(u.token).startsWith('mock-token-1'))));
        return true;
    },
    rechazarSolicitud: async (id) => {
        MOCK_DB.pendingUsers = MOCK_DB.pendingUsers.filter(s => s.id !== id);
        localStorage.setItem('siga_pending_users', JSON.stringify(MOCK_DB.pendingUsers));
        return true;
    },
    dashboard: async () => {
        const totalEstudiantes = MOCK_DB.estudiantes.length;
        const totalCursos = MOCK_DB.cursos.length;
        return { totalEstudiantes, totalCursos, asistenciasHoy: '94%', promedioGeneral: '5.8' };
    },
    cursos: async () => MOCK_DB.cursos,
    docentesCurso: async (idCurso) => {
        const docentes = MOCK_DB.users.filter(u => u.rol === 'DOCENTE' && u.cursosAsignados && u.cursosAsignados.includes(idCurso));
        if (!docentes.length) return [];
        return docentes.map(docente => {
            const curso = MOCK_DB.cursos.find(c => c.idCurso === idCurso);
            return { nombreDocente: docente.nombre, asignatura: curso ? curso.asignatura : 'Sin asignatura' };
        });
    },
    estudiantes: async (idCurso) => {
        if (!idCurso) return MOCK_DB.estudiantes;
        const curso = MOCK_DB.cursos.find(c => c.idCurso == idCurso);
        return curso ? MOCK_DB.estudiantes.filter(e => e.nombreCurso === curso.nombreCurso) : [];
    },
    alertas: async () => MOCK_DB.alertas,
    asistencia: async (idCurso) => {
        if (!idCurso) return MOCK_DB.asistencia;
        // Filtramos la asistencia para que solo devuelva la de los alumnos de este curso
        const estudiantesCurso = await AdminApi.estudiantes(idCurso);
        const idsEstudiantes = estudiantesCurso.map(e => e.idEstudiante);
        return MOCK_DB.asistencia.filter(a => idsEstudiantes.includes(a.idEstudiante));
    },
    // Agrega esto dentro de AdminApi (después de la función alertas o cualquier otra):
    calificaciones: async (idCurso) => {
        if (!idCurso) return MOCK_DB.calificaciones;
        return MOCK_DB.calificaciones.filter(c => c.idCurso == idCurso);
    },
    docentes: async () => MOCK_DB.users.filter(u => u.rol === 'DOCENTE'),
    crearDocente: async (data) => {
        const nuevoDocente = {
            identificador: data.identificador, contrasena: data.contrasena, nombre: data.nombre,
            rol: 'DOCENTE', token: 'mock-token-' + Date.now(), cursosAsignados: data.cursosAsignados || []
        };
        MOCK_DB.users.push(nuevoDocente);
        return true;
    },
    eliminarDocente: async (identificador) => {
        MOCK_DB.users = MOCK_DB.users.filter(u => !(u.rol === 'DOCENTE' && u.identificador === identificador));
        return true;
    },
    crearEstudiante: async (data) => {
        const nuevoEstudiante = {
            idEstudiante: Date.now(), nombre: data.nombre, rut: data.rut, curso: data.curso,
            nombreCurso: data.nombreCurso, apoderadoNombre: 'Por asignar', apoderadoCorreo: 'Por asignar',
            docenteGuia: 'Por asignar', correo: data.correo || ''
        };
        MOCK_DB.estudiantes.push(nuevoEstudiante);
        const curso = MOCK_DB.cursos.find(c => c.idCurso === data.idCurso);
        if (curso) curso.totalEstudiantes++;
        return true;
    },
    crearCurso: async (data) => {
        const nuevoCurso = {
            idCurso: Date.now(), // Generar ID único
            nombreCurso: data.nombreCurso,
            nivel: data.nivel,
            paralelo: data.paralelo,
            anioEscolar: parseInt(data.anioEscolar),
            asignatura: data.asignatura,
            totalEstudiantes: 0
        };
        MOCK_DB.cursos.push(nuevoCurso);
        return true;
    },
    apoderados: async () => MOCK_DB.users.filter(u => u.rol === 'APODERADO'),
    crearApoderado: async (data) => {
        const nuevoApoderado = {
            identificador: data.correo, contrasena: data.contrasena, nombre: data.nombre,
            rol: 'APODERADO', token: 'mock-token-' + Date.now(), pupiloId: data.pupiloId
        };
        MOCK_DB.users.push(nuevoApoderado);
        const estudiante = MOCK_DB.estudiantes.find(e => e.idEstudiante === data.pupiloId);
        if (estudiante) {
            estudiante.apoderadoNombre = data.nombre;
            estudiante.apoderadoCorreo = data.correo;
        }
        return true;
    },
    eliminarApoderado: async (identificador) => {
        MOCK_DB.users = MOCK_DB.users.filter(u => !(u.rol === 'APODERADO' && u.identificador === identificador));
        return true;
    },

    editarDocente: async (identificador, data) => {
        const index = MOCK_DB.users.findIndex(u => u.rol === 'DOCENTE' && u.identificador === identificador);
        if (index !== -1) { MOCK_DB.users[index] = { ...MOCK_DB.users[index], ...data }; return true; }
        throw new Error('Docente no encontrado');
    },
    
    eliminarEstudiante: async (idEstudiante) => {
        MOCK_DB.estudiantes = MOCK_DB.estudiantes.filter(e => e.idEstudiante !== idEstudiante);
        return true;
    },
    
    editarEstudiante: async (idEstudiante, data) => {
        const index = MOCK_DB.estudiantes.findIndex(e => e.idEstudiante === idEstudiante);
        if (index !== -1) { MOCK_DB.estudiantes[index] = { ...MOCK_DB.estudiantes[index], ...data }; return true; }
        throw new Error('Estudiante no encontrado');
    },
    
    editarApoderado: async (identificador, data) => {
        const index = MOCK_DB.users.findIndex(u => u.rol === 'APODERADO' && u.identificador === identificador);
        if (index !== -1) { MOCK_DB.users[index] = { ...MOCK_DB.users[index], ...data }; return true; }
        throw new Error('Apoderado no encontrado');
    },

    obtenerDocentes: async () => MOCK_DB.users.filter(u => u.rol === 'DOCENTE'),
    obtenerCursos: async () => MOCK_DB.cursos,
    agregarDocente: async (docente) => {
        const existe = MOCK_DB.users.some(u => u.identificador.toLowerCase() === docente.identificador.toLowerCase());
        if (existe) throw new Error("El correo electrónico ya se encuentra registrado.");
        const nuevoDocente = {
            identificador: docente.identificador, contrasena: docente.contrasena, nombre: docente.nombre,
            rol: 'DOCENTE', token: `mock-token-${docente.identificador.replace(/[^a-z0-9]/gi, '')}`,
            cursosAsignados: docente.cursosAsignados
        };
        MOCK_DB.users.push(nuevoDocente);
        return true;
    }
};

// ==========================================
// DOCENTE API (CORREGIDO: FILTRA POR CURSOS ASIGNADOS)
// ==========================================
const DocenteApi = {
    dashboard: async () => {
        const cursos = await DocenteApi.cursos();
        const todosEstudiantes = new Set();
        for (const curso of cursos) {
            const estudiantes = await DocenteApi.estudiantes(curso.idCurso);
            estudiantes.forEach(e => todosEstudiantes.add(e.idEstudiante));
        }
        return { 
            totalEstudiantes: todosEstudiantes.size, 
            totalClases: cursos.length, 
            asistenciasHoy: '0%', 
            promedioGeneral: '0.0' 
        };
    },
    
    asistenciaHoyPorCurso: async (idCurso) => {
        const cursosIds = getDocenteCursosIds();
        if (!cursosIds.includes(parseInt(idCurso))) return '0%';
        
        const fechaHoy = new Date().toISOString().split('T')[0];
        const estudiantes = await DocenteApi.estudiantes(idCurso);
        if (estudiantes.length === 0) return '0%';
        
        let presentes = 0;
        estudiantes.forEach(est => {
            const registro = MOCK_DB.asistencia.find(a => a.idEstudiante === est.idEstudiante && a.fecha === fechaHoy);
            if (registro && registro.estado === 'PRESENTE') presentes++;
        });
        const porcentaje = Math.round((presentes / estudiantes.length) * 100);
        return `${porcentaje}%`;
    },
    
    promedioPorCurso: async (idCurso) => {
        const cursosIds = getDocenteCursosIds();
        if (!cursosIds.includes(parseInt(idCurso))) return '0.0';
        
        const calificaciones = await DocenteApi.calificaciones(idCurso);
        if (calificaciones.length === 0) return '0.0';
        const suma = calificaciones.reduce((acc, c) => acc + parseFloat(c.nota), 0);
        return (suma / calificaciones.length).toFixed(1);
    },
    
    cursos: async () => {
        const cursosIds = getDocenteCursosIds();
        return MOCK_DB.cursos.filter(c => cursosIds.includes(c.idCurso));
    },

    // Horario del docente para un día de la semana (1=Lunes … 5=Viernes). SOLO DEMO.
    horario: async (diaSemana) => {
        await delay(80);
        return { bloques: MOCK_DB.bloques, clases: MOCK_DB.horarioDocente[diaSemana] || [] };
    },
    
    estudiantes: async (idCurso) => {
        const cursosIds = getDocenteCursosIds();
        if (!idCurso) {
            const cursosAsignados = MOCK_DB.cursos.filter(c => cursosIds.includes(c.idCurso));
            return MOCK_DB.estudiantes.filter(e => cursosAsignados.some(c => c.nombreCurso === e.nombreCurso));
        }
        if (!cursosIds.includes(parseInt(idCurso))) return [];
        const curso = MOCK_DB.cursos.find(c => c.idCurso == idCurso);
        return curso ? MOCK_DB.estudiantes.filter(e => e.nombreCurso === curso.nombreCurso) : [];
    },
    
    asistencia: async (idCurso, fecha) => {
        const cursosIds = getDocenteCursosIds();
        if (idCurso && !cursosIds.includes(parseInt(idCurso))) return [];
        
        const ests = await DocenteApi.estudiantes(idCurso);
        return ests.map(e => {
            const saved = MOCK_DB.asistencia.find(a => a.idEstudiante === e.idEstudiante && a.fecha === fecha);
            return { ...e, estado: saved?.estado || '', observacion: saved?.observacion || '' };
        });
    },
    
    guardarAsistencia: async (items) => {
        items.forEach(i => {
            const idx = MOCK_DB.asistencia.findIndex(a => a.idEstudiante === i.idEstudiante && a.fecha === i.fecha);
            if (idx >= 0) MOCK_DB.asistencia[idx] = i; else MOCK_DB.asistencia.push(i);
        });
        return true;
    },
    asistenciaHistorica: async (idCurso) => {
        const cursosIds = getDocenteCursosIds();
        if (!idCurso || !cursosIds.includes(parseInt(idCurso))) return [];
        
        // Filtramos para obtener solo la asistencia histórica de los alumnos de este curso
        const estudiantesCurso = await DocenteApi.estudiantes(idCurso);
        const idsEstudiantes = estudiantesCurso.map(e => e.idEstudiante);
        return MOCK_DB.asistencia.filter(a => idsEstudiantes.includes(a.idEstudiante));
    },
    
    calificaciones: async (idCurso) => {
        const cursosIds = getDocenteCursosIds();
        if (!idCurso) {
            const cursosAsignados = MOCK_DB.cursos.filter(c => cursosIds.includes(c.idCurso));
            return MOCK_DB.calificaciones.filter(c => cursosAsignados.some(cur => cur.nombreCurso === c.nombreCurso));
        }
        if (!cursosIds.includes(parseInt(idCurso))) return [];
        return MOCK_DB.calificaciones.filter(c => c.idCurso == idCurso);
    },
    
    crearCalificacion: async (data) => {
        const cursosIds = getDocenteCursosIds();
        if (!cursosIds.includes(parseInt(data.idCurso))) throw new Error('No tienes acceso a este curso');
        
        const cur = MOCK_DB.cursos.find(c => c.idCurso == data.idCurso);
        MOCK_DB.calificaciones.unshift({
            ...data,
            idCalificacion: Date.now(),
            nombreEstudiante: MOCK_DB.estudiantes.find(e => e.idEstudiante == data.idEstudiante)?.nombre || 'Alumno',
            nombreCurso: cur?.nombreCurso || 'S/C',
            descripcion: data.descripcion || data.tipoEvaluacion || 'S/D',
            fechaNota: data.fechaNota || data.fechaRegistro || new Date().toISOString().split('T')[0]
        });
        return true;
    },
    editarCalificacion: async (id, data) => {
        const index = MOCK_DB.calificaciones.findIndex(c => c.idCalificacion === id);
        if (index !== -1) {
            // Actualizamos solo los campos que se envían en 'data'
            MOCK_DB.calificaciones[index] = { ...MOCK_DB.calificaciones[index], ...data };
            return true;
        }
        throw new Error('Calificación no encontrada');
    },
    
    eliminarCalificacion: async (id) => { 
        MOCK_DB.calificaciones = MOCK_DB.calificaciones.filter(c => c.idCalificacion !== id); 
        return true; 
    },
    
    anotaciones: async () => {
        const cursosIds = getDocenteCursosIds();
        const cursosAsignados = MOCK_DB.cursos.filter(c => cursosIds.includes(c.idCurso));
        
        return MOCK_DB.anotaciones.filter(a => {
            const estudiante = MOCK_DB.estudiantes.find(e => e.idEstudiante === a.idEstudiante);
            if (!estudiante) return false;
            return cursosAsignados.some(c => 
                c.nombreCurso === estudiante.nombreCurso || c.asignatura === a.asignatura
            );
        });
    },
    
    crearAnotacion: async (data) => {
        const cursosIds = getDocenteCursosIds();
        const estudiante = MOCK_DB.estudiantes.find(e => e.idEstudiante === data.idEstudiante);
        
        if (estudiante) {
            const tieneAcceso = MOCK_DB.cursos.some(c => 
                cursosIds.includes(c.idCurso) && c.nombreCurso === estudiante.nombreCurso
            );
            if (!tieneAcceso) throw new Error('No tienes acceso a este estudiante');
        }
        
        MOCK_DB.anotaciones.unshift({ 
            ...data, 
            id: Date.now(), 
            fechaRegistro: new Date().toISOString().split('T')[0], 
            nombreDocente: getCurrentUser()?.nombre || 'Docente'
        });
        return true;
    },
    
    materiales: async (idCurso) => {
        const cursosIds = getDocenteCursosIds();
        if (!idCurso) return MOCK_DB.materiales.filter(m => cursosIds.includes(m.idCurso));
        if (!cursosIds.includes(parseInt(idCurso))) return [];
        return MOCK_DB.materiales.filter(m => m.idCurso == idCurso);
    },
    
    subirMaterial: async (formData) => {
        const idCurso = parseInt(formData.get('idCurso'));
        const cursosIds = getDocenteCursosIds();
        if (!cursosIds.includes(idCurso)) throw new Error('No tienes acceso a este curso');
        
        const file = formData.get('file');
        const curso = MOCK_DB.cursos.find(c => c.idCurso === idCurso);
        const extension = file?.name?.split('.')?.pop()?.toUpperCase() || 'PDF';
        
        const reader = new FileReader();
        reader.onload = function() {
            MOCK_DB.materiales.unshift({ 
                idMaterial: Date.now(), 
                titulo: file.name, 
                asignatura: curso?.asignatura || 'General', 
                tipoArchivo: extension, 
                idCurso: idCurso,
                contenido: reader.result
            });
        };
        reader.readAsDataURL(file);
        return true;
    },
    
    eliminarMaterial: async (id) => { 
        MOCK_DB.materiales = MOCK_DB.materiales.filter(m => m.idMaterial !== id); 
        return true; 
    }
};

// ==========================================
// APODERADO API
// ==========================================
const ApoderadoApi = {
    getidEstudiante: () => {
        const user = MOCK_DB.users.find(u => u.token === authToken);
        return user ? user.pupiloId : null;
    },
    dashboard: async () => {
        const id = ApoderadoApi.getidEstudiante();
        const est = MOCK_DB.estudiantes.find(e => e.idEstudiante === id);
        if (!est) return { nombrePupilo: 'No asignado', curso: 'N/A', promedio: '0.0' };
        const notas = MOCK_DB.calificaciones.filter(c => c.idEstudiante === id);
        const promedio = notas.length ? (notas.reduce((acc, c) => acc + parseFloat(c.nota), 0) / notas.length).toFixed(1) : '0.0';
        return { nombrePupilo: est.nombre, curso: est.curso, promedio: promedio };
    },
    calificaciones: async () => MOCK_DB.calificaciones.filter(c => c.idEstudiante === ApoderadoApi.getidEstudiante()),
    asistencia: async () => MOCK_DB.asistencia.filter(a => a.idEstudiante === ApoderadoApi.getidEstudiante()),
    anotaciones: async () => MOCK_DB.anotaciones.filter(a => a.idEstudiante === ApoderadoApi.getidEstudiante()),
    materiales: async () => MOCK_DB.materiales,
    descargarMaterial: (id) => '#',
    // Horario del pupilo para un día de la semana (1=Lunes … 5=Viernes). SOLO DEMO.
    horario: async (diaSemana) => {
        await delay(80);
        return { bloques: MOCK_DB.bloques, clases: MOCK_DB.horarioPupilo[diaSemana] || [] };
    }
};

// Adaptador HTTP: se activa en js/config.js cuando frontend y API están desplegados.
if (window.SIGA_CONFIG?.useBackend) {
    const apiBase = (window.SIGA_CONFIG.apiBase || '').replace(/\/$/, '');
    const request = async (path, options = {}) => {
        const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers };
        if (authToken) headers.Authorization = `Bearer ${authToken}`;
        const response = await fetch(`${apiBase}${path}`, { ...options, headers });
        if (!response.ok) {
            let data = {}; try { data = await response.json(); } catch (_) {}
            throw new Error(data.mensaje || `Error ${response.status}`);
        }
        if (response.status === 204) return true;
        return response.json();
    };
    const query = params => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')).toString();

    AuthApi.login = (identificador, contrasena) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ identificador, contrasena }) });
    AuthApi.logout = () => request('/api/auth/logout', { method: 'POST' });
    AuthApi.me = () => request('/api/auth/me');
    AuthApi.register = data => request('/api/registro', { method: 'POST', body: JSON.stringify({ rut: data.rut, nombre: data.nombre, correo: data.identificador, contrasena: data.contrasena, rol: data.rol }) });

    AdminApi.solicitudes = () => request('/api/registro/pendientes');
    AdminApi.aprobarSolicitud = id => request(`/api/registro/${id}/aprobar`, { method: 'POST' });
    AdminApi.rechazarSolicitud = id => request(`/api/registro/${id}/rechazar`, { method: 'POST' });
    AdminApi.dashboard = () => request('/api/admin/dashboard');
    AdminApi.cursos = AdminApi.obtenerCursos = () => request('/api/admin/cursos');
    AdminApi.docentesCurso = id => request(`/api/admin/cursos/${id}/docentes`);
    AdminApi.estudiantes = idCurso => request(`/api/admin/estudiantes?${query({ idCurso })}`);
    AdminApi.crearCurso = data => request('/api/admin/cursos', { method: 'POST', body: JSON.stringify(data) });
    AdminApi.crearEstudiante = data => request('/api/admin/estudiantes', { method: 'POST', body: JSON.stringify(data) });
    AdminApi.editarEstudiante = (id, data) => request(`/api/admin/estudiantes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    AdminApi.eliminarEstudiante = id => request(`/api/admin/estudiantes/${id}`, { method: 'DELETE' });
    AdminApi.docentes = AdminApi.obtenerDocentes = () => request('/api/admin/docentes');
    AdminApi.crearDocente = AdminApi.agregarDocente = data => request('/api/admin/docentes', { method: 'POST', body: JSON.stringify(data) });
    AdminApi.eliminarDocente = id => request(`/api/admin/docentes/${encodeURIComponent(id)}`, { method: 'DELETE' });
    AdminApi.apoderados = () => request('/api/admin/apoderados');
    AdminApi.crearApoderado = data => request('/api/admin/apoderados', { method: 'POST', body: JSON.stringify(data) });
    AdminApi.alertas = () => request('/api/admin/alertas');
    AdminApi.asistencia = idCurso => request(`/api/admin/asistencia?${query({ idCurso })}`);
    AdminApi.calificaciones = idCurso => request(`/api/admin/calificaciones?${query({ idCurso })}`);

    DocenteApi.cursos = () => request('/api/docente/cursos');
    DocenteApi.dashboard = async () => {
        const cursos = await DocenteApi.cursos();
        const estudiantesPorCurso = await Promise.all(cursos.map(c => DocenteApi.estudiantes(c.idCurso)));
        const idsEstudiantes = new Set(estudiantesPorCurso.flat().map(e => e.idEstudiante));
        const notas = await DocenteApi.calificaciones();
        const promedio = notas.length ? (notas.reduce((total, n) => total + Number(n.nota), 0) / notas.length).toFixed(1) : '0.0';
        return { totalEstudiantes: idsEstudiantes.size, totalClases: cursos.length, promedioGeneral: promedio };
    };
    DocenteApi.estudiantes = idCurso => request(`/api/docente/estudiantes?${query({ idCurso })}`);
    DocenteApi.asistencia = (idCurso, fecha) => request(`/api/docente/asistencia?${query({ idCurso, fecha })}`);
    DocenteApi.asistenciaHoyPorCurso = async idCurso => {
        const fecha = new Date().toISOString().split('T')[0];
        const registros = await DocenteApi.asistencia(idCurso, fecha);
        if (!registros.length) return '0%';
        const presentes = registros.filter(r => r.estado === 'PRESENTE' || r.estado === 'JUSTIFICADO').length;
        return `${Math.round(presentes * 100 / registros.length)}%`;
    };
    DocenteApi.guardarAsistencia = items => request('/api/docente/asistencia', { method: 'POST', body: JSON.stringify(items) });
    DocenteApi.calificaciones = idCurso => request(`/api/docente/calificaciones?${query({ idCurso })}`);
    DocenteApi.promedioPorCurso = async idCurso => {
        const notas = await DocenteApi.calificaciones(idCurso);
        return notas.length ? (notas.reduce((total, n) => total + Number(n.nota), 0) / notas.length).toFixed(1) : '0.0';
    };
    DocenteApi.crearCalificacion = data => request('/api/docente/calificaciones', { method: 'POST', body: JSON.stringify(data) });
    DocenteApi.editarCalificacion = (id, data) => request(`/api/docente/calificaciones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    DocenteApi.eliminarCalificacion = id => request(`/api/docente/calificaciones/${id}`, { method: 'DELETE' });
    DocenteApi.anotaciones = () => request('/api/docente/anotaciones');
    DocenteApi.crearAnotacion = data => request('/api/docente/anotaciones', { method: 'POST', body: JSON.stringify(data) });
    DocenteApi.materiales = idCurso => request(`/api/docente/materiales?${query({ idCurso })}`);
    DocenteApi.subirMaterial = formData => request('/api/docente/materiales', { method: 'POST', body: formData });
    DocenteApi.eliminarMaterial = id => request(`/api/docente/materiales/${id}`, { method: 'DELETE' });

    ApoderadoApi.dashboard = () => request('/api/apoderado/dashboard');
    ApoderadoApi.calificaciones = () => request('/api/apoderado/calificaciones');
    ApoderadoApi.asistencia = () => request('/api/apoderado/asistencia');
    ApoderadoApi.anotaciones = () => request('/api/apoderado/anotaciones');
    ApoderadoApi.materiales = () => request('/api/apoderado/materiales');
}
