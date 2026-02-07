// URL del microservicio de Google Apps Script
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwuBwbYLiv81_DIpF2IvE-F7RwEdqDqNrhIhtTRCi18w4PG1OY21pE8PSKlGFsBrx0/exec';

// Función genérica para consumir el microservicio
async function fetchFromGAS(action, params = {}) {
    const url = new URL(GAS_URL);
    url.searchParams.append('action', action);
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }

    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error fetching from GAS:', error);
        return { error: error.message };
    }
}

// Ayudante para formatear fechas a dd/mm/aaaa
function formatDate(dateStr) {
    if (!dateStr) return '-';
    // Si ya tiene el formato correcto, devolverlo
    if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        // Usar componentes UTC para evitar desfases horarios
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();

        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateStr;
    }
}

// Datos de evidencias para el carrusel
const evidences = [
    {
        id: 1,
        title: "Línea de tiempo de la programación",
        description: "Evidencia de estudiantes de Undécimo creando su primer tarea.",
        filter: "programacion",
        imageUrl: "../../imagenes/Evidencias/Linea_tiempo.PNG"
    },
    {
        id: 2,
        title: "Línea de tiempo de la programación",
        description: "Evidencia de estudiantes de Undécimo creando su primer tarea.",
        filter: "programacion",
        imageUrl: "../../imagenes/Evidencias/Linea_tiempo2.PNG"
    },
    {
        id: 3,
        title: "Introducción a Diseño Web",
        description: "Cuadro conceptual de términos en el desarrollo web.",
        filter: "diseño-web",
        imageUrl: "../../imagenes/Evidencias/cuadro.PNG"
    }
];

// Corregir rutas de imágenes para index.html vs subcarpetas
function getCorrectImagePath(path) {
    const isSubfolder = window.location.pathname.includes('/Portafolio/');
    if (isSubfolder) {
        return path;
    } else {
        return path.replace('../../', '');
    }
}

// Variables globales para el carrusel
let currentFilter = 'all';
let filteredEvidences = [...evidences];
let carouselInstance = null;

