let currentUser = null;
let currentView = 'dashboard';
let cacheCursos = [];
function todayStr() { return new Date().toISOString().split('T')[0]; }
function roleLabel(rol) { return { ADMIN: 'Administrador(a)', DOCENTE: 'Profesor(a)', APODERADO: 'Apoderado(a)' }[rol] || rol; }
function escapeHtml(value) { const node = document.createElement('div'); node.textContent = String(value ?? ''); return node.innerHTML; }
function toast(msg) {
    const t = document.getElementById('toast');
    if (t) { t.textContent = msg; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 2500); }
}
function closeModal() { const m = document.getElementById('modal'); if(m) m.classList.add('hidden'); }
function openSidebar() {
    document.getElementById('sidebar').classList.remove('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.remove('hidden');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.add('hidden');
}
function showLanding() {
    document.getElementById('loginScreen')?.classList.add('hidden');
    document.getElementById('landingPage')?.classList.remove('hidden');
}
function openLogin() {
    document.getElementById('landingPage')?.classList.add('hidden');
    document.getElementById('loginScreen')?.classList.remove('hidden');
    document.getElementById('loginUser')?.focus();
}
function openRegister() {
    document.getElementById('modalContent').innerHTML = `
        <form class="p-6" onsubmit="submitRegistration(event)">
            <div class="flex items-start justify-between mb-6"><div><h3 class="text-xl font-bold text-slate-900">Solicitar una cuenta</h3><p class="text-sm text-slate-500 mt-1">Un administrador revisará la solicitud antes de habilitar el acceso.</p></div><button type="button" onclick="closeModal()" class="text-2xl text-slate-400">&times;</button></div>
            <div class="grid sm:grid-cols-2 gap-4">
                <label class="text-sm font-semibold text-slate-700">Nombre completo<input id="regName" required maxlength="150" class="mt-1 w-full px-3 py-2.5 border rounded-lg font-normal" autocomplete="name"></label>
                <label class="text-sm font-semibold text-slate-700">RUT<input id="regRut" required maxlength="12" class="mt-1 w-full px-3 py-2.5 border rounded-lg font-normal" placeholder="12.345.678-9"></label>
                <label class="text-sm font-semibold text-slate-700 sm:col-span-2">Correo electrónico<input id="regEmail" required type="email" class="mt-1 w-full px-3 py-2.5 border rounded-lg font-normal" autocomplete="email"></label>
                <label class="text-sm font-semibold text-slate-700">Tipo de cuenta<select id="regRole" required class="mt-1 w-full px-3 py-2.5 border rounded-lg bg-white font-normal"><option value="APODERADO">Apoderado/a</option><option value="DOCENTE">Docente</option></select></label>
                <label class="text-sm font-semibold text-slate-700">Contraseña<input id="regPassword" required type="password" minlength="8" class="mt-1 w-full px-3 py-2.5 border rounded-lg font-normal" autocomplete="new-password"></label>
            </div>
            <label class="flex gap-2 mt-5 text-xs text-slate-500"><input required type="checkbox"> Confirmo que los datos entregados son correctos.</label>
            <div id="registerError" class="hidden mt-4 text-sm text-rose-600"></div>
            <button class="btn-primary w-full mt-5 py-3 rounded-lg font-semibold">Enviar solicitud</button>
        </form>`;
    document.getElementById('modal').classList.remove('hidden');
}
async function submitRegistration(event) {
    event.preventDefault();
    const error = document.getElementById('registerError');
    try {
        await AuthApi.register({
            nombre: document.getElementById('regName').value,
            rut: document.getElementById('regRut').value,
            identificador: document.getElementById('regEmail').value,
            rol: document.getElementById('regRole').value,
            contrasena: document.getElementById('regPassword').value
        });
        closeModal(); toast('Solicitud enviada. Debe ser aprobada por un administrador.');
    } catch (e) { error.textContent = e.message; error.classList.remove('hidden'); }
}
function statCard(icon, label, value, colorClass) {
    return `<div class="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 stat-card"> <div class="w-12 h-12 ${colorClass} text-white rounded-lg flex items-center justify-center text-2xl">${icon}</div> <div><div class="text-xs text-slate-500 uppercase tracking-wide font-semibold">${label}</div> <div class="text-2xl font-bold text-slate-900">${value}</div></div></div>`;
}
async function doLogin() {
    const identificador = document.getElementById('loginUser').value.trim();
    const contrasena = document.getElementById('loginPass').value.trim();
    const err = document.getElementById('loginError');
    err.classList.add('hidden');
    try {
        const user = await AuthApi.login(identificador, contrasena);
        setToken(user.token);
        currentUser = user;
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('app').classList.add('flex');
        await initApp();
    } catch (e) {
        err.textContent = e.message || 'Credenciales inválidas';
        err.classList.remove('hidden');
    }
}
async function logout() {
    try { await AuthApi.logout(); } catch (_) {}
    setToken('');
    currentUser = null;
    document.getElementById('app').classList.add('hidden');
    showLanding();
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
}
async function initApp() {
    document.getElementById('userName').textContent = currentUser.nombre;
    document.getElementById('userRole').textContent = roleLabel(currentUser.rol);
    const initials = currentUser.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const avatar = document.getElementById('userAvatar');
    avatar.textContent = initials;
    if (currentUser.rol === 'ADMIN') avatar.className ="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-indigo-500 text-white";
    if (currentUser.rol === 'DOCENTE') avatar.className = "w-10 h-10 rounded-full flex items-center justify-center font-bold bg-emerald-500 text-white";
    if (currentUser.rol === 'APODERADO') avatar.className = "w-10 h-10 rounded-full flex items-center justify-center font-bold bg-amber-500 text-white";
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (currentUser.rol === 'DOCENTE') cacheCursos = await DocenteApi.cursos();
    if (currentUser.rol === 'ADMIN') cacheCursos = await AdminApi.cursos();
    buildNav();
    navigate('dashboard');
}
function buildNav() {
    const menus = {
        ADMIN: [ { id: 'dashboard', icon: '📊', label: 'Panel Principal' }, { id: 'solicitudes', icon: '🕓', label: 'Solicitudes' }, { id: 'cursos', icon: '📚', label: 'Cursos' }, { id: 'docentes', icon: '👨‍🏫', label: 'Docentes' }, { id: 'estudiantes', icon: '👥', label: 'Alumnos' }, { id: 'apoderados', icon: '👨‍👧', label: 'Apoderados' }, { id: 'alertas', icon: '⚠️', label: 'Alertas' } ],
        DOCENTE: [ { id: 'dashboard', icon: '📊', label: 'Panel Principal' }, { id: 'attendance', icon: '✅', label: 'Asistencia' }, { id: 'grades', icon: '📝', label: 'Calificaciones' }, { id: 'anotaciones', icon: '📋', label: 'Anotaciones' }, { id: 'materials', icon: '📚', label: 'Materiales' }, { id: 'students', icon: '👥', label: 'Alumnos' } ],
        APODERADO: [ { id: 'dashboard', icon: '📊', label: 'Panel Principal' }, { id: 'attendance', icon: '✅', label: 'Asistencia Pupilo' }, { id: 'grades', icon: '📝', label: 'Calificaciones' }, { id: 'anotaciones', icon: '📋', label: 'Anotaciones' }, { id: 'materials', icon: '📚', label: 'Materiales' } ]
    };
    const items = menus[currentUser.rol] || [];
    const navHtml = items.map(it =>
        `<button onclick="navigate('${it.id}')" data-nav="${it.id}" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition text-slate-400 font-medium"> <span class="text-lg opacity-90">${it.icon}</span><span>${it.label}</span> </button>`
    ).join('');
    document.getElementById('navMenu').innerHTML = navHtml;
    const mobileNav = document.getElementById('navMenuMobile');
    if(mobileNav) mobileNav.innerHTML = navHtml;
}
function navigate(view) {
    currentView = view;
    document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('nav-active', b.dataset.nav === view));
    closeSidebar();
    render();
}
async function render() {
    const c = document.getElementById('content');
    c.innerHTML = '<div class="flex items-center justify-center h-64"> <div class="animate-spin text-2xl text-indigo-600">⟳</div> </div>';
    const key = `${currentUser.rol}_${currentView}`;
    const renderers = {
        ADMIN_dashboard: renderAdminDashboard, ADMIN_solicitudes: renderAdminSolicitudes, ADMIN_cursos: renderAdminCursos, ADMIN_docentes: renderAdminDocentes, ADMIN_estudiantes: renderAdminEstudiantes, ADMIN_apoderados: renderAdminApoderados, ADMIN_alertas: renderAdminAlertas,
        DOCENTE_dashboard: renderDocenteDashboard, DOCENTE_attendance: renderDocenteAttendance, DOCENTE_grades: renderDocenteGrades, DOCENTE_anotaciones: renderDocenteAnotaciones, DOCENTE_materials: renderDocenteMaterials, DOCENTE_students: renderDocenteStudents,
        APODERADO_dashboard: renderApoderadoDashboard, APODERADO_attendance: renderApoderadoAttendance, APODERADO_grades: renderApoderadoGrades, APODERADO_anotaciones: renderApoderadoAnotaciones, APODERADO_materials: renderApoderadoMaterials
    };
    try { await (renderers[key] || renderAdminDashboard)(); }
    catch (e) { c.innerHTML = `<div class="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700 text-center">${e.message}</div>`; }
}

