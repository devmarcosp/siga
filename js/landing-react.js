(function () {
    'use strict';

    const rootElement = document.getElementById('siga-react-experience');
    if (!rootElement || !window.React || !window.ReactDOM) return;

    const h = React.createElement;
    const profiles = {
        directivo: {
            label: 'Dirección', greeting: 'Buenos días, Daniela', accent: '#ff6b4a',
            stats: [['92%', 'Asistencia'], ['418', 'Estudiantes'], ['07', 'Alertas']],
            activity: [['7° Básico A', 'Asistencia registrada', 'Ahora'], ['4° Medio B', 'Notas actualizadas', '10:24'], ['2° Básico', 'Nueva comunicación', '09:48']]
        },
        docente: {
            label: 'Docencia', greeting: 'Buenos días, Javier', accent: '#c7f36b',
            stats: [['06', 'Cursos'], ['28', 'Clases semana'], ['04', 'Pendientes']],
            activity: [['8° Básico B', 'Clase a las 10:30', 'Próxima'], ['1° Medio A', 'Asistencia completa', '09:15'], ['3° Medio C', 'Evaluación publicada', 'Ayer']]
        },
        familia: {
            label: 'Familia', greeting: 'Hola, Francisca', accent: '#68d7e8',
            stats: [['94%', 'Asistencia'], ['6,4', 'Promedio'], ['02', 'Mensajes']],
            activity: [['Matemática', 'Nueva calificación: 6,7', 'Hoy'], ['Lenguaje', 'Lectura para el viernes', 'Hoy'], ['Inspectoría', 'Asistencia confirmada', 'Ayer']]
        }
    };

    function Experience() {
        const [active, setActive] = React.useState('directivo');
        const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
        const data = profiles[active];

        function onMove(event) {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setTilt({ x: ((event.clientY - rect.top) / rect.height - 0.5) * -7, y: ((event.clientX - rect.left) / rect.width - 0.5) * 7 });
        }

        return h('div', { className: 'react-stage', onMouseMove: onMove, onMouseLeave: () => setTilt({ x: 0, y: 0 }) },
            h('div', { className: 'react-dashboard', style: { '--panel-accent': data.accent, transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` } },
                h('div', { className: 'dash-browser' }, h('i'), h('i'), h('i'), h('span', null, 'app.siga.cl')),
                h('div', { className: 'dash-body' },
                    h('aside', { className: 'demo-sidebar' },
                        h('div', { className: 'demo-logo' }, h('img', { src: 'src/logo-siga.png', alt: '' })),
                        ['⌂', '◫', '✓', '◌', '⋯'].map((icon, i) => h('span', { className: i === 0 ? 'active' : '', key: icon + i }, icon))
                    ),
                    h('div', { className: 'demo-main' },
                        h('div', { className: 'profile-switch', role: 'group', 'aria-label': 'Cambiar vista de demostración' },
                            Object.entries(profiles).map(([key, profile]) => h('button', { key, className: key === active ? 'active' : '', onClick: () => setActive(key), 'aria-pressed': key === active }, profile.label))
                        ),
                        h('div', { className: 'demo-heading' }, h('div', null, h('small', null, 'MIÉRCOLES, 15 DE JULIO'), h('h3', null, data.greeting)), h('span', null, '● En línea')),
                        h('div', { className: 'demo-stats' }, data.stats.map(([value, label], i) => h('div', { key: label, className: i === 0 ? 'featured' : '' }, h('strong', null, value), h('small', null, label)))),
                        h('div', { className: 'demo-activity' }, h('div', { className: 'activity-title' }, h('strong', null, 'Actividad reciente'), h('span', null, 'Ver todo →')), data.activity.map(([title, text, time], i) => h('div', { className: 'activity-row', key: title }, h('i', { style: { opacity: 1 - i * 0.2 } }), h('span', null, h('b', null, title), h('small', null, text)), h('time', null, time))))
                    )
                )
            )
        );
    }

    ReactDOM.createRoot(rootElement).render(h(Experience));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('is-visible'));
    }, { threshold: 0.18 });
    document.querySelectorAll('.reveal-on-scroll').forEach(element => observer.observe(element));
})();