// Función para renderizar los sílabos en index.html
async function renderSilabos() {
    const container = document.getElementById('silabos-container');
    if (!container) return;

    const silabos = await fetchFromGAS('getSilabos');
    if (silabos.error) {
        container.innerHTML = `<div class="col-12 alert alert-danger">Error al cargar sílabos: ${silabos.error}</div>`;
        return;
    }

    container.innerHTML = '';
    silabos.forEach(silabo => {
        const card = document.createElement('div');
        card.className = 'col-md-6 mb-4';
        const isWeb = silabo.asignatura.nombre_asignatura.toLowerCase().includes('web');

        card.innerHTML = `
            <div class="card subject-card h-100 ${isWeb ? 'web' : ''} shadow-sm border-0">
                <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <span class="badge bg-primary rounded-pill px-3">${silabo.asignatura.grado}</span>
                        <span class="text-muted small">${silabo.parcial} Parcial</span>
                    </div>
                    <h5 class="card-title fw-bold text-dark">${silabo.asignatura.nombre_asignatura} - ${silabo.asignatura.seccion}</h5>
                    <p class="card-text text-secondary mt-3">
                        ${silabo.observaciones || 'Planificación curricular detallada para la asignatura.'}
                    </p>
                    <div class="mt-4 pt-3 border-top">
                        <a href="Portafolio/Silabos/Silabo_Unified.html?id=${silabo.silabo_id}" class="btn btn-primary w-100 rounded-pill">
                            <i class="bi bi-file-earmark-ruled me-2"></i>Ver Sílabo Completo
                        </a>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Función para renderizar la tabla de un sílabo específico
async function renderSyllabusTable(silaboId) {
    const data = await fetchFromGAS('getSyllabusContent', { silabo_id: silaboId });
    if (data.error) {
        const container = document.querySelector('.syllabus-container');
        if (container) {
            container.innerHTML = `<div class="alert alert-danger m-4">Error al obtener contenido: ${data.error}</div>`;
        }
        return;
    }

    const { silabo, unidades } = data;

    const titleElement = document.getElementById('syllabus-title');
    if (titleElement) titleElement.textContent = silabo.nombre_silabo.toUpperCase();

    const courseInfo = document.getElementById('course-info-container');
    if (courseInfo) {
        courseInfo.innerHTML = `
            <div class="course-info p-4 rounded-3 mb-4 shadow-sm border-0">
                <div class="row g-3">
                    <div class="col-md-4">
                        <p class="mb-1 text-muted small text-uppercase fw-bold">Asignatura</p>
                        <p class="mb-0 fw-bold">${silabo.asignatura.nombre_asignatura}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="mb-1 text-muted small text-uppercase fw-bold">Grado y Sección</p>
                        <p class="mb-0 fw-bold">${silabo.asignatura.grado} "${silabo.asignatura.seccion}"</p>
                    </div>
                    <div class="col-md-4">
                        <p class="mb-1 text-muted small text-uppercase fw-bold">Docente</p>
                        <p class="mb-0 fw-bold">${silabo.asignatura.docente}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="mb-1 text-muted small text-uppercase fw-bold">Fecha de Inicio</p>
                        <p class="mb-0 fw-bold">${formatDate(silabo.fecha_inicio)}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="mb-1 text-muted small text-uppercase fw-bold">Fecha de Cierre</p>
                        <p class="mb-0 fw-bold">${formatDate(silabo.fecha_cierre)}</p>
                    </div>
                    <div class="col-md-4">
                        <p class="mb-1 text-muted small text-uppercase fw-bold">Parcial</p>
                        <p class="mb-0 fw-bold">${silabo.parcial} Parcial</p>
                    </div>
                </div>
            </div>
        `;
    }

    const tbody = document.getElementById('syllabus-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (unidades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-5">No hay unidades registradas para este sílabo.</td></tr>';
        return;
    }

    unidades.forEach(unidad => {
        // Fila de Encabezado de Unidad
        const trUnidad = document.createElement('tr');
        trUnidad.className = 'table-light fw-bold';
        trUnidad.innerHTML = `<td colspan="5" class="bg-light p-3"><i class="bi bi-bookmark-star-fill text-primary me-2"></i>Unidad: ${unidad.nombre_unidad}</td>`;
        tbody.appendChild(trUnidad);

        unidad.clases.forEach(clase => {
            const tr = document.createElement('tr');

            // Tema
            const tdTema = document.createElement('td');
            tdTema.innerHTML = `<a href="#" class="topic-link" onclick="loadClassPlan('${clase.clase_id}')">${clase.tema}</a>`;
            tr.appendChild(tdTema);

            // Asignacion
            const tdAsig = document.createElement('td');
            tdAsig.textContent = clase.asignacion ? clase.asignacion.titulo_asignacion : 'N/A';
            tr.appendChild(tdAsig);

            // Criterios
            const tdCriterios = document.createElement('td');
            if (clase.asignacion && clase.asignacion.criterios && clase.asignacion.criterios.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'list-unstyled mb-0 small';
                clase.asignacion.criterios.forEach(cr => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="bi bi-check2 text-success me-1"></i> ${cr.criterio}`;
                    ul.appendChild(li);
                });
                tdCriterios.appendChild(ul);
            } else {
                tdCriterios.innerHTML = '<span class="text-muted italic small">Sin criterios definidos</span>';
            }
            tr.appendChild(tdCriterios);

            // Fecha
            const tdFecha = document.createElement('td');
            tdFecha.innerHTML = `
                <div class="d-flex justify-content-between align-items-center small">
                    <div class="text-center flex-fill border-end pe-1" title="Fecha de Ejecución">${formatDate(clase.fecha_clase)}</div>
                    <div class="text-center flex-fill ps-1" title="Fecha de Entrega">${clase.asignacion ? formatDate(clase.asignacion.fecha_entrega) : '-'}</div>
                </div>
            `;
            tr.appendChild(tdFecha);

            // Puntaje
            const tdPuntaje = document.createElement('td');
            tdPuntaje.className = 'text-center fw-bold';
            tdPuntaje.textContent = clase.asignacion ? `${clase.asignacion.ponderacion}` : '-';
            tr.appendChild(tdPuntaje);

            tbody.appendChild(tr);
        });
    });
}

// Función para cargar plan de clase desde el microservicio
async function loadClassPlan(claseId) {
    const data = await fetchFromGAS('getPlanDetails', { clase_id: claseId });
    if (data.error) {
        alert('Error al cargar el plan: ' + data.error);
        return;
    }

    displayPlanModal(data);
}

