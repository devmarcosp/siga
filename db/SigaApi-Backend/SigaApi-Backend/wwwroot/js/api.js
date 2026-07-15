/**
 * CAPA DE DATOS - CONEXION REAL AL BACKEND (SQL Server via API ASP.NET Core)
 * Reemplaza el antiguo MOCK_DB. Ya no hay datos hardcodeados aqui:
 * todo se obtiene por fetch() desde la API.
 */

// Como el frontend ahora vive dentro de wwwroot del mismo proyecto backend,
// no hace falta indicar host ni puerto: la ruta es relativa al mismo origen.
const API_BASE = '/api';

let authToken = localStorage.getItem('siga_token') || '';

function setToken(token) {
    authToken = token || '';
    if (token) localStorage.setItem('siga_token', token);
    else localStorage.removeItem('siga_token');
}

// ==========================================
// CACHE LOCAL (reemplaza las lecturas directas
// que el resto del proyecto hacia a MOCK_DB.xxx)
// ==========================================
const AppCache = {
    cursos: [],
    estudiantes: [],
    asistencia: [],
    calificaciones: [],
    materiales: [],
    users: [] // combinacion de Docentes + Apoderados + Administrador, solo para lecturas rapidas en pantalla
};

// ==========================================
// HELPER GENERICO DE FETCH
// ==========================================
async function http(path, options = {}) {
    const headers = options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' };

    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
    });

    if (res.status === 204) return true;

    let data = null;
    try { data = await res.json(); } catch (_) { /* respuesta sin cuerpo */ }

    if (!res.ok) {
        const msg = (data && data.mensaje) || (data && data.title) || 'Error de conexion con el servidor';
        throw new Error(msg);
    }
    return data;
}

const get = (path) => http(path, { method: 'GET' });
const post = (path, body) => http(path, { method: 'POST', body: JSON.stringify(body) });
const put = (path, body) => http(path, { method: 'PUT', body: JSON.stringify(body) });
const del = (path) => http(path, { method: 'DELETE' });

// ==========================================
// PRECARGA DE CACHE SEGUN ROL
// Se ejecuta una vez despues del login para que las
// lecturas sincronas (AppCache.xxx.find(...)) tengan datos.
// ==========================================
async function precargarCache(rol) {
    try {
        if (rol === 'ADMIN') {
            const [cursos, estudiantes, docentes, apoderados] = await Promise.all([
                get('/admin/cursos'),
                get('/admin/estudiantes'),
                get('/admin/docentes'),
                get('/admin/apoderados')
            ]);
            AppCache.cursos = cursos;
            AppCache.estudiantes = estudiantes;
            AppCache.users = [...docentes, ...apoderados];
        }
        if (rol === 'DOCENTE') {
            const [cursos, estudiantes] = await Promise.all([
                get('/docente/cursos'),
                get('/docente/estudiantes')
            ]);
            AppCache.cursos = cursos;
            AppCache.estudiantes = estudiantes;
        }
        if (rol === 'APODERADO') {
            const [materiales] = await Promise.all([get('/apoderado/materiales')]);
            AppCache.materiales = materiales;
        }
    } catch (e) {
        console.warn('No se pudo precargar el cache inicial:', e.message);
    }
}

// ==========================================
// AUTH API
// ==========================================
const AuthApi = {
    login: async (identificador, contrasena) => {
        const user = await post('/auth/login', { identificador, contrasena });
        setToken(user.token);
        await precargarCache(user.rol);
        return user;
    },
    logout: async () => {
        try { await post('/auth/logout', {}); } catch (_) {}
        return true;
    },
    me: async () => get('/auth/me')
};