// --- ADMIN RENDERS ---
async function renderAdminDashboard() {
    document.getElementById('pageTitle').textContent = 'Panel Administrativo';
    document.getElementById('pageSubtitle').textContent = 'Visión general del establecimiento';
    const d = await AdminApi.dashboard();
    document.getElementById('content').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"> ${statCard('👥', 'Total Alumnos', d.totalEstudiantes, 'bg-blue-500')} ${statCard('📚', 'Cursos Activos', d.totalCursos, 'bg-purple-500')} ${statCard('✅', 'Asistencia Hoy', d.asistenciasHoy, 'bg-emerald-500')} ${statCard('📝', 'Promedio Gral.', d.promedioGeneral, 'bg-orange-500')} </div> <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"> <h3 class="font-bold text-gray-900 mb-4">Accesos Rápidos</h3> <div class="grid grid-cols-1 md:grid-cols-3 gap-3"> <button onclick="navigate('cursos')" class="p-4 bg-blue-50 hover:bg-blue-100/70 rounded-lg text-left border border-blue-100 transition"><div class="text-2xl mb-2">📚</div><div class="font-semibold text-sm text-blue-900">Gestión Cursos</div></button> <button onclick="navigate('estudiantes')" class="p-4 bg-purple-50 hover:bg-purple-100/70 rounded-lg text-left border border-purple-100 transition"><div class="text-2xl mb-2">👥</div><div class="font-semibold text-sm text-purple-900">Matrícula</div></button> <button onclick="navigate('alertas')" class="p-4 bg-amber-50 hover:bg-amber-100/70 rounded-lg text-left border border-amber-100 transition"><div class="text-2xl mb-2">⚠️</div><div class="font-semibold text-sm text-amber-900">Semáforo Riesgo</div></button> </div> </div>`;
}

async function renderAdminSolicitudes() {
    document.getElementById('pageTitle').textContent = 'Solicitudes de acceso';
    document.getElementById('pageSubtitle').textContent = 'Revisión y aprobación de cuentas nuevas';
    const items = await AdminApi.solicitudes();
    document.getElementById('content').innerHTML = `<div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="p-5 border-b"><h3 class="font-bold">Solicitudes pendientes</h3><p class="text-sm text-slate-500">Verifica la identidad y el rol antes de aprobar.</p></div>
        ${items.length ? `<div class="divide-y">${items.map(s => `<div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div class="font-semibold text-slate-900">${escapeHtml(s.nombre)}</div><div class="text-sm text-slate-500">${escapeHtml(s.identificador)} · ${escapeHtml(s.rut)}</div><span class="inline-block mt-2 px-2 py-1 text-xs font-bold rounded bg-amber-50 text-amber-700">${escapeHtml(roleLabel(s.rol))} · Pendiente</span></div><div class="flex gap-2"><button onclick="approveRequest(${Number(s.id)})" class="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">Aprobar</button><button onclick="rejectRequest(${Number(s.id)})" class="px-4 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm font-semibold">Rechazar</button></div></div>`).join('')}</div>` : `<div class="p-10 text-center text-slate-400">No hay solicitudes pendientes.</div>`}
    </div>`;
}
async function approveRequest(id) { await AdminApi.aprobarSolicitud(id); toast('Cuenta aprobada y habilitada.'); renderAdminSolicitudes(); }
async function rejectRequest(id) { await AdminApi.rechazarSolicitud(id); toast('Solicitud rechazada.'); renderAdminSolicitudes(); }

async function renderAdminCursos() {
    document.getElementById('pageTitle').textContent = 'Gestión de Cursos';
    document.getElementById('pageSubtitle').textContent = 'Cursos, docentes guía y alumnos';
    const cursos = await AdminApi.cursos();
    
    // Agregar botón de agregar curso
    let html = `
    <div class="flex justify-between items-center mb-6">
        <div>
            <h3 class="font-bold text-gray-900 text-lg">Listado de Cursos</h3>
            <p class="text-sm text-gray-500">Administra los cursos del establecimiento</p>
        </div>
        <button onclick="openCursoModal()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition flex items-center gap-2">
            <span>+</span> Agregar Nuevo Curso
        </button>
    </div>
    <div class="space-y-4">`;
    
    for (const c of cursos) {
        const docentes = await AdminApi.docentesCurso(c.idCurso);
        html += `
        <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1 cursor-pointer" onclick="toggleCourseDetails(${c.idCurso})">
                    <h3 class="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <span id="icon-${c.idCurso}" class="transition-transform duration-200 inline-block text-xs text-gray-500">▶</span>
                        ${c.nombreCurso}
                    </h3>
                    <p class="text-sm text-gray-500 ml-6">${c.nivel} · Paralelo ${c.paralelo} · ${c.anioEscolar}</p>
                </div>
                <div class="flex gap-2 ml-4">
                    <button onclick="exportarCursoAExcel(${c.idCurso}, '${c.nombreCurso}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5" title="Exportar asistencia y notas a Excel">
                        <span>📊</span> Exportar
                    </button>
                    <span class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 flex items-center">${c.totalEstudiantes} Alumnos</span>
                </div>
            </div>
            <div class="text-sm font-semibold text-gray-600 mb-2 ml-6">Equipo Docente</div>
            <div class="ml-6 mb-4">
                ${docentes.length ? 
                    `<div class="flex flex-wrap gap-2">${docentes.map(d => `<span class="chip px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 shadow-sm"><strong class="text-indigo-600">${d.asignatura}:</strong> ${d.nombreDocente}</span>`).join('')}</div>` 
                    : '<p class="text-sm text-gray-400 italic">Sin docentes asignados</p>'}
            </div>
            <div id="details-${c.idCurso}" class="hidden mt-4 border-t border-gray-100 pt-4 ml-6">
                <!-- Grid de tarjetas: Estudiantes + Botones de acción -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h5 class="font-bold text-gray-700 mb-2 text-sm uppercase">Estudiantes</h5>
                        <div id="students-${c.idCurso}" class="text-sm text-gray-600 space-y-1">Cargando...</div>
                    </div>
                
                    <!-- Botón Asistencia -->
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                        <div>
                            <h5 class="font-bold text-gray-700 mb-2 text-sm uppercase">Asistencia</h5>
                            <p class="text-xs text-gray-500 mb-3">Visualiza y gestiona la asistencia por día para cada alumno.</p>
                        </div>
                        <button onclick="toggleAttendanceDetails(${c.idCurso})" class="w-full btn-primary text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition">
                            📅 Ver Detalle de Asistencia
                        </button>
                    </div>
                
                    <!-- Botón Calificaciones -->
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
                        <div>
                            <h5 class="font-bold text-gray-700 mb-2 text-sm uppercase">Calificaciones</h5>
                            <p class="text-xs text-gray-500 mb-3">Revisa todas las notas de los alumnos filtradas por asignatura.</p>
                        </div>
                        <button onclick="toggleGradesDetails(${c.idCurso})" class="w-full btn-primary text-white py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition">
                            📝 Ver Detalle de Notas
                        </button>
                    </div>
                </div>

                <!-- Contenedor oculto para Asistencia -->
                <div id="att-details-${c.idCurso}" class="hidden mt-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm fade-in">
                    <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                        <h5 class="font-bold text-gray-800 text-base">📅 Gestión de Asistencia por Estudiante</h5>
                        <button onclick="toggleAttendanceDetails(${c.idCurso})" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                    </div>
                    <div id="att-content-${c.idCurso}" class="space-y-4">Cargando asistencia...</div>
                </div>

                <!-- Contenedor oculto para Calificaciones -->
                <div id="grades-details-${c.idCurso}" class="hidden mt-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm fade-in">
                    <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                        <h5 class="font-bold text-gray-800 text-base"> Detalle de Calificaciones por Asignatura</h5>
                        <button onclick="toggleGradesDetails(${c.idCurso})" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                    </div>
                    <div id="grades-content-${c.idCurso}" class="space-y-4">Cargando calificaciones...</div>
                </div>
            </div>
        </div>`;
    }
    document.getElementById('content').innerHTML = html + '</div>';
}
// ==========================================
// VISTA: GESTIÓN DE DOCENTES (ACTUALIZADA)
// ==========================================
async function renderAdminDocentes() {
    if(document.getElementById('pageTitle')) {
        document.getElementById('pageTitle').textContent = 'Gestión de Personal Docente';
    }
    
    const docentes = await AdminApi.obtenerDocentes();
    const cursos = await AdminApi.obtenerCursos();

    const cursosMap = {};
    cursos.forEach(c => {
        cursosMap[c.idCurso] = c.nombreCurso;
    });

    let html = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <p class="text-sm text-gray-500">Administra las credenciales de acceso y asignaciones académicas del profesorado.</p>
            </div>
            <button onclick="abrirModalCrearDocente()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2">
                <span>➕</span> Agregar Docente
            </button>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th class="p-4">Nombre Docente</th>
                            <th class="p-4">Correo / Usuario</th>
                            <th class="p-4">Cursos Asignados</th>
                            <th class="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm text-slate-700">
    `;

    if (docentes.length === 0) {
        html += `<tr><td colspan="4" class="p-8 text-center text-gray-400 italic">No hay docentes registrados en el sistema.</td></tr>`;
    } else {
        docentes.forEach(d => {
            const chipsCursos = d.cursosAsignados && d.cursosAsignados.length > 0
                ? d.cursosAsignados.map(id => `
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 mr-1 mb-1 shadow-2xs">
                        ${cursosMap[id] || `Curso ID: ${id}`}
                    </span>
                  `).join('')
                : '<span class="text-xs text-gray-400 italic">Sin cursos asignados</span>';

            html += `
                <tr class="hover:bg-slate-50/80 transition">
                    <td class="p-4 font-semibold text-slate-900">${d.nombre}</td>
                    <td class="p-4 text-slate-500 font-mono text-xs">${d.identificador}</td>
                    <td class="p-4">${chipsCursos}</td>
                    <td class="p-4 text-center space-x-3">
                        <button onclick="openEditDocenteModal('${d.identificador}')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">✏️ Editar</button>
                        <button onclick="deleteDocente('${d.identificador}')" class="text-xs font-bold text-rose-600 hover:text-rose-800 transition">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('content').innerHTML = html;
}
function openDocenteModal() {
    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `
    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-gray-900 text-lg">Registrar Nuevo Docente</h3>
        <button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button>
    </div>
    <form id="formDocente" onsubmit="saveDocente(event)" class="p-6 space-y-4">
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
            <input type="text" id="modalDocNombre" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: María González Pérez"/>
        </div>
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Institucional</label>
            <input type="email" id="modalDocCorreo" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: m.gonzalez@edu.cl"/>
        </div>
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña Inicial</label>
            <input type="text" id="modalDocPass" required value="1234" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            <p class="text-xs text-gray-400 mt-1">El docente podrá cambiarla después de iniciar sesión</p>
        </div>
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cursos Asignados</label>
            <div class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                ${MOCK_DB.cursos.map(c => `
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" value="${c.idCurso}" class="modalDocCursos rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                        <span class="text-sm text-gray-700">${c.nombreCurso}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="pt-4 flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm font-medium text-white">Registrar Docente</button>
        </div>
    </form>
    `;
    m.classList.remove('hidden');
}

async function saveDocente(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('modalDocNombre').value.trim();
    const correo = document.getElementById('modalDocCorreo').value.trim();
    const pass = document.getElementById('modalDocPass').value.trim();
    
    const cursosSeleccionados = Array.from(document.querySelectorAll('.modalDocCursos:checked')).map(cb => parseInt(cb.value));
    
    // Validar que el correo no exista
    if (MOCK_DB.users.find(u => u.identificador === correo)) {
        toast('❌ Ya existe un usuario con ese correo');
        return;
    }
    
    await AdminApi.crearDocente({
        nombre,
        identificador: correo,
        contrasena: pass,
        cursosAsignados: cursosSeleccionados
    });
    
    closeModal();
    toast('✅ Docente registrado exitosamente');
    await renderAdminDocentes();
}

async function deleteDocente(identificador) {
    if (confirm('¿Seguro que desea eliminar este docente?')) {
        await AdminApi.eliminarDocente(identificador);
        toast('Docente eliminado');
        await renderAdminDocentes();
    }
}

function toggleCourseDetails(idCurso) {
    const details = document.getElementById(`details-${idCurso}`);
    const icon = document.getElementById(`icon-${idCurso}`);
    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        icon.style.transform = 'rotate(90deg)';
        loadCourseDetails(idCurso);
    } else {
        details.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
}

async function loadCourseDetails(idCurso) {
    const estudiantes = await AdminApi.estudiantes(idCurso);
    const studentsContainer = document.getElementById(`students-${idCurso}`);
    if (estudiantes.length) {
        studentsContainer.innerHTML = estudiantes.map(e => `<div class="flex justify-between"><span>${e.nombre}</span><span class="text-xs text-gray-400">${e.rut}</span></div>`).join('');
    } else {
        studentsContainer.innerHTML = '<p class="text-xs italic text-gray-400">Sin alumnos</p>';
    }

    const today = new Date().toISOString().split('T')[0];
    const asistencia = await DocenteApi.asistencia(idCurso, today);
    const attContainer = document.getElementById(`attendance-${idCurso}`);
    if (asistencia.length) {
        attContainer.innerHTML = asistencia.map(a => `<div class="flex justify-between"><span>${a.nombre}</span><span class="text-xs font-bold ${a.estado === 'PRESENTE' ? 'text-emerald-600' : a.estado === 'AUSENTE' ? 'text-rose-600' : 'text-amber-600'}">${a.estado || 'Sin registro'}</span></div>`).join('');
    } else {
        attContainer.innerHTML = '<p class="text-xs italic text-gray-400">Sin registros de asistencia</p>';
    }

    const calificaciones = await DocenteApi.calificaciones(idCurso);
    const gradesContainer = document.getElementById(`grades-${idCurso}`);
    if (calificaciones.length) {
        gradesContainer.innerHTML = calificaciones.map(g => `<div class="flex justify-between"><span>${g.nombreEstudiante}</span><span class="text-xs font-bold ${parseFloat(g.nota) >= 4 ? 'text-emerald-600' : 'text-rose-600'}">${parseFloat(g.nota).toFixed(1)}</span></div>`).join('');
    } else {
        gradesContainer.innerHTML = '<p class="text-xs italic text-gray-400">Sin calificaciones</p>';
    }
}
// ==========================================
// DESGLOSE DE ASISTENCIA (SOLO LECTURA)
// ==========================================
function toggleAttendanceDetails(idCurso) {
    const details = document.getElementById(`att-details-${idCurso}`);
    details.classList.toggle('hidden');
    if (!details.classList.contains('hidden')) {
        loadAttendanceDetails(idCurso);
    }
}

async function loadAttendanceDetails(idCurso) {
    const container = document.getElementById(`att-content-${idCurso}`);
    const estudiantes = await AdminApi.estudiantes(idCurso);
    
    if (!estudiantes.length) {
        container.innerHTML = '<p class="text-sm text-gray-400 italic">No hay estudiantes en este curso.</p>';
        return;
    }

    const today = todayStr();

    let html = '';
    estudiantes.forEach(e => {
        html += `
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        ${e.nombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <span class="font-semibold text-gray-800 text-sm">${e.nombre}</span>
                    <span class="text-xs text-gray-400">${e.rut}</span>
                </div>
                <div class="flex items-center gap-3">
                    <label class="text-xs font-bold text-gray-500 uppercase">📅 Ver día:</label>
                    
                    <!-- Calendario nativo (Solo para consultar) -->
                    <input 
                        type="date" 
                        id="att-date-${idCurso}-${e.idEstudiante}" 
                        value="${today}"
                        onchange="updateAttStatus(${idCurso}, ${e.idEstudiante})" 
                        class="px-2 py-1 border border-gray-300 rounded text-xs focus:border-indigo-500 outline-none bg-white cursor-pointer"
                    />
                    
                    <!-- Badge de Estado (Solo lectura, se actualiza dinámicamente) -->
                    <span id="att-status-${idCurso}-${e.idEstudiante}" class="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                        Cargando...
                    </span>
                </div>
            </div>
            <!-- Observación -->
            <div id="att-obs-${idCurso}-${e.idEstudiante}" class="text-xs text-gray-500 italic pl-10 mt-1">Seleccione un día para ver el estado.</div>
        </div>`;
    });
    container.innerHTML = html;

    // Cargar estado inicial para la fecha de hoy
    estudiantes.forEach(e => updateAttStatus(idCurso, e.idEstudiante));
}

function updateAttStatus(idCurso, idEstudiante) {
    const fecha = document.getElementById(`att-date-${idCurso}-${idEstudiante}`).value;
    const statusBadge = document.getElementById(`att-status-${idCurso}-${idEstudiante}`);
    const obsDiv = document.getElementById(`att-obs-${idCurso}-${idEstudiante}`);
    
    // Buscar el registro en la base de datos simulada
    const registro = MOCK_DB.asistencia.find(a => a.idEstudiante === idEstudiante && a.fecha === fecha);
    
    if (registro && registro.estado) {
        const estado = registro.estado.toUpperCase();
        let badgeClass = '';
        let icon = '❓';

        // Asignar colores y iconos según el estado
        if (estado === 'PRESENTE') {
            badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            icon = '✅';
        } else if (estado === 'AUSENTE') {
            badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
            icon = '❌';
        } else if (estado === 'TARDANZA') {
            badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
            icon = '⏰';
        }

        // Actualizar el badge visual
        statusBadge.className = `px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass}`;
        statusBadge.textContent = `${icon} ${estado}`;

        // Actualizar observación
        obsDiv.textContent = registro.observacion ? `📝 Obs: ${registro.observacion}` : 'Sin observaciones registradas.';
        obsDiv.classList.remove('text-gray-400');
        obsDiv.classList.add('text-gray-600');
    } else {
        // Si no hay registro para esa fecha
        statusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-400 border border-gray-200';
        statusBadge.textContent = 'Sin registro';
        
        obsDiv.textContent = 'No se ha tomado asistencia en esta fecha.';
        obsDiv.classList.add('text-gray-400');
        obsDiv.classList.remove('text-gray-600');
    }
}

// ❌ Ya no necesitas la función `saveAttStatus`, fue eliminada


// ==========================================
// DESGLOSE DE CALIFICACIONES
// ==========================================
function toggleGradesDetails(idCurso) {
    const details = document.getElementById(`grades-details-${idCurso}`);
    details.classList.toggle('hidden');
    if (!details.classList.contains('hidden')) {
        loadGradesDetails(idCurso);
    }
}

async function loadGradesDetails(idCurso) {
    const container = document.getElementById(`grades-content-${idCurso}`);
    const estudiantes = await AdminApi.estudiantes(idCurso);
    
    if (!estudiantes.length) {
        container.innerHTML = '<p class="text-sm text-gray-400 italic">No hay estudiantes en este curso.</p>';
        return;
    }
    
    // Obtener todas las calificaciones del curso
    const todasNotas = await AdminApi.calificaciones(idCurso);
    
    let html = '';
    let estudiantesConNotas = 0;
    
    // Mostrar TODOS los estudiantes del curso, tengan o no calificaciones
    estudiantes.forEach(e => {
        const notasAlumno = todasNotas.filter(n => n.idEstudiante === e.idEstudiante);
        
        // Calcular promedio (si tiene notas)
        let promedioHtml = '';
        if (notasAlumno.length > 0) {
            const promedio = notasAlumno.reduce((acc, n) => acc + parseFloat(n.nota), 0) / notasAlumno.length;
            const colorProm = promedio >= 4.0 ? 'text-emerald-700' : 'text-rose-700';
            promedioHtml = `
                <div class="text-right">
                    <div class="text-xs text-gray-500 uppercase font-bold">Promedio</div>
                    <div class="text-lg font-bold ${colorProm}">${promedio.toFixed(1)}</div>
                </div>
            `;
            estudiantesConNotas++;
        } else {
            promedioHtml = `
                <div class="text-right">
                    <div class="text-xs text-gray-500 uppercase font-bold">Promedio</div>
                    <div class="text-lg font-bold text-gray-400">—</div>
                </div>
            `;
        }
        
        // Lista de notas o mensaje si no tiene
        let notasHtml = '';
        if (notasAlumno.length > 0) {
            notasHtml = `
                <div class="space-y-2 pl-10">
                    ${notasAlumno.map(n => {
                        const notaNum = parseFloat(n.nota);
                        const color = notaNum >= 4.0 ? 'text-emerald-600' : 'text-rose-600';
                        const bg = notaNum >= 4.0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100';
                        return `
                        <div class="flex justify-between items-center p-2 rounded border ${bg}">
                            <div>
                                <div class="text-xs font-bold text-gray-700">${n.descripcion || n.tipoEvaluacion || 'Sin descripción'}</div>
                                <div class="text-[10px] text-gray-400">${n.fechaNota || n.fechaRegistro || 'Sin fecha'}</div>
                                ${n.asignatura ? `<div class="text-[10px] text-indigo-500 font-medium">${n.asignatura}</div>` : ''}
                            </div>
                            <div class="text-lg font-bold ${color}">${notaNum.toFixed(1)}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            notasHtml = `
                <div class="pl-10 py-3">
                    <p class="text-xs text-gray-400 italic"> Sin calificaciones registradas para este alumno.</p>
                </div>
            `;
        }
        
        html += `
        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                        ${e.nombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <span class="font-semibold text-gray-800 text-sm">${e.nombre}</span>
                </div>
                ${promedioHtml}
            </div>
            ${notasHtml}
        </div>
        `;
    });
    
    // Resumen al final
    const resumen = `
        <div class="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div class="flex justify-between items-center text-sm">
                <span class="text-indigo-700 font-semibold">
                    📊 Total estudiantes: ${estudiantes.length} · Con notas: ${estudiantesConNotas} · Sin notas: ${estudiantes.length - estudiantesConNotas}
                </span>
            </div>
        </div>
    `;
    
    container.innerHTML = html + resumen;
}
// ==========================================
// EXPORTAR DATOS A EXCEL
// ==========================================

async function exportarCursoAExcel(idCurso, nombreCurso) {
    try {
        // 1. Obtener estudiantes del curso
        const estudiantes = await AdminApi.estudiantes(idCurso);
        
        // 2. Obtener asistencia del curso de una sola vez
        const todaAsistencia = await AdminApi.asistencia(idCurso);
        
        // Cruzar los datos de asistencia con los nombres de los alumnos
        const asistenciaData = todaAsistencia.map(a => {
            const est = estudiantes.find(e => e.idEstudiante === a.idEstudiante);
            return {
                Estudiante: est ? est.nombre : 'Desconocido',
                RUT: est ? est.rut : 'Sin RUT',
                Fecha: a.fecha,
                Estado: a.estado,
                Observación: a.observacion || ''
            };
        });
        
        // 3. Obtener calificaciones del curso
        const calificaciones = await AdminApi.calificaciones(idCurso);
        const notasData = calificaciones.map(n => ({
            Estudiante: n.nombreEstudiante,
            RUT: estudiantes.find(e => e.idEstudiante === n.idEstudiante)?.rut || '',
            Asignatura: n.asignatura || n.nombreCurso,
            Evaluación: n.descripcion || n.tipoEvaluacion,
            Nota: n.nota,
            Ponderación: n.ponderacion,
            Fecha: n.fechaNota || n.fechaRegistro
        }));
        
        // 4. Crear libro de Excel
        const wb = XLSX.utils.book_new();
        
        // Hoja de Asistencia (si no hay datos, crea una hoja vacía con un aviso)
        if (asistenciaData.length > 0) {
            const wsAsistencia = XLSX.utils.json_to_sheet(asistenciaData);
            XLSX.utils.book_append_sheet(wb, wsAsistencia, 'Asistencia');
        } else {
            const wsAsistencia = XLSX.utils.aoa_to_sheet([['Sin registros de asistencia para este curso']]);
            XLSX.utils.book_append_sheet(wb, wsAsistencia, 'Asistencia');
        }
        
        // Hoja de Calificaciones
        if (notasData.length > 0) {
            const wsNotas = XLSX.utils.json_to_sheet(notasData);
            XLSX.utils.book_append_sheet(wb, wsNotas, 'Calificaciones');
        } else {
            const wsNotas = XLSX.utils.aoa_to_sheet([['Sin calificaciones registradas para este curso']]);
            XLSX.utils.book_append_sheet(wb, wsNotas, 'Calificaciones');
        }
        
        // 5. Generar nombre de archivo dinámico
        const nombreArchivo = `${nombreCurso.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // 6. Descargar archivo
        XLSX.writeFile(wb, nombreArchivo);
        
        toast('✅ Archivo Excel descargado exitosamente');
    } catch (error) {
        console.error('Error al exportar:', error);
        toast('❌ Error al exportar datos. Revisa la consola para más detalles.');
    }
}

async function updateGradesView(idCurso, idEstudiante) {
    const asignatura = document.getElementById(`grade-subj-${idCurso}-${idEstudiante}`).value;
    const listDiv = document.getElementById(`grades-list-${idCurso}-${idEstudiante}`);
    
    const todasNotas = await AdminApi.calificaciones(idCurso);
    const notasAlumno = todasNotas.filter(n => 
        n.idEstudiante === idEstudiante && 
        (n.asignatura === asignatura || n.nombreCurso === asignatura)
    );

    if (!notasAlumno.length) {
        listDiv.innerHTML = `<p class="text-xs text-gray-400 italic">No hay notas registradas en ${asignatura}.</p>`;
        return;
    }

    let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-2">';
    notasAlumno.forEach(n => {
        const notaNum = parseFloat(n.nota);
        const color = notaNum >= 4.0 ? 'text-emerald-600' : 'text-rose-600';
        const bg = notaNum >= 4.0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100';
        html += `
        <div class="flex justify-between items-center p-2 rounded border ${bg}">
            <div>
                <div class="text-xs font-bold text-gray-700">${n.descripcion || n.tipoEvaluacion}</div>
                <div class="text-[10px] text-gray-400">${n.fechaNota || n.fechaRegistro}</div>
            </div>
            <div class="text-lg font-bold ${color}">${notaNum.toFixed(1)}</div>
        </div>`;
    });
    html += '</div>';
    
    // Promedio
    const promedio = notasAlumno.reduce((acc, n) => acc + parseFloat(n.nota), 0) / notasAlumno.length;
    const colorProm = promedio >= 4.0 ? 'text-emerald-700' : 'text-rose-700';
    html += `<div class="mt-2 text-right text-xs font-bold text-gray-600">Promedio: <span class="${colorProm} text-sm">${promedio.toFixed(1)}</span></div>`;

    listDiv.innerHTML = html;
}

async function renderAdminEstudiantes() {
    document.getElementById('pageTitle').textContent = 'Directorio de Alumnos';
    document.getElementById('pageSubtitle').textContent = 'Estudiantes agrupados por curso';

    const headerHtml = `
    <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex justify-between items-center shadow-sm">
        <div>
            <h3 class="font-bold text-gray-900 text-lg">Gestión de Estudiantes</h3>
            <p class="text-sm text-gray-500">Administra la matrícula de alumnos</p>
        </div>
        <button onclick="openStudentModal()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition">
            + Agregar Nuevo Alumno
        </button>
    </div>
    `;

    const estudiantes = await AdminApi.estudiantes();

    const grupos = {};
    estudiantes.forEach(e => {
        const key = e.nombreCurso || 'Sin curso';
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(e);
    });

    const cursosOrdenados = Object.keys(grupos).sort();

    let html = '';
    cursosOrdenados.forEach(nombreCurso => {
        const alumnos = grupos[nombreCurso];
        const primerAlumno = alumnos[0];
        const nivel = primerAlumno.curso || ''; 

        html += `
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-6 fade-in">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">
                        🏫
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 text-base">${nombreCurso}</h3>
                        <p class="text-xs text-gray-500">${nivel}</p>
                    </div>
                </div>
                <span class="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                    ${alumnos.length} ${alumnos.length === 1 ? 'Alumno' : 'Alumnos'}
                </span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Alumno</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">RUT</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Apoderado</th>
                            <th class="px-6 py-3 text-center text-xs font-bold uppercase text-gray-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${alumnos.map(s => `
                            <tr class="hover:bg-gray-50 transition">
                                <td class="px-6 py-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                            ${s.nombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                                        </div>
                                        <span class="font-medium text-gray-900">${s.nombre}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-3 text-sm text-gray-500">${s.rut}</td>
                                <td class="px-6 py-3 text-sm text-gray-600">
                                    <strong class="text-slate-800">${s.apoderadoNombre}</strong>
                                    <br>
                                    <span class="text-xs text-indigo-500 font-medium">${s.apoderadoCorreo}</span>
                                </td>
                                <td class="px-6 py-3 text-center space-x-3">
                                    <button onclick="openEditStudentModal(${s.idEstudiante})" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">✏️ Editar</button>
                                    <button onclick="deleteStudent(${s.idEstudiante})" class="text-xs font-bold text-rose-600 hover:text-rose-800 transition">🗑️ Eliminar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    });

    if (!cursosOrdenados.length) {
        html = `<div class="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400 shadow-sm">
                    No hay alumnos matriculados en el sistema.
                </div>`;
    }

    document.getElementById('content').innerHTML = headerHtml + html;
}
function openStudentModal() {
    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `
    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-gray-900 text-lg">Matricular Nuevo Alumno</h3>
        <button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button>
    </div>
    <form id="formStudent" onsubmit="saveStudent(event)" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input type="text" id="modalEstNombre" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: Juan Carlos Pérez"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">RUT</label>
                <input type="text" id="modalEstRut" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: 12.345.678-9"/>
            </div>
        </div>
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
            <select id="modalEstCurso" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                <option value="">Seleccione un curso...</option>
                ${MOCK_DB.cursos.map(c => `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}
            </select>
        </div>
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Correo del Estudiante</label>
            <input type="email" id="modalEstCorreo" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: juan.perez@edu.cl"/>
        </div>
        <div class="pt-4 flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm font-medium text-white">Matricular Alumno</button>
        </div>
    </form>
    `;
    m.classList.remove('hidden');
}

async function saveStudent(e) {
    e.preventDefault();
    const nombre = document.getElementById('modalEstNombre').value.trim();
    const rut = document.getElementById('modalEstRut').value.trim();
    const idCurso = parseInt(document.getElementById('modalEstCurso').value);
    const correo = document.getElementById('modalEstCorreo').value.trim();
    const curso = MOCK_DB.cursos.find(c => c.idCurso === idCurso);
    
    await AdminApi.crearEstudiante({
        nombre, rut, idCurso, nombreCurso: curso.nombreCurso, curso: curso.nivel + ' ' + curso.paralelo, correo
    });
    
    closeModal();
    toast('✅ Alumno matriculado exitosamente');
    await renderAdminEstudiantes();
}
// ==========================================
// GESTIÓN DE CURSOS - MODAL
// ==========================================

function openCursoModal() {
    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `
    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-gray-900 text-lg">Registrar Nuevo Curso</h3>
        <button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button>
    </div>
    <form id="formCurso" onsubmit="saveCurso(event)" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Curso</label>
                <input type="text" id="modalCursoNombre" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: Matemáticas 8°A"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Asignatura</label>
                <input type="text" id="modalCursoAsignatura" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: Matemáticas"/>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nivel</label>
                <input type="text" id="modalCursoNivel" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: 8vo Básico"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Paralelo</label>
                <input type="text" id="modalCursoParalelo" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: A"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Año Escolar</label>
                <input type="number" id="modalCursoAnio" required value="2024" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            </div>
        </div>
        <div class="pt-4 flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm font-medium text-white">Crear Curso</button>
        </div>
    </form>
    `;
    m.classList.remove('hidden');
}

async function saveCurso(e) {
    e.preventDefault();
    
    const data = {
        nombreCurso: document.getElementById('modalCursoNombre').value.trim(),
        asignatura: document.getElementById('modalCursoAsignatura').value.trim(),
        nivel: document.getElementById('modalCursoNivel').value.trim(),
        paralelo: document.getElementById('modalCursoParalelo').value.trim(),
        anioEscolar: document.getElementById('modalCursoAnio').value
    };
    
    await AdminApi.crearCurso(data);
    closeModal();
    toast('✅ Curso creado exitosamente');
    await renderAdminCursos();
}

// ==========================================
// VISTA: SEMÁFORO DE RIESGO ACADÉMICO (DINÁMICO)
// ==========================================
async function renderAdminAlertas() {
    document.getElementById('pageTitle').textContent = 'Semáforo de Riesgo Académico';
    document.getElementById('pageSubtitle').textContent = 'Monitoreo automático del rendimiento estudiantil';

    // Obtener todos los estudiantes y calificaciones
    const estudiantes = await AdminApi.estudiantes();
    const todasCalificaciones = await AdminApi.calificaciones();

    // Calcular el estado de cada estudiante
    const alertasEstudiantes = estudiantes.map(est => {
        const notasEstudiante = todasCalificaciones.filter(c => c.idEstudiante === est.idEstudiante);
        
        if (notasEstudiante.length === 0) {
            return {
                ...est,
                promedio: 0,
                estado: 'SIN_DATOS',
                semaforo: 'GRIS',
                cantidadNotas: 0,
                notasBajo4: 0,
                ultimaNota: null,
                asignaturaDebil: 'Sin evaluaciones',
                motivo: 'Aún no tiene calificaciones registradas'
            };
        }

        const promedio = notasEstudiante.reduce((acc, n) => acc + parseFloat(n.nota), 0) / notasEstudiante.length;
        const notasBajo4 = notasEstudiante.filter(n => parseFloat(n.nota) < 4.0).length;
        const notasBajo35 = notasEstudiante.filter(n => parseFloat(n.nota) < 3.5).length;
        
        // Última nota registrada (ordenadas por fecha)
        const notasOrdenadas = [...notasEstudiante].sort((a, b) => {
            return new Date(b.fechaNota || b.fechaRegistro) - new Date(a.fechaNota || a.fechaRegistro);
        });
        const ultimaNota = notasOrdenadas[0];

        // Determinar asignatura más débil
        const asignaturas = {};
        notasEstudiante.forEach(n => {
            const asig = n.asignatura || n.nombreCurso || 'General';
            if (!asignaturas[asig]) asignaturas[asig] = [];
            asignaturas[asig].push(parseFloat(n.nota));
        });
        let asignaturaDebil = 'N/A';
        let promedioMasBajo = 7;
        for (const [asig, notas] of Object.entries(asignaturas)) {
            const promAsig = notas.reduce((a, b) => a + b, 0) / notas.length;
            if (promAsig < promedioMasBajo) {
                promedioMasBajo = promAsig;
                asignaturaDebil = asig;
            }
        }

        // Determinar estado según semáforo
        let estado, semaforo, motivo;
        if (promedio >= 4.0) {
            estado = 'Estable';
            semaforo = 'VERDE';
            motivo = `Buen desempeño académico. Promedio sobre 4.0`;
        } else if (promedio >= 3.5) {
            estado = 'Riesgo';
            semaforo = 'AMARILLO';
            motivo = `Zona de alerta. Promedio entre 3.5 y 3.9. Requiere seguimiento.`;
        } else {
            estado = 'Crítico';
            semaforo = 'ROJO';
            motivo = `Bajo rendimiento. Promedio inferior a 3.5. Intervención urgente necesaria.`;
        }

        // Si tiene muchas notas bajo 3.5, subir a rojo aunque el promedio sea amarillo
        if (notasBajo35 >= 2 && semaforo !== 'ROJO') {
            semaforo = 'ROJO';
            estado = 'Crítico';
            motivo = `Múltiples notas bajo 3.5 detectadas (${notasBajo35} evaluaciones). Riesgo de reprobación.`;
        }

        return {
            ...est,
            promedio: promedio.toFixed(1),
            estado,
            semaforo,
            cantidadNotas: notasEstudiante.length,
            notasBajo4,
            notasBajo35,
            ultimaNota,
            asignaturaDebil,
            motivo
        };
    });

    // Ordenar: primero rojos, luego amarillos, luego verdes, al final sin datos
    const ordenPrioridad = { 'ROJO': 0, 'AMARILLO': 1, 'VERDE': 2, 'GRIS': 3 };
    alertasEstudiantes.sort((a, b) => ordenPrioridad[a.semaforo] - ordenPrioridad[b.semaforo]);

    // Contadores para el resumen
    const totalRojos = alertasEstudiantes.filter(a => a.semaforo === 'ROJO').length;
    const totalAmarillos = alertasEstudiantes.filter(a => a.semaforo === 'AMARILLO').length;
    const totalVerdes = alertasEstudiantes.filter(a => a.semaforo === 'VERDE').length;
    const totalSinDatos = alertasEstudiantes.filter(a => a.semaforo === 'GRIS').length;

    let html = `
        <!-- Resumen de Semáforo -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-xl border-2 border-rose-200 p-5 shadow-sm flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-3xl">🔴</div>
                <div>
                    <div class="text-xs text-rose-600 uppercase font-bold tracking-wide">Críticos</div>
                    <div class="text-3xl font-bold text-rose-700">${totalRojos}</div>
                    <div class="text-xs text-gray-500">Requieren intervención</div>
                </div>
            </div>
            <div class="bg-white rounded-xl border-2 border-amber-200 p-5 shadow-sm flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-3xl">🟡</div>
                <div>
                    <div class="text-xs text-amber-600 uppercase font-bold tracking-wide">En Riesgo</div>
                    <div class="text-3xl font-bold text-amber-700">${totalAmarillos}</div>
                    <div class="text-xs text-gray-500">Seguimiento necesario</div>
                </div>
            </div>
            <div class="bg-white rounded-xl border-2 border-emerald-200 p-5 shadow-sm flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-3xl"></div>
                <div>
                    <div class="text-xs text-emerald-600 uppercase font-bold tracking-wide">Estables</div>
                    <div class="text-3xl font-bold text-emerald-700">${totalVerdes}</div>
                    <div class="text-xs text-gray-500">Buen desempeño</div>
                </div>
            </div>
            <div class="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-sm flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-3xl"></div>
                <div>
                    <div class="text-xs text-gray-600 uppercase font-bold tracking-wide">Sin Datos</div>
                    <div class="text-3xl font-bold text-gray-700">${totalSinDatos}</div>
                    <div class="text-xs text-gray-500">Sin evaluaciones</div>
                </div>
            </div>
        </div>

        <!-- Leyenda del Semáforo -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
            <h4 class="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide"> Criterios de Evaluación Automática</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div class="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span class="text-2xl"></span>
                    <div>
                        <div class="font-bold text-emerald-800 text-sm">Verde — Estable</div>
                        <div class="text-xs text-emerald-700">El estudiante tiene buen desempeño (nota promedio ≥ 4.0)</div>
                    </div>
                </div>
                <div class="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span class="text-2xl">🟡</span>
                    <div>
                        <div class="font-bold text-amber-800 text-sm">Amarillo — Riesgo</div>
                        <div class="text-xs text-amber-700">El estudiante está en zona de alerta (nota promedio entre 3.5 y 3.9)</div>
                    </div>
                </div>
                <div class="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
                    <span class="text-2xl"></span>
                    <div>
                        <div class="font-bold text-rose-800 text-sm">Rojo — Crítico</div>
                        <div class="text-xs text-rose-700">El estudiante tiene bajo rendimiento (nota promedio < 3.5) o múltiples notas bajo 3.5</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabla Detallada de Alertas -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <div>
                    <h3 class="font-bold text-gray-900 text-base">Detalle por Estudiante</h3>
                    <p class="text-xs text-gray-500">Información actualizada automáticamente según calificaciones registradas</p>
                </div>
                <div class="text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
                     Última actualización: ${new Date().toLocaleString('es-CL')}
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Estado</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Estudiante</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Curso</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500 text-center">Promedio</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500 text-center">Evaluaciones</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Asignatura Débil</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Motivo de Alerta</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
    `;

    alertasEstudiantes.forEach(a => {
        let semaforoClass = '';
        let semaforoIcon = '';
        let estadoText = '';
        let promedioClass = '';
        let filaBg = '';

        switch (a.semaforo) {
            case 'ROJO':
                semaforoClass = 'bg-rose-100 text-rose-800 border-rose-200';
                semaforoIcon = '🔴';
                estadoText = 'CRÍTICO';
                promedioClass = 'text-rose-700 font-bold';
                filaBg = 'bg-rose-50/30';
                break;
            case 'AMARILLO':
                semaforoClass = 'bg-amber-100 text-amber-800 border-amber-200';
                semaforoIcon = '🟡';
                estadoText = 'RIESGO';
                promedioClass = 'text-amber-700 font-bold';
                filaBg = 'bg-amber-50/30';
                break;
            case 'VERDE':
                semaforoClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                semaforoIcon = '🟢';
                estadoText = 'ESTABLE';
                promedioClass = 'text-emerald-700 font-bold';
                filaBg = '';
                break;
            default:
                semaforoClass = 'bg-gray-100 text-gray-600 border-gray-200';
                semaforoIcon = '⚪';
                estadoText = 'SIN DATOS';
                promedioClass = 'text-gray-500';
                filaBg = '';
        }

        const ultimaNotaInfo = a.ultimaNota 
            ? `<div class="text-[10px] text-gray-400 mt-0.5">Última: <strong class="${parseFloat(a.ultimaNota.nota) < 4 ? 'text-rose-600' : 'text-emerald-600'}">${parseFloat(a.ultimaNota.nota).toFixed(1)}</strong> en ${a.ultimaNota.descripcion || a.ultimaNota.tipoEvaluacion || 'N/A'} (${a.ultimaNota.fechaNota || a.ultimaNota.fechaRegistro || 'sin fecha'})</div>`
            : '';

        const notasBajoInfo = a.cantidadNotas > 0 
            ? `<div class="text-[10px] text-gray-400 mt-0.5">${a.notasBajo4} de ${a.cantidadNotas} notas bajo 4.0${a.notasBajo35 > 0 ? ` · ${a.notasBajo35} bajo 3.5` : ''}</div>`
            : '';

        html += `
            <tr class="hover:bg-gray-50 transition ${filaBg}">
                <td class="px-6 py-4">
                    <span class="chip px-3 py-1.5 rounded-full text-xs font-bold border ${semaforoClass}">
                        ${semaforoIcon} ${estadoText}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full ${a.semaforo === 'ROJO' ? 'bg-rose-100 text-rose-700' : a.semaforo === 'AMARILLO' ? 'bg-amber-100 text-amber-700' : a.semaforo === 'VERDE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'} flex items-center justify-center text-xs font-bold">
                            ${a.nombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                        </div>
                        <div>
                            <div class="font-semibold text-gray-900 text-sm">${a.nombre}</div>
                            <div class="text-xs text-gray-400">${a.rut}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-700 font-medium">${a.nombreCurso || a.curso || 'N/A'}</div>
                    <div class="text-xs text-gray-400">Apod: ${a.apoderadoNombre || 'Sin asignar'}</div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="text-lg ${promedioClass}">${a.promedio}</div>
                    ${notasBajoInfo}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">
                        ${a.cantidadNotas} eval.
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-700 font-medium">${a.asignaturaDebil}</div>
                    ${ultimaNotaInfo}
                </td>
                <td class="px-6 py-4">
                    <div class="text-xs text-gray-700 max-w-xs">
                        <strong class="${a.semaforo === 'ROJO' ? 'text-rose-700' : a.semaforo === 'AMARILLO' ? 'text-amber-700' : 'text-emerald-700'}">${a.estado}:</strong>
                        ${a.motivo}
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Nota al pie -->
        <div class="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-start gap-2">
            <span class="text-lg">💡</span>
            <div>
                <strong>Información importante:</strong> Este semáforo se calcula automáticamente en base a las calificaciones registradas en el sistema. 
                Los estudiantes sin evaluaciones aparecen en estado "Sin Datos". Se recomienda registrar al menos 2 evaluaciones para obtener un diagnóstico confiable.
                Los estudiantes con 2 o más notas bajo 3.5 se clasifican automáticamente como <strong>CRÍTICOS</strong> independientemente de su promedio.
            </div>
        </div>
    `;

    document.getElementById('content').innerHTML = html;
}
// ==========================================
// VISTA: GESTIÓN DE APODERADOS (NUEVO)
// ==========================================
async function renderAdminApoderados() {
    document.getElementById('pageTitle').textContent = 'Directorio de Apoderados';
    document.getElementById('pageSubtitle').textContent = 'Gestión de tutores y accesos al portal familiar';

    const apoderados = await AdminApi.apoderados();
    
    let html = `
    <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex justify-between items-center shadow-sm">
        <div>
            <h3 class="font-bold text-gray-900 text-lg">Cuentas de Apoderados</h3>
            <p class="text-sm text-gray-500">Asigna apoderados a alumnos y genera sus accesos</p>
        </div>
        <button onclick="openApoderadoModal()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition">
            + Registrar Apoderado
        </button>
    </div>
    `;

    if (!apoderados.length) {
        html += `<div class="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400 shadow-sm">No hay apoderados registrados.</div>`;
    } else {
        html += `
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table class="w-full text-left">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Apoderado</th>
                        <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Correo (Login)</th>
                        <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Pupilo Asignado</th>
                        <th class="px-6 py-3 text-center text-xs font-bold uppercase text-gray-500">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    ${apoderados.map(a => {
                        const pupilo = MOCK_DB.estudiantes.find(e => e.idEstudiante === a.pupiloId);
                        return `
                        <tr class="hover:bg-gray-50 transition">
                            <td class="px-6 py-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                                        ${a.nombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                                    </div>
                                    <span class="font-medium text-gray-900">${a.nombre}</span>
                                </div>
                            </td>
                            <td class="px-6 py-3 text-sm text-gray-600">${a.identificador}</td>
                            <td class="px-6 py-3">
                                ${pupilo ? `<span class="chip px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">${pupilo.nombre} (${pupilo.nombreCurso})</span>` 
                                         : '<span class="text-xs text-rose-500 font-medium">Sin pupilo asignado</span>'}
                            </td>
                            <td class="px-6 py-3 text-center space-x-3">
                                <button onclick="openEditApoderadoModal('${a.identificador}')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">✏️ Editar</button>
                                <button onclick="deleteApoderado('${a.identificador}')" class="text-xs font-bold text-rose-600 hover:text-rose-800 transition">🗑️ Eliminar</button>
                            </td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
    }
    document.getElementById('content').innerHTML = html;
}

async function openApoderadoModal() {
    const estudiantes = await AdminApi.estudiantes(); // Traer todos los alumnos disponibles
    
    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `
    <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-gray-900 text-lg">Registrar Apoderado</h3>
        <button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button>
    </div>
    <form id="formApoderado" onsubmit="saveApoderado(event)" class="p-6 space-y-4">
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
            <input type="text" id="modalApoNombre" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: Roberto Méndez"/>
        </div>
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico (Usuario de acceso)</label>
            <input type="email" id="modalApoCorreo" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: roberto.m@email.cl"/>
        </div>
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña de Acceso</label>
            <input type="text" id="modalApoPass" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: ClaveSegura123"/>
            <p class="text-xs text-gray-400 mt-1">Con esta clave y el correo, el apoderado ingresará al portal.</p>
        </div>
        <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Asignar a Alumno Existente</label>
            <select id="modalApoPupilo" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                <option value="">Seleccione el estudiante...</option>
                ${estudiantes.map(e => `<option value="${e.idEstudiante}">${e.nombre} - ${e.rut} (${e.nombreCurso})</option>`).join('')}
            </select>
        </div>
        <div class="pt-4 flex justify-end gap-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm font-medium text-white">Generar Acceso</button>
        </div>
    </form>
    `;
    m.classList.remove('hidden');
}

async function saveApoderado(e) {
    e.preventDefault();
    const nombre = document.getElementById('modalApoNombre').value.trim();
    const correo = document.getElementById('modalApoCorreo').value.trim();
    const contrasena = document.getElementById('modalApoPass').value.trim();
    const pupiloId = parseInt(document.getElementById('modalApoPupilo').value);
    
    // Verificar si el usuario ya existe
    if (MOCK_DB.users.find(u => u.identificador === correo)) {
        toast('❌ Ya existe un usuario registrado con ese correo');
        return;
    }

    await AdminApi.crearApoderado({ nombre, correo, contrasena, pupiloId });
    
    closeModal();
    toast('✅ Apoderado creado. Ya puede iniciar sesión.');
    await renderAdminApoderados();
}

async function deleteApoderado(identificador) {
    if (confirm('¿Eliminar acceso de este apoderado?')) {
        await AdminApi.eliminarApoderado(identificador);
        toast('Apoderado eliminado');
        await renderAdminApoderados();
    }
}

// --- DOCENTE RENDERS ---
async function renderDocenteDashboard() {
    document.getElementById('pageTitle').textContent = 'Panel Docente';
    document.getElementById('pageSubtitle').textContent = 'Resumen de actividad académica';
    
    const d = await DocenteApi.dashboard();
    const cursos = cacheCursos;
    
    // Obtener datos recientes para los widgets
    const recentAnotaciones = await DocenteApi.anotaciones();
    const recentAsistencia = MOCK_DB.asistencia.slice(-5).reverse(); 
    
    document.getElementById('content').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            ${statCard('👥', 'Mis Alumnos', d.totalEstudiantes, 'bg-blue-500')}
            ${statCard('📚', 'Clases Activas', d.totalClases, 'bg-purple-500')}
            
            <!-- Asistencia Hoy con Selector -->
            <div class="bg-white rounded-xl shadow-sm p-5 flex flex-col stat-card border border-gray-200">
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-12 h-12 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-2xl shadow-lg">✅</div>
                    <div>
                        <div class="text-xs text-slate-500 uppercase tracking-wide font-semibold">Asistencia Hoy</div>
                        <div class="text-2xl font-bold text-slate-900" id="attHoyValor">0%</div>
                    </div>
                </div>
                <select id="selectCursoAsistencia" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-emerald-500 outline-none bg-white">
                    <option value="">Seleccione curso...</option>
                    ${cursos.map(c => `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}
                </select>
            </div>
            
            <!-- Promedio Cursos con Selector -->
            <div class="bg-white rounded-xl shadow-sm p-5 flex flex-col stat-card border border-gray-200">
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-12 h-12 bg-orange-500 text-white rounded-lg flex items-center justify-center text-2xl shadow-lg">📝</div>
                    <div>
                        <div class="text-xs text-slate-500 uppercase tracking-wide font-semibold">Promedio Curso</div>
                        <div class="text-2xl font-bold text-slate-900" id="promCursoValor">0.0</div>
                    </div>
                </div>
                <select id="selectCursoPromedio" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-orange-500 outline-none bg-white">
                    <option value="">Seleccione curso...</option>
                    ${cursos.map(c => `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <!-- Resumen de Actividad Académica -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📋</span> Últimas Anotaciones Registradas
                </h3>
                <div class="space-y-2">
                    ${recentAnotaciones.length ? recentAnotaciones.slice(0, 4).map(a => {
                        const isPos = (a.tipoAnotacion || a.tipo || '').toUpperCase() === 'POSITIVA';
                        return `<div class="p-3 rounded-lg border text-xs ${isPos ? 'bg-emerald-50/50 border-emerald-100 text-slate-700' : 'bg-rose-50/50 border-rose-100 text-slate-700'}">
                            <div class="flex justify-between font-bold mb-1">
                                <span>${a.nombreEstudiante}</span>
                                <span>${a.fechaRegistro}</span>
                            </div>
                            <p class="text-gray-600">${a.detalles || a.observacion}</p>
                        </div>`;
                    }).join('') : '<p class="text-sm text-gray-400 italic py-4">Sin anotaciones recientes.</p>'}
                </div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>✅</span> Registro de Asistencia Reciente
                </h3>
                <div class="space-y-2">
                    ${recentAsistencia.length ? recentAsistencia.map(a => {
                        const est = MOCK_DB.estudiantes.find(e => e.idEstudiante === a.idEstudiante);
                        const nombre = est ? est.nombre : 'Alumno';
                        const color = a.estado === 'PRESENTE' ? 'bg-emerald-100 text-emerald-800' : a.estado === 'AUSENTE' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';
                        return `<div class="flex justify-between items-center text-sm p-2 bg-slate-50 border border-slate-100 rounded-lg">
                            <span class="font-medium text-gray-700">${nombre} <span class="text-xs text-gray-400">(${a.fecha})</span></span>
                            <span class="chip px-2 py-0.5 rounded text-xs font-bold ${color}">${a.estado}</span>
                        </div>`;
                    }).join('') : '<p class="text-sm text-gray-400 italic py-4">No hay registros de asistencia recientes. ¡Toma asistencia hoy!</p>'}
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 class="font-bold text-gray-900 mb-4">Accesos Rápidos</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onclick="navigate('attendance')" class="p-4 bg-white border border-gray-200 hover:border-indigo-500 rounded-xl text-left transition shadow-sm hover:shadow-md"><div class="text-2xl mb-2">✅</div><div class="font-bold text-sm text-slate-800">Tomar Asistencia</div></button>
                <button onclick="navigate('grades')" class="p-4 bg-white border border-gray-200 hover:border-indigo-500 rounded-xl text-left transition shadow-sm hover:shadow-md"><div class="text-2xl mb-2">📝</div><div class="font-bold text-sm text-slate-800">Registrar Nota</div></button>
                <button onclick="navigate('materials')" class="p-4 bg-white border border-gray-200 hover:border-indigo-500 rounded-xl text-left transition shadow-sm hover:shadow-md"><div class="text-2xl mb-2">📚</div><div class="font-bold text-sm text-slate-800">Subir Recurso</div></button>
                <button onclick="navigate('anotaciones')" class="p-4 bg-white border border-gray-200 hover:border-indigo-500 rounded-xl text-left transition shadow-sm hover:shadow-md"><div class="text-2xl mb-2">📋</div><div class="font-bold text-sm text-slate-800">Anotaciones</div></button>
            </div>
        </div>
    `;
    
    // Agregar event listeners a los selectores
    setTimeout(() => {
        const selectAtt = document.getElementById('selectCursoAsistencia');
        const selectProm = document.getElementById('selectCursoPromedio');
        
        if (selectAtt) {
            selectAtt.addEventListener('change', async (e) => {
                if (e.target.value) {
                    const porcentaje = await DocenteApi.asistenciaHoyPorCurso(parseInt(e.target.value));
                    document.getElementById('attHoyValor').textContent = porcentaje;
                } else {
                    document.getElementById('attHoyValor').textContent = '0%';
                }
            });
        }
        
        if (selectProm) {
            selectProm.addEventListener('change', async (e) => {
                if (e.target.value) {
                    const promedio = await DocenteApi.promedioPorCurso(parseInt(e.target.value));
                    document.getElementById('promCursoValor').textContent = promedio;
                } else {
                    document.getElementById('promCursoValor').textContent = '0.0';
                }
            });
        }
    }, 100);
}

async function renderDocenteAttendance() {
    document.getElementById('pageTitle').textContent = 'Control de Asistencia';
    const cursos = cacheCursos;
    document.getElementById('content').innerHTML = `
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm"> 
            <div class="flex flex-wrap items-end gap-4"> 
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Curso</label> 
                    <select id="attCurso" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                        ${cursos.map(c => `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}
                    </select>
                </div> 
                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Fecha</label> 
                    <input type="date" id="attDate" value="${todayStr()}" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
                </div> 
                <div class="ml-auto flex gap-2"> 
                    <button onclick="exportarExcelDocente('asistencia')" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"><span>📊</span> Exportar Excel</button>
                    <button onclick="markAllPresent()" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm">✓ Todos Presente</button> 
                    <button onclick="saveAttendance()" class="px-4 py-2 btn-primary text-white rounded-lg text-sm font-medium">💾 Guardar Registro</button> 
                </div> 
            </div> 
        </div>
        <div id="attList"></div>`;
    
    document.getElementById('attCurso').addEventListener('change', renderAttList);
    document.getElementById('attDate').addEventListener('change', renderAttList);
    await renderAttList();
}
async function renderAttList() {
    const idCurso = document.getElementById('attCurso').value;
    const fecha = document.getElementById('attDate').value;
    const list = await DocenteApi.asistencia(idCurso, fecha);
    const container = document.getElementById('attList');
    
    if (!list.length) { 
        container.innerHTML = '<div class="text-center py-12 text-gray-400">Sin alumnos matriculados en este curso</div>'; 
        return; 
    }
    
    container.innerHTML = `<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"><table class="w-full"> 
        <thead class="bg-gray-50 border-b"><tr>
            <th class="px-6 py-3 text-left text-xs uppercase font-bold text-gray-500">Alumno</th>
            <th class="px-6 py-3 text-center text-xs uppercase font-bold text-gray-500">Estado</th>
            <th class="px-6 py-3 text-left text-xs uppercase font-bold text-gray-500">Observación</th>
        </tr></thead> 
        <tbody class="divide-y divide-gray-100">
        ${list.map(s => { 
            const st = (s.estado || '').toUpperCase(); 
            return `
            <tr class="hover:bg-gray-50" data-sid="${s.idEstudiante}"> 
                <td class="px-6 py-3 font-medium text-gray-900">${s.nombre} <span class="text-xs text-gray-400 ml-2">${s.rut}</span> </td> 
                <td class="px-6 py-3 text-center"> 
                    <div class="inline-flex rounded-lg border border-gray-200 overflow-hidden shadow-sm"> 
                        <button onclick="setAttBtn(${s.idEstudiante},'PRESENTE')" class="px-3 py-1.5 text-xs font-semibold transition ${st==='PRESENTE'?'bg-emerald-700 text-white':'bg-white text-gray-600 hover:bg-gray-50'}">Presente</button> 
                        <button onclick="setAttBtn(${s.idEstudiante},'AUSENTE')" class="px-3 py-1.5 text-xs font-semibold transition border-l border-gray-200 ${st==='AUSENTE'?'bg-rose-700 text-white':'bg-white text-gray-600 hover:bg-gray-50'}">Ausente</button> 
                        <button onclick="setAttBtn(${s.idEstudiante},'TARDANZA')" class="px-3 py-1.5 text-xs font-semibold transition border-l border-gray-200 ${st==='TARDANZA'?'bg-amber-700 text-white':'bg-white text-gray-600 hover:bg-gray-50'}">Atraso</button> 
                    </div> 
                    <input type="hidden" data-estado="${s.idEstudiante}" value="${st}"/> 
                </td> 
                <td class="px-6 py-3"> 
                    <input type="text" data-note="${s.idEstudiante}" value="${s.observacion||''}" class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="Opcional..."/> 
                </td> 
            </tr>`;
        }).join('')}
        </tbody></table></div>`;
}
function setAttBtn(sid, estado) {
    const inp = document.querySelector(`[data-estado="${sid}"]`);
    if (inp) inp.value = estado;
    renderAttListVisual(sid, estado);
}
function renderAttListVisual(sid, estado) {
    const row = document.querySelector(`[data-sid="${sid}"]`);
    if (!row) return;
    row.querySelectorAll('button').forEach(btn => {
        const txt = btn.textContent.trim();
        const isPres = txt.includes('Presente');
        const isAus = txt.includes('Ausente');
        const currentType = isPres ? 'PRESENTE' : isAus ? 'AUSENTE' : 'TARDANZA';
        let activeClass = 'bg-indigo-600 text-white';
        if(currentType === 'PRESENTE') activeClass = 'bg-emerald-600 text-white';
        if(currentType === 'AUSENTE') activeClass = 'bg-rose-600 text-white';
        if(currentType === 'TARDANZA') activeClass = 'bg-amber-400 text-white';
        btn.className = `px-3 py-1.5 text-xs font-semibold transition ${currentType === estado ? activeClass : 'bg-white text-gray-600 hover:bg-gray-50'} ${currentType !== 'PRESENTE' ? 'border-l border-gray-200' : ''}`;
    });
}
function markAllPresent() {
    document.querySelectorAll('[data-estado]').forEach(inp => {
        inp.value = 'PRESENTE';
        renderAttListVisual(parseInt(inp.dataset.estado), 'PRESENTE');
    });
    toast('Todos marcados como presentes');
}
async function saveAttendance() {
    const fecha = document.getElementById('attDate').value;
    const items = [];
    document.querySelectorAll('[data-sid]').forEach(row => {
        const sid = parseInt(row.dataset.sid);
        items.push({
            idEstudiante: sid,
            fecha,
            estado: document.querySelector(`[data-estado="${sid}"]`)?.value || 'PRESENTE',
            observacion: document.querySelector(`[data-note="${sid}"]`)?.value || ''
        });
    });
    await DocenteApi.guardarAsistencia(items);
    toast('✅ Asistencia guardada correctamente');
}
async function renderDocenteGrades() {
    document.getElementById('pageTitle').textContent = 'Libro de Calificaciones';
    const cursos = cacheCursos;
    document.getElementById('content').innerHTML = `
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex flex-wrap gap-4 items-end shadow-sm"> 
            <div>
                <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Filtrar Curso</label> 
                <select id="gradeCurso" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                    <option value="">Todos mis cursos</option>
                    ${cursos.map(c => `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}
                </select>
            </div> 
            <div class="ml-auto flex gap-2">
                <button onclick="exportarExcelDocente('notas')" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"><span>📊</span> Exportar Excel</button>
                <button onclick="openGradeModal()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white">+ Nueva Calificación</button> 
            </div>
        </div>
        <div id="gradesTable"></div>`;
        
    document.getElementById('gradeCurso').addEventListener('change', renderGradesTable);
    await renderGradesTable();
}
async function renderGradesTable() {
    const idCurso = document.getElementById('gradeCurso')?.value;
    const grades = await DocenteApi.calificaciones(idCurso || null);
    if (!grades.length) {
        document.getElementById('gradesTable').innerHTML = '<div class="text-center bg-white border border-gray-200 rounded-xl py-12 text-gray-400">No hay calificaciones registradas.</div>';
        return;
    }
    const grouped = {};
    grades.forEach(g => {
        const key = g.idEstudiante;
        if (!grouped[key]) grouped[key] = { nombre: g.nombreEstudiante, notas: [] };
        grouped[key].notas.push(g);
    });
    let html = '';
    for (const [idAlumno, grupo] of Object.entries(grouped)) {
        html += `<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-4">
            <div class="bg-slate-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                <h4 class="font-bold text-gray-900 text-base">${grupo.nombre}</h4>
            </div>
            <table class="w-full">
                <thead class="bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs uppercase font-bold text-gray-500">Curso</th>
                        <th class="px-6 py-3 text-left text-xs uppercase font-bold text-gray-500">Evaluación</th>
                        <th class="px-6 py-3 text-center text-xs uppercase font-bold text-gray-500">Nota</th>
                        <th class="px-6 py-3 text-center text-xs uppercase font-bold text-gray-500">Acción</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">`;
        grupo.notas.forEach(g => {
            const notaNum = parseFloat(g.nota);
            const colorNota = notaNum >= 4.0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';
            html += `<tr>
                <td class="px-6 py-3 text-sm text-gray-600">${g.nombreCurso || g.asignatura || 'S/D'}</td>
                <td class="px-6 py-3 text-sm">${g.descripcion || g.tipoEvaluacion || 'S/D'} <span class="text-xs text-gray-400 block">${g.fechaNota || g.fechaRegistro || ''}</span></td>
                <td class="px-6 py-3 text-center text-base ${colorNota}">${notaNum.toFixed(1)}</td>
                <td class="px-6 py-3 text-center space-x-2">
                    <button onclick="openEditGradeModal(${g.idCalificacion})" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 p-1 transition">Editar</button>
                    <button onclick="deleteGrade(${g.idCalificacion})" class="text-xs font-semibold text-rose-600 hover:text-rose-800 p-1 transition">Eliminar</button>
                </td>            
                </tr>`;
        });
        html += `</tbody></table></div>`;
    }
    document.getElementById('gradesTable').innerHTML = html;
}
function openGradeModal() {
    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `<div class="p-6 border-b border-gray-100 flex justify-between items-center"><h3 class="font-bold text-gray-900 text-lg">Registrar Nueva Nota</h3><button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button></div> <form id="formGrade" onsubmit="saveGrade(event)" class="p-6 space-y-4"> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label> <select id="modalGradeCurso" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">${cacheCursos.map(c =>
        `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}</select></div> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Seleccionar Alumno</label> <select id="modalGradeAlumno" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"></select></div> <div class="grid grid-cols-2 gap-4"> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nota (1.0 - 7.0)</label> <input type="number" id="modalGradeValue" step="0.1" min="1" max="7" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: 6.5"/></div> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label> <input type="date" id="modalGradeDate" value="${todayStr()}" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/></div> </div> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Detalle / Descripción</label> <input type="text" id="modalGradeDesc" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="ej: Solemne 1, Control Lectura"/></div> <div class="pt-4 flex justify-end gap-2"><button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50">Cancelar</button> <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm font-medium text-white">Guardar Nota</button></div> </form>`;
    const selectCurso = document.getElementById('modalGradeCurso');
    selectCurso.addEventListener('change', updateModalAlumnos);
    updateModalAlumnos();
    m.classList.remove('hidden');
}
async function updateModalAlumnos() {
    const idCurso = document.getElementById('modalGradeCurso').value;
    const alumnos = await DocenteApi.estudiantes(idCurso);
    document.getElementById('modalGradeAlumno').innerHTML = alumnos.map(a => `<option value="${a.idEstudiante}">${a.nombre}</option>`).join('');
}
async function saveGrade(e) {
    e.preventDefault();
    const idCurso = parseInt(document.getElementById('modalGradeCurso').value);
    const idEstudiante = parseInt(document.getElementById('modalGradeAlumno').value);
    const selAlu = document.getElementById('modalGradeAlumno');
    const nombreEstudiante = selAlu.options[selAlu.selectedIndex].text;
    const selCur = document.getElementById('modalGradeCurso');
    const nombreCurso = selCur.options[selCur.selectedIndex].text;
    await DocenteApi.crearCalificacion({
        idCurso, idEstudiante, nombreEstudiante, nombreCurso,
        nota: parseFloat(document.getElementById('modalGradeValue').value),
        fechaNota: document.getElementById('modalGradeDate').value,
        descripcion: document.getElementById('modalGradeDesc').value
    });
    closeModal();
    toast('✅ Nota registrada exitosamente');
    await renderGradesTable();
}
async function deleteGrade(id) {
    if(confirm('¿Seguro que desea eliminar esta calificación?')) {
        await DocenteApi.eliminarCalificacion(id);
        toast('Calificación eliminada');
        await renderGradesTable();
    }
}
// ==========================================
// EDITAR CALIFICACIONES (DOCENTE)
// ==========================================
async function openEditGradeModal(idCalificacion) {
    // Buscamos la calificación actual en la base de datos simulada
    const grade = MOCK_DB.calificaciones.find(c => c.idCalificacion === idCalificacion);
    if(!grade) return;

    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 class="font-bold text-gray-900 text-lg">Editar Calificación</h3>
            <button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button>
        </div> 
        <form id="formEditGrade" onsubmit="saveEditedGrade(event, ${idCalificacion})" class="p-6 space-y-4"> 
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Alumno</label> 
                <input type="text" disabled value="${grade.nombreEstudiante}" class="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 outline-none cursor-not-allowed"/>
            </div> 
            <div class="grid grid-cols-2 gap-4"> 
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nota (1.0 - 7.0)</label> 
                    <input type="number" id="modalEditGradeValue" step="0.1" min="1" max="7" required value="${parseFloat(grade.nota).toFixed(1)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
                </div> 
                <div>
                    <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label> 
                    <input type="date" id="modalEditGradeDate" required value="${grade.fechaNota || grade.fechaRegistro}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
                </div> 
            </div> 
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Detalle / Descripción</label> 
                <input type="text" id="modalEditGradeDesc" required value="${grade.descripcion || grade.tipoEvaluacion}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            </div> 
            <div class="pt-4 flex justify-end gap-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 transition">Cancelar</button> 
                <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm font-medium text-white transition">Actualizar Nota</button>
            </div> 
        </form>
    `;
    m.classList.remove('hidden');
}

async function saveEditedGrade(e, idCalificacion) {
    e.preventDefault();
    
    // Capturamos los nuevos valores del formulario
    const nuevaNota = parseFloat(document.getElementById('modalEditGradeValue').value);
    const nuevaFecha = document.getElementById('modalEditGradeDate').value;
    const nuevaDesc = document.getElementById('modalEditGradeDesc').value;

    // Actualizamos a través de la API
    await DocenteApi.editarCalificacion(idCalificacion, {
        nota: nuevaNota,
        fechaNota: nuevaFecha,
        descripcion: nuevaDesc
    });

    closeModal();
    toast('✅ Nota actualizada exitosamente');
    
    // Recargamos la tabla para mostrar los cambios
    await renderGradesTable();
}

async function renderDocenteAnotaciones() {
    document.getElementById('pageTitle').textContent = 'Registro de Anotaciones u Observaciones';
    document.getElementById('pageSubtitle').textContent = 'Hoja de vida digital de los estudiantes';
    document.getElementById('content').innerHTML = `<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex flex-wrap gap-4 items-end shadow-sm"> <button onclick="openAnotacionModal()" class="ml-auto btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white">+ Nueva Hoja de Vida</button> </div><div id="anotacionesTable"></div>`;
    await renderAnotacionesTable();
}

async function renderAnotacionesTable() {
    const list = await DocenteApi.anotaciones();
    const container = document.getElementById('anotacionesTable');
    if (!container) return;
    
    if (!list || !list.length) {
        container.innerHTML = '<div class="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">Sin anotaciones vigentes en la base de datos</div>';
        return;
    }

    let html = `<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table class="w-full">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="px-6 py-3 text-left text-xs uppercase font-bold text-gray-500">Estudiante</th>
                    <th class="px-6 py-3 text-left text-xs uppercase font-bold text-gray-500">Tipo</th>
                    <th class="px-6 py-3 text-left text-xs uppercase font-bold text-gray-500">Detalle</th>
                    <th class="px-6 py-3 text-left text-xs uppercase font-bold text-gray-500">Registrado por</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">`;
    
    list.forEach(a => {
        const isPos = (a.tipoAnotacion || a.tipo || '').toUpperCase() === 'POSITIVA';
        const badgeClass = isPos ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100';
        html += `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-3 font-medium text-gray-900">${a.nombreEstudiante || 'Sin nombre'}</td>
                <td class="px-6 py-3 text-sm">
                    <span class="chip px-2.5 py-0.5 rounded border text-xs font-bold ${badgeClass}">${a.tipoAnotacion || a.tipo || 'GENERAL'}</span>
                </td>
                <td class="px-6 py-3 text-sm text-gray-600">
                    ${a.detalles || a.observacion || 'Sin detalles'}
                    <span class="text-xs text-gray-400 block mt-0.5">${a.fechaRegistro || ''}</span>
                </td>
                <td class="px-6 py-3 text-xs text-gray-500 font-medium">${a.nombreDocente || 'Desconocido'}</td>
            </tr>`;
    });
    
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function openAnotacionModal() {
    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `<div class="p-6 border-b border-gray-100 flex justify-between items-center"><h3 class="font-bold text-gray-900 text-lg">Ingresar Observación / Anotación</h3><button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button></div> <form id="formAnotacion" onsubmit="saveAnotacion(event)" class="p-6 space-y-4"> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label> <select id="modalAnCurso" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">${cacheCursos.map(c =>
        `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}</select></div> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Estudiante</label> <select id="modalAnAlumno" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"></select></div> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Comportamiento</label> <select id="modalAnTipo" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"><option value="POSITIVA">Anotación Destacable (Positiva)</option><option value="NEGATIVA">Falta o Incumplimiento (Negativa)</option></select></div> <div><label class="block text-xs font-bold text-gray-500 uppercase mb-1">Detalles de la observación</label> <textarea id="modalAnDet" required rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none" placeholder="Escriba los hechos observados de forma objetiva..."></textarea></div> <div class="pt-4 flex justify-end gap-2"><button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50">Cancelar</button> <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm font-medium text-white">Registrar en Hoja de Vida</button></div> </form>`;
    const selectCurso = document.getElementById('modalAnCurso');
    selectCurso.addEventListener('change', updateModalAnAlumnos);
    updateModalAnAlumnos();
    m.classList.remove('hidden');
}
async function updateModalAnAlumnos() {
    const idCurso = document.getElementById('modalAnCurso').value;
    const alumnos = await DocenteApi.estudiantes(idCurso);
    document.getElementById('modalAnAlumno').innerHTML = alumnos.map(a => `<option value="${a.idEstudiante}">${a.nombre}</option>`).join('');
}
async function saveAnotacion(e) {
    e.preventDefault();
    const selAlu = document.getElementById('modalAnAlumno');
    await DocenteApi.crearAnotacion({
        idEstudiante: parseInt(selAlu.value),
        nombreEstudiante: selAlu.options[selAlu.selectedIndex].text,
        tipoAnotacion: document.getElementById('modalAnTipo').value,
        detalles: document.getElementById('modalAnDet').value
    });
    closeModal();
    toast('📋 Observación registrada en bitácora digital');
    await renderAnotacionesTable();
}
async function renderDocenteMaterials() {
    document.getElementById('pageTitle').textContent = 'Repositorio y Material de Estudio';
    document.getElementById('content').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm self-start">
                <h4 class="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Subir Nuevo Archivo</h4>
                <form id="formMat" onsubmit="uploadMaterial(event)" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Asociar a Curso</label>
                        <select id="matCurso" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                            ${cacheCursos.map(c => `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Seleccione Documento</label>
                        <div class="file-drop p-6 rounded-lg text-center cursor-pointer bg-slate-50" onclick="document.getElementById('matFile').click()">
                            <div class="text-3xl mb-1">📤</div>
                            <span id="fileNameLabel" class="text-xs text-gray-500 font-medium">Click para buscar archivo (PDF, Word, PPTX)</span>
                            <input type="file" id="matFile" class="hidden" required onchange="document.getElementById('fileNameLabel').textContent=this.files[0]?.name||''"/>
                        </div>
                        <p class="text-[10px] text-gray-400 mt-1">⚠️ Tamaño máximo permitido: 1 MB</p>
                    </div>
                    <button type="submit" class="w-full btn-primary py-2.5 rounded-lg text-sm font-medium text-white shadow-sm">Publicar Recurso</button>
                </form>
            </div>
            <div class="md:col-span-2 space-y-4">
                <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Filtrar Materiales por Curso</label>
                    <select id="matFiltroCurso" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                        <option value="">Todos mis cursos</option>
                        ${cacheCursos.map(c => `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}
                    </select>
                </div>
                <div id="materialsList"></div>
            </div>
        </div>`;

    // Listener para el filtro de visualización
    document.getElementById('matFiltroCurso').addEventListener('change', () => {
        const idCurso = document.getElementById('matFiltroCurso').value;
        renderMaterialsList(idCurso || null);
    });

    await renderMaterialsList();
}
async function renderMaterialsList(idCurso) {
    const list = await DocenteApi.materiales(idCurso || null);
    const container = document.getElementById('materialsList');

    if (!list.length) {
        container.innerHTML = '<div class="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400 shadow-sm">No hay materiales publicados para esta selección.</div>';
        return;
    }

    container.innerHTML = `<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table class="w-full text-left">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="px-6 py-3 text-xs font-bold uppercase">Título Recurso</th>
                    <th class="px-6 py-3 text-xs font-bold uppercase">Curso</th>
                    <th class="px-6 py-3 text-xs font-bold uppercase">Tipo</th>
                    <th class="px-6 py-3 text-center text-xs font-bold uppercase">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                ${list.map(m => {
                    const curso = MOCK_DB.cursos.find(c => c.idCurso === m.idCurso);
                    return `<tr class="hover:bg-gray-50 transition">
                        <td class="px-6 py-3 font-medium text-gray-900">
                            <div class="flex items-center space-x-2">
                                <span class="text-xl">📄</span>
                                <span>${m.titulo}</span>
                            </div>
                        </td>
                        <td class="px-6 py-3 text-sm text-indigo-600 font-semibold">${curso ? curso.nombreCurso : m.asignatura}</td>
                        <td class="px-6 py-3">
                            <span class="chip px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">${m.tipoArchivo || 'PDF'}</span>
                        </td>
                        <td class="px-6 py-3 text-center space-x-3">
                            <button onclick="downloadMaterial(${m.idMaterial}, '${m.titulo.replace(/'/g, "\\'")}')" class="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition">📥 Descargar</button>
                            <button onclick="deleteMaterial(${m.idMaterial})" class="text-xs font-bold text-rose-600 hover:text-rose-800 transition">🗑️ Remover</button>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;
}
async function uploadMaterial(e) {
    e.preventDefault();
    const fileInput = document.getElementById('matFile');
    const file = fileInput.files[0];

    if (!file) {
        toast('⚠️ Debes seleccionar un archivo');
        return;
    }

    // ✅ Validación de tamaño máximo: 1 MB
    const MAX_SIZE_MB = 1;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
        toast(`❌ El archivo pesa ${(file.size / 1024 / 1024).toFixed(2)} MB. El máximo permitido es ${MAX_SIZE_MB} MB.`);
        fileInput.value = '';
        document.getElementById('fileNameLabel').textContent = 'Click para buscar archivo (PDF, Word, PPTX)';
        return;
    }

    const fd = new FormData();
    fd.append('idCurso', document.getElementById('matCurso').value);
    fd.append('file', file);

    await DocenteApi.subirMaterial(fd);

    // Resetear formulario
    document.getElementById('formMat').reset();
    document.getElementById('fileNameLabel').textContent = 'Click para buscar archivo (PDF, Word, PPTX)';
    toast('✅ Documento publicado en el portal de alumnos');

    // Refrescar lista manteniendo el filtro activo
    const filtroActivo = document.getElementById('matFiltroCurso')?.value;
    await renderMaterialsList(filtroActivo || null);
}
async function deleteMaterial(id) {
    if(confirm('¿Desea despublicar este archivo?')) {
        await DocenteApi.eliminarMaterial(id);
        toast('Recurso removido');
        await renderMaterialsList();
    }
}
function downloadMaterial(idMaterial, titulo) {
    const material = MOCK_DB.materiales.find(m => m.idMaterial === idMaterial);
    
    if (!material) {
        toast('❌ Archivo no encontrado');
        return;
    }

    // ✅ Si tiene contenido almacenado (archivo real subido)
    if (material.contenido) {
        // Convertir base64 a Blob
        const byteString = atob(material.contenido.split(',')[1]);
        const mimeString = material.contenido.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = material.titulo; // ✅ Usar el nombre original del archivo
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('📥 Archivo descargado correctamente');
    } 
    // ✅ Si es un archivo de ejemplo (sin contenido real)
    else {
        const nombreCurso = MOCK_DB.cursos.find(c => c.idCurso === material.idCurso)?.nombreCurso || 'General';
        const contenido = [
            `========================================`,
            `  SIGA - Sistema Integrado de Gestión Académica`,
            `========================================`,
            ``,
            `Recurso: ${titulo}`,
            `Curso: ${nombreCurso}`,
            `Tipo: ${material.tipoArchivo || 'PDF'}`,
            ``,
            `Este es un archivo de ejemplo precargado.`,
            `Los archivos que subas tú tendrán contenido real.`,
            ``,
            `========================================`
        ].join('\n');

        const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${titulo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('📥 Archivo de ejemplo descargado');
    }
}
async function renderDocenteStudents() {
    document.getElementById('pageTitle').textContent = 'Mis Alumnos y Contacto de Apoderados';
    const cursos = cacheCursos;
    document.getElementById('content').innerHTML = `<div class="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm"> <div><label class="block text-xs font-bold text-gray-500 mb-1 uppercase">Filtrar por Curso</label> <select id="studCurso" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">${cursos.map(c =>
        `<option value="${c.idCurso}">${c.nombreCurso}</option>`).join('')}</select></div> </div><div id="studentsList"></div>`;
    document.getElementById('studCurso').addEventListener('change', renderStudentsListTable);
    await renderStudentsListTable();
}
async function renderStudentsListTable() {
    const idCurso = document.getElementById('studCurso').value;
    const alumnos = await DocenteApi.estudiantes(idCurso);
    document.getElementById('studentsList').innerHTML = alumnos.length ? `<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"><table class="w-full text-left"><thead class="bg-gray-50 border-b"><tr> <th class="px-6 py-3 text-xs font-bold uppercase">Alumno</th><th class="px-6 py-3 text-xs font-bold uppercase">RUT</th><th class="px-6 py-3 text-xs font-bold uppercase">Apoderado Responsable</th></tr></thead><tbody class="divide-y divide-gray-100">${alumnos.map(a =>
        `<tr> <td class="px-6 py-3 font-medium text-gray-900">${a.nombre}</td> <td class="px-6 py-3 text-sm text-gray-500">${a.rut}</td> <td class="px-6 py-3 text-sm text-gray-600"> <strong class="text-slate-800">${a.apoderadoNombre}</strong> <br> <span class="text-xs text-indigo-500 font-medium">${a.apoderadoCorreo}</span> </td> </tr>`).join('')}</tbody></table></div>` : '<div class="text-center py-12 text-gray-400">Sin registros</div>';
}

// --- APODERADO RENDERS ---
async function renderApoderadoDashboard() {
    const d = await ApoderadoApi.dashboard();
    document.getElementById('pageTitle').textContent = `Portal del Apoderado — Alumno: ${d.nombrePupilo}`;
    document.getElementById('pageSubtitle').textContent = `Curso actual: ${d.curso} · Rendimiento Promedio: ${d.promedio}`;
    
    document.getElementById('content').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"> 
            ${statCard('👨‍🎓', 'Pupilo Matriculado', d.nombrePupilo, 'bg-blue-500')} 
            ${statCard('🏫', 'Curso Asignado', d.curso, 'bg-purple-500')} 
            ${statCard('📈', 'Promedio General', d.promedio, 'bg-orange-500')} 
        </div> 
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6"> 
            <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 flex items-center space-x-2"><span>✅</span> Resumen Asistencia</h3>
                <div id="apoderadoAttWidget"></div>
            </div> 
            <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 flex items-center space-x-2"><span>📝</span> Últimas Calificaciones</h3>
                <div id="apoderadoGradesWidget"></div>
            </div> 
            <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 class="font-bold text-gray-900 mb-4 flex items-center space-x-2"><span>📋</span> Últimas Observaciones</h3>
                <div id="apoderadoAnWidget"></div>
            </div> 
        </div>`;

    // Cargar Asistencia
    const att = await ApoderadoApi.asistencia();
    document.getElementById('apoderadoAttWidget').innerHTML = `<div class="space-y-2">${att.slice(0,4).map(a =>
        `<div class="flex justify-between items-center text-sm p-2 bg-slate-50 border border-slate-100 rounded-lg"> 
            <span class="font-medium text-gray-700">${a.fecha}</span> 
            <span class="chip px-2 py-0.5 rounded text-xs font-bold ${a.estado==='PRESENTE'?'bg-emerald-100 text-emerald-800':'bg-rose-100 text-rose-800'}">${a.estado}</span> 
        </div>`).join('')}</div>`;

    // ✅ Cargar Calificaciones (NUEVO WIDGET)
    const grades = await ApoderadoApi.calificaciones();
    document.getElementById('apoderadoGradesWidget').innerHTML = grades.length ? `<div class="space-y-2">${grades.slice(0,4).map(g => { 
        const n = parseFloat(g.nota); 
        return `<div class="flex justify-between items-center text-sm p-2 bg-slate-50 border border-slate-100 rounded-lg"> 
            <span class="font-medium text-gray-700">${g.nombreCurso || g.asignatura || 'S/D'}</span> 
            <span class="chip px-2 py-0.5 rounded text-xs font-bold ${n>=4?'bg-emerald-100 text-emerald-800':'bg-rose-100 text-rose-800'}">${n.toFixed(1)}</span> 
        </div>`; 
    }).join('')}</div>` : '<p class="text-sm text-gray-400 italic py-4">Sin calificaciones recientes.</p>';

    // Cargar Anotaciones
    const an = await ApoderadoApi.anotaciones();
    document.getElementById('apoderadoAnWidget').innerHTML = an.length ? `<div class="space-y-2">${an.slice(0,3).map(a =>
        `<div class="p-3 rounded-lg border text-xs ${(a.tipoAnotacion || a.tipo)==='POSITIVA'?'bg-emerald-50/50 border-emerald-100 text-slate-700':'bg-rose-50/50 border-rose-100 text-slate-700'}"> 
            <div class="flex justify-between font-bold mb-1"> 
                <span>Anotación ${a.tipoAnotacion || a.tipo}</span> 
                <span>${a.fechaRegistro}</span> 
            </div> 
            <p class="text-gray-600">${a.detalles || a.observacion}</p> 
        </div>`).join('')}</div>` : '<div class="text-sm text-gray-400 italic py-4">Sin anotaciones registradas en el período.</div>';
}
async function renderApoderadoAttendance() {
    document.getElementById('pageTitle').textContent = 'Registro Histórico de Asistencia';
    const list = await ApoderadoApi.asistencia();
    document.getElementById('content').innerHTML = `<div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"><table class="w-full text-left"><thead class="bg-gray-50 border-b"><tr> <th class="px-6 py-3 text-xs font-bold uppercase">Fecha de la Clase</th><th class="px-6 py-3 text-xs font-bold uppercase">Estado de Presencia</th><th class="px-6 py-3 text-xs font-bold uppercase">Observaciones</th></tr></thead><tbody class="divide-y divide-gray-100">${list.map(a =>
        `<tr> <td class="px-6 py-3 text-sm font-medium text-gray-900">${a.fecha}</td> <td class="px-6 py-3 text-sm"> <span class="chip px-2.5 py-0.5 rounded text-xs font-bold ${a.estado==='PRESENTE'?'bg-emerald-100 text-emerald-800':'bg-rose-100 text-rose-800'}">${a.estado}</span> </td> <td class="px-6 py-3 text-xs text-gray-500 italic">${a.observacion || 'Sin comentarios'}</td> </tr>`).join('')}</tbody></table></div>`;
}
async function renderApoderadoGrades() {
    document.getElementById('pageTitle').textContent = 'Calificaciones del Estudiante';
    document.getElementById('pageSubtitle').textContent = 'Notas agrupadas por asignatura';
    
    const list = await ApoderadoApi.calificaciones();
    
    if (!list || !list.length) {
        document.getElementById('content').innerHTML = '<div class="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">No hay calificaciones registradas para este estudiante.</div>';
        return;
    }

    // 🔹 Agrupar calificaciones por asignatura/curso
    const grupos = {};
    list.forEach(g => {
        const key = g.nombreCurso || g.asignatura || 'Sin asignatura';
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(g);
    });

    // 🔹 Ordenar las asignaturas alfabéticamente
    const asignaturasOrdenadas = Object.keys(grupos).sort();

    // 🔹 Renderizar un contenedor por cada asignatura
    let html = '';
    asignaturasOrdenadas.forEach(nombreAsignatura => {
        const notas = grupos[nombreAsignatura];
        
        // Calcular promedio de la asignatura
        const promedio = notas.reduce((acc, n) => acc + parseFloat(n.nota), 0) / notas.length;
        const colorProm = promedio >= 4.0 ? 'text-emerald-700' : 'text-rose-700';
        const bgProm = promedio >= 4.0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200';

        html += `
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-6 fade-in">
            <!-- Cabecera del contenedor de la asignatura -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
                        📚
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 text-base">${nombreAsignatura}</h3>
                        <p class="text-xs text-gray-500">${notas.length} ${notas.length === 1 ? 'Evaluación' : 'Evaluaciones'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-gray-500 uppercase font-bold mb-1">Promedio</div>
                    <div class="px-3 py-1.5 rounded-lg border ${bgProm} ${colorProm} text-lg font-bold">
                        ${promedio.toFixed(1)}
                    </div>
                </div>
            </div>

            <!-- Tabla de calificaciones de la asignatura -->
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Evaluación</th>
                            <th class="px-6 py-3 text-xs font-bold uppercase text-gray-500">Fecha</th>
                            <th class="px-6 py-3 text-center text-xs font-bold uppercase text-gray-500">Nota</th>
                            <th class="px-6 py-3 text-center text-xs font-bold uppercase text-gray-500">Estado</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${notas.map(g => {
                            const notaNum = parseFloat(g.nota);
                            const colorNota = notaNum >= 4.0 ? 'text-emerald-600' : 'text-rose-600';
                            const bgNota = notaNum >= 4.0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100';
                            const estado = notaNum >= 4.0 ? 'Aprobado' : 'Reprobado';
                            const iconEstado = notaNum >= 4.0 ? '✅' : '❌';
                            const colorEstado = notaNum >= 4.0 ? 'text-emerald-700' : 'text-rose-700';
                            
                            return `
                            <tr class="hover:bg-gray-50 transition">
                                <td class="px-6 py-3">
                                    <div class="font-medium text-gray-900">${g.descripcion || g.tipoEvaluacion || 'Sin descripción'}</div>
                                </td>
                                <td class="px-6 py-3 text-sm text-gray-500">${g.fechaNota || g.fechaRegistro || 'Sin fecha'}</td>
                                <td class="px-6 py-3 text-center">
                                    <span class="inline-block px-3 py-1 rounded-lg border ${bgNota} ${colorNota} text-base font-bold">
                                        ${notaNum.toFixed(1)}
                                    </span>
                                </td>
                                <td class="px-6 py-3 text-center">
                                    <span class="text-xs font-bold ${colorEstado}">
                                        ${iconEstado} ${estado}
                                    </span>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    });

    // 🔹 Resumen general al final
    const promedioGeneral = list.reduce((acc, n) => acc + parseFloat(n.nota), 0) / list.length;
    const colorPromGen = promedioGeneral >= 4.0 ? 'text-emerald-700' : 'text-rose-700';
    
    html += `
    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 shadow-sm mt-8">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-white text-indigo-700 flex items-center justify-center text-2xl font-bold shadow-sm">
                    📊
                </div>
                <div>
                    <h4 class="font-bold text-gray-900 text-base">Resumen General</h4>
                    <p class="text-xs text-gray-600">${list.length} evaluaciones en ${asignaturasOrdenadas.length} asignaturas</p>
                </div>
            </div>
            <div class="text-right">
                <div class="text-xs text-gray-600 uppercase font-bold mb-1">Promedio General</div>
                <div class="text-3xl font-bold ${colorPromGen}">
                    ${promedioGeneral.toFixed(1)}
                </div>
            </div>
        </div>
    </div>
    `;

    document.getElementById('content').innerHTML = html;
}
async function renderApoderadoAnotaciones() {
    document.getElementById('pageTitle').textContent = 'Hoja de Vida Digital del Alumno';
    const list = await ApoderadoApi.anotaciones();
    
    // ✅ CORREGIDO: Manejo correcto de lista vacía
    if (!list || !list.length) {
        document.getElementById('content').innerHTML = '<div class="text-center py-12 bg-white border border-gray-200 rounded-xl text-gray-400 shadow-sm">No existen anotaciones ni observaciones en este año escolar</div>';
        return;
    }

    document.getElementById('content').innerHTML = `<div class="space-y-3">${list.map(a => { 
        const isPos = (a.tipoAnotacion || a.tipo || '').toUpperCase() === 'POSITIVA'; 
        return `<div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"> 
            <div> 
                <div class="flex items-center space-x-2 mb-1.5"> 
                    <span class="chip px-2 py-0.5 rounded text-xs font-bold border ${isPos?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-rose-50 text-rose-700 border-rose-200'}">Anotación ${a.tipoAnotacion || a.tipo}</span> 
                    <span class="text-xs text-gray-400">${a.fechaRegistro}</span> 
                </div> 
                <p class="text-sm text-slate-700 font-medium">${a.detalles || a.observacion}</p> 
            </div> 
            <div class="text-xs font-medium text-gray-500 bg-slate-50 border px-3 py-1.5 rounded-lg self-start md:self-auto">Registrado por: ${a.nombreDocente}</div> 
        </div>`;
    }).join('')}</div>`;
}
async function renderApoderadoMaterials() {
    document.getElementById('pageTitle').textContent = 'Material de Estudio Disponible';
    const mats = await ApoderadoApi.materiales();
    
    document.getElementById('content').innerHTML = `<div class="grid grid-cols-1 md:grid-cols-3 gap-4">${mats.map(m =>
        `<div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col hover:border-indigo-400 transition">
            <div class="text-3xl mb-3">📄</div>
            <h4 class="font-bold text-sm text-gray-900">${m.titulo}</h4>
            <p class="text-xs text-gray-500 mt-1 mb-4 flex-1 font-semibold text-indigo-600">${m.asignatura}</p>
            <button onclick="downloadMaterialApoderado(${m.idMaterial}, '${m.titulo.replace(/'/g, "\\'")}')" 
                    class="text-xs font-bold uppercase text-indigo-600 border-b border-indigo-600 hover:text-indigo-800 pb-0.5 self-start transition cursor-pointer bg-transparent border-0 p-0">
                Descargar Archivo
            </button>
        </div>`).join('')}</div>`;
}
function downloadMaterialApoderado(idMaterial, titulo) {
    const material = MOCK_DB.materiales.find(m => m.idMaterial === idMaterial);
    if (!material) {
        toast('❌ Archivo no encontrado');
        return;
    }
    
    // Si tiene contenido almacenado (archivo real subido)
    if (material.contenido) {
        const byteString = atob(material.contenido.split(',')[1]);
        const mimeString = material.contenido.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = material.titulo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('📥 Archivo descargado correctamente');
    } 
    // Si es un archivo de ejemplo (sin contenido real)
    else {
        const nombreCurso = MOCK_DB.cursos.find(c => c.idCurso === material.idCurso)?.nombreCurso || 'General';
        const contenido = [
            `========================================`,
            `  SIGA - Sistema Integrado de Gestión Académica`,
            `========================================`,
            ``,
            `Recurso: ${titulo}`,
            `Curso: ${nombreCurso}`,
            `Tipo: ${material.tipoArchivo || 'PDF'}`,
            ``,
            `Este es un archivo de ejemplo precargado.`,
            `Los archivos que suba el profesor tendrán contenido real.`,
            ``,
            `========================================`
        ].join('\n');
        const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${titulo.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('📥 Archivo de ejemplo descargado');
    }
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('siga_token');
    if (token) {
        try {
            setToken(token);
            const user = await AuthApi.me();
            currentUser = user;
            document.getElementById('landingPage')?.classList.add('hidden');
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            document.getElementById('app').classList.add('flex');
            await initApp();
        } catch (_) { setToken(''); }
    }
});

/**
 * RENDERIZADO DE LA VISTA DE GESTIÓN DE DOCENTES (VISTA ADMIN)
 */
async function renderAdminDocentes() {
    // Cambiar el título dinámico de la cabecera del SIGA
    if(document.getElementById('pageTitle')) {
        document.getElementById('pageTitle').textContent = 'Gestión de Personal Docente';
    }
    
    // Obtenemos los datos desde el Mock API
    const docentes = await AdminApi.obtenerDocentes();
    const cursos = await AdminApi.obtenerCursos();

    // Creamos un mapa rápido de ID -> NombreCurso para no hacer búsquedas anidadas lentas
    const cursosMap = {};
    cursos.forEach(c => {
        cursosMap[c.idCurso] = c.nombreCurso;
    });

    let html = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <p class="text-sm text-gray-500">Administra las credenciales de acceso y asignaciones académicas del profesorado.</p>
            </div>
            <button onclick="abrirModalCrearDocente()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2">
                <span>➕</span> Agregar Docente
            </button>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <th class="p-4">Nombre Docente</th>
                            <th class="p-4">Correo / Usuario</th>
                            <th class="p-4">Cursos Asignados</th>
                            <th class="p-4 text-center">Acciones</th>
                        </tr>
        </thead>
                    <tbody class="divide-y divide-gray-100 text-sm text-slate-700">
    `;

    if (docentes.length === 0) {
        html += `<tr><td colspan="4 " class="p-8 text-center text-gray-400 italic">No hay docentes registrados en el sistema.</td></tr>`;
    } else {
        docentes.forEach(d => {
            // Mapeamos las IDs de cursos asignados a etiquetas visuales (Chips) de Tailwind
            const chipsCursos = d.cursosAsignados && d.cursosAsignados.length > 0
                ? d.cursosAsignados.map(id => `
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 mr-1 mb-1 shadow-2xs">
                        ${cursosMap[id] || `Curso ID: ${id}`}
                    </span>
                  `).join('')
                : '<span class="text-xs text-gray-400 italic">Sin cursos asignados</span>';

            html += `
                <tr class="hover:bg-slate-50/80 transition">
                    <td class="p-4 font-semibold text-slate-900">${d.nombre}</td>
                    <td class="p-4 text-slate-500 font-mono text-xs">${d.identificador}</td>
                    <td class="p-4">${chipsCursos}</td>
                    <td class="p-4 text-center space-x-3">
                        <button onclick="openEditDocenteModal('${d.identificador}')" 
                                class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
                            ✏️ Editar
                        </button>
                        <button onclick="deleteDocente('${d.identificador}')" 
                                class="text-xs font-bold text-rose-600 hover:text-rose-800 transition">
                            🗑️ Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Insertar el contenido generado en el contenedor principal de la App
    document.getElementById('content').innerHTML = html;
}

/**
 * ABRE EL MODAL DINÁMICO E INYECTA EL FORMULARIO COMPLETO CON LOS CURSOS EXISTENTES
 */
async function abrirModalCrearDocente() {
    const cursos = await AdminApi.obtenerCursos();
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');

    if (!modal || !modalContent) return;

    // Generamos las opciones de cursos utilizando casillas de verificación (Checkboxes)
    const checkboxesCursos = cursos.map(c => `
        <label class="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer border border-gray-100 transition">
            <input type="checkbox" name="cursosSeleccionados" value="${c.idCurso}" class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
            <span class="text-sm text-slate-700 font-medium">${c.nombreCurso} <span class="text-xs text-gray-400">(${c.nivel})</span></span>
        </label>
    `).join('');

    // Inyectamos la estructura HTML del formulario dentro del modal existente en 12.html
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                <h3 class="text-lg font-bold text-slate-900">Registrar Nuevo Docente</h3>
                <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-2xl font-light">&times;</button>
            </div>
            
            <form id="formNuevoDocente" onsubmit="guardarNuevoDocente(event)" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Nombre Completo</label>
                    <input type="text" id="regNombre" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Ej. Juan Carlos Pérez">
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Correo Electrónico (Usuario de Acceso)</label>
                    <input type="email" id="regEmail" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="ejemplo@upla.cl">
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Contraseña de Ingreso</label>
                    <input type="password" id="regContrasena" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Establece una contraseña segura">
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Asignación de Cursos existentes</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-slate-50/50 scrollbar">
                        ${checkboxesCursos || '<p class="text-xs text-gray-400 p-2">No existen cursos registrados en el sistema.</p>'}
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition">Cancelar</button>
                    <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition">Guardar y Habilitar</button>
                </div>
            </form>
        </div>
    `;

    // Quitamos la clase 'hidden' para mostrarlo en pantalla
    modal.classList.remove('hidden');
}

/**
 * PROCESA E INSERTA LOS DATOS DEL DOCENTE
 */
async function guardarNuevoDocente(event) {
    event.preventDefault(); // Evitamos que la página se recargue

    const nombre = document.getElementById('regNombre').value.trim();
    const identificador = document.getElementById('regEmail').value.trim();
    const contrasena = document.getElementById('regContrasena').value;

    // Recopilamos todas las checkboxes de cursos que hayan sido seleccionadas
    const checkboxes = document.querySelectorAll('input[name="cursosSeleccionados"]:checked');
    const cursosAsignados = Array.from(checkboxes).map(cb => parseInt(cb.value));

    try {
        // Ejecutamos el guardado en nuestra API simulada
        await AdminApi.agregarDocente({
            nombre,
            identificador,
            contrasena,
            cursosAsignados
        });

        // Feedback al usuario, cierre de ventanas y actualización visual instantánea
        closeModal();
        toast('Docente guardado y habilitado correctamente');
        await renderAdminDocentes(); 
        
    } catch (error) {
        // En caso de que el correo ya exista, atrapamos el error y mandamos un aviso en pantalla
        toast(error.message || 'Error al intentar registrar al docente');
    }
}
// ==========================================
// EXPORTAR DATOS A EXCEL (DOCENTE) - SEPARADO POR VISTA
// ==========================================
async function exportarExcelDocente(origen) {
    try {
        // Obtener el ID del curso dependiendo de la pestaña
        const selectId = origen === 'asistencia' ? 'attCurso' : 'gradeCurso';
        const idCursoStr = document.getElementById(selectId).value;

        // Validar si seleccionó la opción "Todos mis cursos"
        if (!idCursoStr) {
            toast('⚠️ Por favor, seleccione un curso en específico para exportar');
            return;
        }

        const idCurso = parseInt(idCursoStr);
        const cursoInfo = cacheCursos.find(c => c.idCurso === idCurso);
        const nombreCurso = cursoInfo ? cursoInfo.nombreCurso : 'Curso';

        // 1. Obtener estudiantes del curso (necesario para ambas exportaciones)
        const estudiantes = await DocenteApi.estudiantes(idCurso);
        
        // 2. Preparar el libro de Excel
        const wb = XLSX.utils.book_new();
        let nombreArchivo = '';

        if (origen === 'asistencia') {
            // --- LÓGICA SOLO PARA ASISTENCIA ---
            const asistenciaHistorica = await DocenteApi.asistenciaHistorica(idCurso);
            const asistenciaData = asistenciaHistorica.map(a => {
                const est = estudiantes.find(e => e.idEstudiante === a.idEstudiante);
                return {
                    Estudiante: est ? est.nombre : 'Desconocido',
                    RUT: est ? est.rut : 'Sin RUT',
                    Fecha: a.fecha,
                    Estado: a.estado,
                    Observación: a.observacion || ''
                };
            });

            if (asistenciaData.length > 0) {
                const wsAsistencia = XLSX.utils.json_to_sheet(asistenciaData);
                XLSX.utils.book_append_sheet(wb, wsAsistencia, 'Asistencia');
            } else {
                const wsAsistencia = XLSX.utils.aoa_to_sheet([['Sin registros de asistencia para este curso']]);
                XLSX.utils.book_append_sheet(wb, wsAsistencia, 'Asistencia');
            }
            
            nombreArchivo = `${nombreCurso.replace(/[^a-z0-9]/gi, '_')}_Asistencia_${new Date().toISOString().split('T')[0]}.xlsx`;

        } else if (origen === 'notas') {
            // --- LÓGICA SOLO PARA CALIFICACIONES ---
            const calificaciones = await DocenteApi.calificaciones(idCurso);
            const notasData = calificaciones.map(n => ({
                Estudiante: n.nombreEstudiante,
                RUT: estudiantes.find(e => e.idEstudiante === n.idEstudiante)?.rut || '',
                Asignatura: n.asignatura || n.nombreCurso,
                Evaluación: n.descripcion || n.tipoEvaluacion,
                Nota: parseFloat(n.nota),
                Fecha: n.fechaNota || n.fechaRegistro
            }));

            if (notasData.length > 0) {
                const wsNotas = XLSX.utils.json_to_sheet(notasData);
                XLSX.utils.book_append_sheet(wb, wsNotas, 'Calificaciones');
            } else {
                const wsNotas = XLSX.utils.aoa_to_sheet([['Sin calificaciones registradas para este curso']]);
                XLSX.utils.book_append_sheet(wb, wsNotas, 'Calificaciones');
            }
            
            nombreArchivo = `${nombreCurso.replace(/[^a-z0-9]/gi, '_')}_Notas_${new Date().toISOString().split('T')[0]}.xlsx`;
        }

        // 3. Descargar archivo
        XLSX.writeFile(wb, nombreArchivo);
        toast(`✅ Excel de ${origen} descargado exitosamente`);

    } catch (error) {
        console.error('Error al exportar:', error);
        toast('❌ Error al exportar datos. Revisa la consola.');
    }
}
// ==========================================
// MODALES DE EDICIÓN Y ELIMINACIÓN (ADMIN)
// ==========================================

// --- ESTUDIANTES ---
async function openEditStudentModal(idEstudiante) {
    const estudiante = MOCK_DB.estudiantes.find(e => e.idEstudiante === idEstudiante);
    if (!estudiante) return;

    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 class="font-bold text-gray-900 text-lg">Editar Alumno</h3>
            <button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button>
        </div>
        <form id="formEditStudent" onsubmit="saveEditedStudent(event, ${idEstudiante})" class="p-6 space-y-4">
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input type="text" id="editEstNombre" required value="${estudiante.nombre}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">RUT</label>
                <input type="text" id="editEstRut" required value="${estudiante.rut}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Curso Asignado</label>
                <select id="editEstCurso" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                    ${MOCK_DB.cursos.map(c => {
                        const selected = (c.nombreCurso === estudiante.nombreCurso) ? 'selected' : '';
                        return `<option value="${c.idCurso}" ${selected}>${c.nombreCurso}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="pt-4 flex justify-end gap-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm text-white font-medium">Actualizar Alumno</button>
            </div>
        </form>
    `;
    m.classList.remove('hidden');
}

async function saveEditedStudent(e, idEstudiante) {
    e.preventDefault();
    const idCurso = parseInt(document.getElementById('editEstCurso').value);
    const cursoObj = MOCK_DB.cursos.find(c => c.idCurso === idCurso);
    
    await AdminApi.editarEstudiante(idEstudiante, {
        nombre: document.getElementById('editEstNombre').value,
        rut: document.getElementById('editEstRut').value,
        nombreCurso: cursoObj.nombreCurso,
        curso: cursoObj.nivel + ' ' + cursoObj.paralelo
    });
    closeModal();
    toast('✅ Alumno actualizado');
    await renderAdminEstudiantes();
}

async function deleteStudent(idEstudiante) {
    if(confirm('¿Seguro que desea dar de baja a este alumno?')) {
        await AdminApi.eliminarEstudiante(idEstudiante);
        toast('🗑️ Alumno eliminado del sistema');
        await renderAdminEstudiantes();
    }
}

// --- DOCENTES ---
async function openEditDocenteModal(identificador) {
    const docente = MOCK_DB.users.find(u => u.rol === 'DOCENTE' && u.identificador === identificador);
    if (!docente) return;
    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 class="font-bold text-gray-900 text-lg">Editar Docente</h3>
            <button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button>
        </div>
        <form onsubmit="saveEditedDocente(event, '${identificador}')" class="p-6 space-y-4">
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input type="text" id="editDocNombre" required value="${docente.nombre}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico (Usuario de Acceso)</label>
                <input type="email" id="editDocCorreo" required value="${docente.identificador}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña de Ingreso</label>
                <input type="text" id="editDocContrasena" required value="${docente.contrasena}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
                <p class="text-xs text-gray-400 mt-1">El docente podrá cambiarla después de iniciar sesión</p>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cursos Asignados</label>
                <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-slate-50">
                    ${MOCK_DB.cursos.map(c => {
                        const isChecked = docente.cursosAsignados && docente.cursosAsignados.includes(c.idCurso) ? 'checked' : '';
                        return `
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="editDocCursos" value="${c.idCurso}" ${isChecked} class="text-indigo-600 border-gray-300 rounded"/>
                            <span class="text-sm text-gray-700">${c.nombreCurso}</span>
                        </label>`;
                    }).join('')}
                </div>
            </div>
            <div class="pt-4 flex justify-end gap-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm text-white font-medium">Actualizar Docente</button>
            </div>
        </form>
    `;
    m.classList.remove('hidden');
}

async function saveEditedDocente(e, identificadorOriginal) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="editDocCursos"]:checked');
    const nuevosCursos = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const nuevoCorreo = document.getElementById('editDocCorreo').value.trim();
    const nuevaContrasena = document.getElementById('editDocContrasena').value.trim();
    
    // Validar que el nuevo correo no exista (si es diferente al original)
    if (nuevoCorreo !== identificadorOriginal && MOCK_DB.users.find(u => u.identificador === nuevoCorreo)) {
        toast('❌ Ya existe un usuario con ese correo');
        return;
    }
    
    await AdminApi.editarDocente(identificadorOriginal, {
        nombre: document.getElementById('editDocNombre').value,
        identificador: nuevoCorreo,
        contrasena: nuevaContrasena,
        cursosAsignados: nuevosCursos
    });
    closeModal();
    toast('✅ Docente actualizado');
    await renderAdminDocentes();
}

// --- APODERADOS ---
async function openEditApoderadoModal(identificador) {
    const apoderado = MOCK_DB.users.find(u => u.rol === 'APODERADO' && u.identificador === identificador);
    if (!apoderado) return;
    const m = document.getElementById('modal');
    document.getElementById('modalContent').innerHTML = `
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 class="font-bold text-gray-900 text-lg">Editar Apoderado</h3>
            <button onclick="closeModal()" class="text-gray-400 text-xl hover:text-gray-600">&times;</button>
        </div>
        <form onsubmit="saveEditedApoderado(event, '${identificador}')" class="p-6 space-y-4">
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                <input type="text" id="editApoNombre" required value="${apoderado.nombre}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico (Usuario de Acceso)</label>
                <input type="email" id="editApoCorreo" required value="${apoderado.identificador}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña de Ingreso</label>
                <input type="text" id="editApoContrasena" required value="${apoderado.contrasena}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none"/>
                <p class="text-xs text-gray-400 mt-1">Con esta clave y el correo, el apoderado ingresará al portal.</p>
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Pupilo a Cargo</label>
                <select id="editApoPupilo" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 outline-none">
                    ${MOCK_DB.estudiantes.map(e => {
                        const selected = (e.idEstudiante === apoderado.pupiloId) ? 'selected' : '';
                        return `<option value="${e.idEstudiante}" ${selected}>${e.nombre} - ${e.nombreCurso}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="pt-4 flex justify-end gap-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" class="px-4 py-2 btn-primary rounded-lg text-sm text-white font-medium">Actualizar Apoderado</button>
            </div>
        </form>
    `;
    m.classList.remove('hidden');
}

async function saveEditedApoderado(e, identificadorOriginal) {
    e.preventDefault();
    const nuevoCorreo = document.getElementById('editApoCorreo').value.trim();
    const nuevaContrasena = document.getElementById('editApoContrasena').value.trim();
    
    // Validar que el nuevo correo no exista (si es diferente al original)
    if (nuevoCorreo !== identificadorOriginal && MOCK_DB.users.find(u => u.identificador === nuevoCorreo)) {
        toast('❌ Ya existe un usuario con ese correo');
        return;
    }
    
    await AdminApi.editarApoderado(identificadorOriginal, {
        nombre: document.getElementById('editApoNombre').value,
        identificador: nuevoCorreo,
        contrasena: nuevaContrasena,
        pupiloId: parseInt(document.getElementById('editApoPupilo').value)
    });
    closeModal();
    toast('✅ Apoderado actualizado');
    await renderAdminApoderados();
}