// Función para mostrar el modal con el plan
function displayPlanModal(data) {
    const { clase, recursos, asignaciones, unidad, asignatura } = data;
    const modal = document.getElementById('planModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = `PLAN DE CLASE: ${clase.tema}`;

    const etapas = [
        { nombre: 'Pre-saberes', estrategia: clase.pre_saberes, ic: 'bi-lightbulb' },
        { nombre: 'Actividad Guiada', estrategia: clase.actividad_guiada, ic: 'bi-person-video3' },
        { nombre: 'Actividad Independiente', estrategia: clase.actividad_independiente, ic: 'bi-pencil-fill' }
    ];

    let etapasHTML = '';
    etapas.forEach(etapa => {
        etapasHTML += `
            <tr>
                <td class="fw-bold bg-light" style="width: 25%;"><i class="bi ${etapa.ic} me-2 text-primary"></i>${etapa.nombre}</td>
                <td class="p-3">${etapa.estrategia || 'N/A'}</td>
                <td class="p-3 text-center"><span class="badge bg-secondary">Recursos Varios</span></td>
            </tr>
        `;
    });

    // Carga de TODOS los recursos
    let recursosHTML = '';
    if (recursos && recursos.length > 0) {
        recursosHTML = '<div class="plan-section mt-4"><h3><i class="bi bi-box-seam me-2"></i>Recursos Didácticos</h3><div class="list-group list-group-flush border rounded shadow-sm">';
        recursos.forEach(r => {
            const isLink = r.descripcion.startsWith('http');
            const icon = r.tipo_recurso.toLowerCase().includes('presentacion') ? 'bi-display' : 'bi-file-earmark';

            recursosHTML += `
                <div class="list-group-item d-flex justify-content-between align-items-center p-3">
                    <div>
                        <i class="bi ${icon} text-primary me-3 fs-5"></i>
                        <span class="fw-bold">${r.tipo_recurso}:</span>
                        <span class="text-secondary ms-1">${isLink ? 'Enlace externo' : r.descripcion}</span>
                    </div>
                    ${isLink ? `<a href="${r.descripcion}" target="_blank" class="btn btn-sm btn-outline-primary rounded-pill px-3">Abrir Recurso</a>` : ''}
                </div>
            `;
        });
        recursosHTML += '</div></div>';
    } else {
        recursosHTML = '<div class="plan-section mt-4"><h3><i class="bi bi-box-seam me-2"></i>Recursos Didácticos</h3><p class="text-muted italic p-3 bg-light rounded">No se han registrado recursos adicionales para esta clase.</p></div>';
    }

    let asignacionesHTML = '';
    if (asignaciones && asignaciones.length > 0) {
        asignacionesHTML = '<div class="plan-section"><h3><i class="bi bi-journal-check me-2"></i>Asignaciones y Tareas</h3>';
        asignaciones.forEach(asig => {
            asignacionesHTML += `
                <div class="card mb-3 border-0 bg-light shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h6 class="fw-bold text-primary mb-2">${asig.titulo_asignacion}</h6>
                            <span class="badge bg-info text-dark">${asig.ponderacion}</span>
                        </div>
                        <p class="mb-2 small text-dark">${asig.descripcion}</p>
                        <div class="d-flex gap-3 small text-muted">
                            <span><i class="bi bi-tag me-1"></i>${asig.tipo}</span>
                            <span><i class="bi bi-calendar-event me-1"></i>Entrega: ${formatDate(asig.fecha_entrega)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        asignacionesHTML += '</div>';
    }

    modalBody.innerHTML = `
        <div class="plan-section">
            <h3><i class="bi bi-info-circle me-2"></i>Información de la Clase</h3>
            <div class="table-responsive rounded-3 border shadow-sm">
                <table class="table table-sm detail-table mb-0">
                    <tr><td>Docente</td><td>${asignatura ? asignatura.docente : 'Pablo Antonio Peña Mancia'}</td></tr>
                    <tr><td>Asignatura / Grado</td><td>${asignatura ? asignatura.nombre_asignatura + ' - ' + asignatura.grado + ' "' + asignatura.seccion + '"' : 'N/A'}</td></tr>
                    <tr><td>Unidad Curricular</td><td>${unidad ? unidad.nombre_unidad : 'N/A'}</td></tr>
                    <tr><td>Fecha de Clase</td><td><span class="badge bg-primary">${formatDate(clase.fecha_clase)}</span></td></tr>
                </table>
            </div>
        </div>

        <div class="plan-section">
            <h3><i class="bi bi-bullseye me-2"></i>Competencias e Indicadores</h3>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="p-3 bg-light rounded border-start border-4 border-primary h-100">
                        <p class="small text-uppercase fw-bold text-primary mb-1">Competencia de la Unidad</p>
                        <p class="mb-0 small">${unidad ? unidad.competencia_unidad : 'N/A'}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="p-3 bg-light rounded border-start border-4 border-success h-100">
                        <p class="small text-uppercase fw-bold text-success mb-1">Indicador de Logro</p>
                        <p class="mb-0 small">${clase.indicador_logro || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="plan-section">
            <h3><i class="bi bi-layers-half me-2"></i>Secuencia Didáctica</h3>
            <div class="table-responsive rounded-3 border shadow-sm">
                <table class="table table-bordered mb-0 stages-table">
                    <thead class="table-dark small text-uppercase">
                        <tr>
                            <th>Fase</th>
                            <th>Estrategia de Aprendizaje</th>
                            <th>Recursos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${etapasHTML}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="plan-section">
            <h3><i class="bi bi-file-earmark-text me-2"></i>Síntesis del Contenido</h3>
            <div class="p-3 bg-white border rounded shadow-sm">
                <p class="mb-0">${clase.sintesis_tema || 'Resumen no disponible para esta sesión.'}</p>
            </div>
        </div>

        ${asignacionesHTML}
        ${recursosHTML}

        <div class="text-center mt-5">
            <button class="btn btn-secondary rounded-pill px-5 py-2 shadow-sm" id="closeModalBtn">
                <i class="bi bi-x-lg me-2"></i>Cerrar Detalle
            </button>
        </div>
    `;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Función para inicializar el carrusel
function initCarousel(evidenceList) {
    const carouselInner = document.getElementById('carousel-inner');
    const carouselIndicators = document.querySelector('.carousel-indicators');

    if (!carouselInner || !carouselIndicators) return;

    carouselInner.innerHTML = '';
    carouselIndicators.innerHTML = '';

    if (evidenceList.length === 0) {
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <div class="d-flex align-items-center justify-content-center h-100">
                    <p class="text-muted">No hay evidencias disponibles para este filtro.</p>
                </div>
            </div>
        `;
        return;
    }

    evidenceList.forEach((evidence, index) => {
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.dataset.bsTarget = '#evidenceCarousel';
        indicator.dataset.bsSlideTo = index;
        indicator.ariaLabel = `Slide ${index + 1}`;
        if (index === 0) indicator.classList.add('active');

        carouselIndicators.appendChild(indicator);

        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        carouselItem.dataset.filter = evidence.filter;

        const imgPath = getCorrectImagePath(evidence.imageUrl);

        carouselItem.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <img src="${imgPath}" class="img-fluid" alt="${evidence.title}" style="max-height: 300px; width: auto;">
            </div>
            <div class="carousel-caption d-none d-md-block">
                <h5>${evidence.title}</h5>
                <p>${evidence.description}</p>
            </div>
        `;

        carouselInner.appendChild(carouselItem);
    });

    if (carouselInstance) {
        carouselInstance.dispose();
    }

    const carouselElement = document.getElementById('evidenceCarousel');
    if (carouselElement && typeof bootstrap !== 'undefined') {
        carouselInstance = new bootstrap.Carousel(carouselElement, {
            interval: 5000,
            wrap: true
        });
    }
}

// Función para filtrar evidencias
function filterEvidences(filter) {
    currentFilter = filter;

    const titleMap = {
        'all': 'Evidencias de Trabajos Estudiantiles',
        'programacion': 'Evidencias - Programación (Undécimo)',
        'diseño-web': 'Evidencias - Diseño Web I (Duodécimo)',
        'otros': 'Evidencias - Otras Asignaturas'
    };

    filteredEvidences = filter === 'all' ? [...evidences] : evidences.filter(evidence => evidence.filter === filter);

    const title = document.getElementById('evidence-title');
    if (title) title.textContent = titleMap[filter] || titleMap['all'];

    document.querySelectorAll('[data-filter]').forEach(button => {
        button.classList.toggle('active', button.dataset.filter === filter);
    });

    initCarousel(filteredEvidences);
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sílabos en index.html
    if (document.getElementById('silabos-container')) {
        renderSilabos();
    }

    // Inicializar carrusel si existe
    if (document.getElementById('evidenceCarousel')) {
        initCarousel(evidences);

        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.dataset.filter;
                filterEvidences(filter);
            });
        });

        // Smooth scroll para enlaces internos
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                if (this.getAttribute('href') !== '#') {
                    const targetId = this.getAttribute('href').split('#')[1];
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        e.preventDefault();
                        window.scrollTo({
                            top: targetElement.offsetTop - 70,
                            behavior: 'smooth'
                        });

                        const navbarCollapse = document.getElementById('navbarNav');
                        if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                            new bootstrap.Collapse(navbarCollapse, {toggle: true});
                        }
                    }
                }
            });
        });

        // Manejar errores de imágenes
        document.addEventListener('error', function(e) {
            if (e.target.tagName === 'IMG' && e.target.closest('#evidenceCarousel')) {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                e.target.alt = 'Imagen no disponible';
            }
        }, true);
    }

    // Configurar cierre de modal
    const modal = document.getElementById('planModal');
    if (modal) {
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
});