// ==========================================
// ADMIN API
// ==========================================
const AdminApi = {
    dashboard: () => get('/admin/dashboard'),
    cursos: async () => { const d = await get('/admin/cursos'); AppCache.cursos = d; return d; },
    docentesCurso: (idCurso) => get(`/admin/cursos/${idCurso}/docentes`),
    estudiantes: async (idCurso) => {
        const d = await get(idCurso ? `/admin/estudiantes?idCurso=${idCurso}` : '/admin/estudiantes');
        AppCache.estudiantes = d;
        return d;
    },
    alertas: () => get('/admin/alertas'),
    asistencia: async (idCurso) => {
        const d = await get(idCurso ? `/admin/asistencia?idCurso=${idCurso}` : '/admin/asistencia');
        AppCache.asistencia = d;
        return d;
    },
    calificaciones: async (idCurso) => {
        const d = await get(idCurso ? `/admin/calificaciones?idCurso=${idCurso}` : '/admin/calificaciones');
        AppCache.calificaciones = d;
        return d;
    },
    docentes: () => get('/admin/docentes'),
    crearDocente: (data) => post('/admin/docentes', data),
    editarDocente: (identificador, data) => put(`/admin/docentes/${encodeURIComponent(identificador)}`, data),
    eliminarDocente: (identificador) => del(`/admin/docentes/${encodeURIComponent(identificador)}`),

    crearEstudiante: (data) => post('/admin/estudiantes', data),
    editarEstudiante: (idEstudiante, data) => put(`/admin/estudiantes/${idEstudiante}`, data),
    eliminarEstudiante: (idEstudiante) => del(`/admin/estudiantes/${idEstudiante}`),

    crearCurso: (data) => post('/admin/cursos', data),

    apoderados: () => get('/admin/apoderados'),
    crearApoderado: (data) => post('/admin/apoderados', data),
    editarApoderado: (identificador, data) => put(`/admin/apoderados/${encodeURIComponent(identificador)}`, data),
    eliminarApoderado: (identificador) => del(`/admin/apoderados/${encodeURIComponent(identificador)}`),

    obtenerDocentes: () => get('/admin/docentes'),
    obtenerCursos: () => get('/admin/cursos'),
    agregarDocente: (docente) => post('/admin/docentes', docente)
};

// ==========================================
// DOCENTE API
// ==========================================
const DocenteApi = {
    dashboard: () => get('/docente/dashboard'),
    asistenciaHoyPorCurso: (idCurso) => get(`/docente/asistencia-hoy?idCurso=${idCurso}`),
    promedioPorCurso: (idCurso) => get(`/docente/promedio?idCurso=${idCurso}`),
    cursos: async () => { const d = await get('/docente/cursos'); AppCache.cursos = d; return d; },
    estudiantes: async (idCurso) => {
        const d = await get(idCurso ? `/docente/estudiantes?idCurso=${idCurso}` : '/docente/estudiantes');
        AppCache.estudiantes = d;
        return d;
    },
    asistencia: (idCurso, fecha) => get(`/docente/asistencia?idCurso=${idCurso}&fecha=${fecha}`),
    guardarAsistencia: (items) => post('/docente/asistencia', items),
    asistenciaHistorica: async (idCurso) => {
        const d = await get(`/docente/asistencia-historica?idCurso=${idCurso}`);
        AppCache.asistencia = d;
        return d;
    },
    calificaciones: async (idCurso) => {
        const d = await get(idCurso ? `/docente/calificaciones?idCurso=${idCurso}` : '/docente/calificaciones');
        AppCache.calificaciones = d;
        return d;
    },
    crearCalificacion: (data) => post('/docente/calificaciones', data),
    editarCalificacion: (id, data) => put(`/docente/calificaciones/${id}`, data),
    eliminarCalificacion: (id) => del(`/docente/calificaciones/${id}`),

    anotaciones: () => get('/docente/anotaciones'),
    crearAnotacion: (data) => post('/docente/anotaciones', data),

    materiales: async (idCurso) => {
        const d = await get(idCurso ? `/docente/materiales?idCurso=${idCurso}` : '/docente/materiales');
        AppCache.materiales = d;
        return d;
    },
    subirMaterial: (formData) => http('/docente/materiales', { method: 'POST', body: formData }),
    eliminarMaterial: (id) => del(`/docente/materiales/${id}`)
};

// ==========================================
// APODERADO API
// ==========================================
const ApoderadoApi = {
    dashboard: () => get('/apoderado/dashboard'),
    calificaciones: () => get('/apoderado/calificaciones'),
    asistencia: () => get('/apoderado/asistencia'),
    anotaciones: () => get('/apoderado/anotaciones'),
    materiales: async () => { const d = await get('/apoderado/materiales'); AppCache.materiales = d; return d; },
    descargarMaterial: (id) => `${API_BASE}/apoderado/materiales/${id}/descargar`
};
