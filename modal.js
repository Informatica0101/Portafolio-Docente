// URL del microservicio de Google Apps Script
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyUsYUCXkEOxIpukZnZU_aVjF9Y_GnaGgRcgIlv9rE5r6nTQY7DPVWVX7Xs553GyFo/exec';

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
        container.innerHTML = `<p class="text-danger">Error al cargar sílabos. Verifique la configuración del microservicio.</p>`;
        return;
    }

    container.innerHTML = '';
    silabos.forEach(silabo => {
        const card = document.createElement('div');
        card.className = 'col-md-6';
        const isWeb = silabo.asignatura.nombre_asignatura.toLowerCase().includes('web');

        card.innerHTML = `
            <div class="card subject-card h-100 ${isWeb ? 'web' : ''}">
                <div class="card-body">
                    <h5 class="card-title">${silabo.asignatura.grado} - ${silabo.asignatura.nombre_asignatura} Sección ${silabo.asignatura.seccion}</h5>
                    <h6 class="card-subtitle mb-3 text-muted">${silabo.nombre_silabo} - ${silabo.parcial} Parcial</h6>
                    <p class="card-text">
                        ${silabo.observaciones || 'Sílabo para la asignatura de ' + silabo.asignatura.nombre_asignatura + '.'}
                    </p>
                    <div class="mt-4">
                        <a href="Portafolio/Silabos/Silabo_Unified.html?id=${silabo.silabo_id}" class="btn btn-primary">
                            <i class="bi bi-file-earmark-text me-1"></i> Ver Sílabo Completo
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
        console.error(data.error);
        return;
    }

    const { silabo, unidades } = data;

    // Actualizar encabezado (Soporta IDs específicos o selectores genéricos)
    const titleElement = document.getElementById('syllabus-title') || document.querySelector('h1');
    if (titleElement) titleElement.textContent = silabo.nombre_silabo.toUpperCase();

    const courseInfo = document.getElementById('course-info-container') || document.querySelector('.course-info');
    if (courseInfo) {
        courseInfo.innerHTML = `
            <div class="row text-start small">
                <div class="col-md-6 mb-2"><strong>Fecha de inicio:</strong> ${silabo.fecha_inicio}</div>
                <div class="col-md-6 mb-2"><strong>Fecha de cierre:</strong> ${silabo.fecha_cierre}</div>
                <div class="col-md-6 mb-2"><strong>Asignatura:</strong> ${silabo.asignatura.nombre_asignatura}</div>
                <div class="col-md-6 mb-2"><strong>Área:</strong> ${silabo.asignatura.area}</div>
                <div class="col-md-6 mb-2"><strong>Grado:</strong> ${silabo.asignatura.grado} "${silabo.asignatura.seccion}"</div>
                <div class="col-md-6 mb-2"><strong>Docente:</strong> ${silabo.asignatura.docente}</div>
            </div>
        `;
    }

    const tbody = document.getElementById('syllabus-body') || document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    unidades.forEach(unidad => {
        unidad.clases.forEach(clase => {
            const tr = document.createElement('tr');

            // Tema
            const tdTema = document.createElement('td');
            tdTema.innerHTML = `<a href="#" class="topic-link fw-bold text-primary text-decoration-none" onclick="loadClassPlan('${clase.clase_id}')">${clase.tema}</a>`;
            tr.appendChild(tdTema);

            // Asignacion
            const tdAsig = document.createElement('td');
            tdAsig.textContent = clase.asignacion ? clase.asignacion.titulo_asignacion : 'N/A';
            tr.appendChild(tdAsig);

            // Criterios
            const tdCriterios = document.createElement('td');
            if (clase.asignacion && clase.asignacion.criterios && clase.asignacion.criterios.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'list-unstyled small mb-0';
                clase.asignacion.criterios.forEach(cr => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="bi bi-check-short"></i> ${cr.criterio}`;
                    ul.appendChild(li);
                });
                tdCriterios.appendChild(ul);
            }
            tr.appendChild(tdCriterios);

            // Fecha
            const tdFecha = document.createElement('td');
            tdFecha.innerHTML = `
                <div class="d-flex justify-content-between small">
                    <div class="flex-fill text-center border-end pe-1">${clase.fecha_clase}</div>
                    <div class="flex-fill text-center ps-1">${clase.asignacion ? clase.asignacion.fecha_entrega : '-'}</div>
                </div>
            `;
            tr.appendChild(tdFecha);

            // Puntaje
            const tdPuntaje = document.createElement('td');
            tdPuntaje.className = 'text-center';
            tdPuntaje.textContent = clase.asignacion ? `${clase.asignacion.tipo} ${clase.asignacion.ponderacion}` : '-';
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

    modalTitle.textContent = `Detalle del Plan: ${clase.tema}`;

    const etapas = [
        { nombre: 'Pre-saberes', estrategia: clase.pre_saberes },
        { nombre: 'Actividad Guiada', estrategia: clase.actividad_guiada },
        { nombre: 'Actividad Independiente', estrategia: clase.actividad_independiente }
    ];

    let etapasHTML = '';
    etapas.forEach(etapa => {
        etapasHTML += `
            <tr>
                <td class="fw-bold bg-light">${etapa.nombre}</td>
                <td>${etapa.estrategia}</td>
                <td>Recursos Varios</td>
            </tr>
        `;
    });

    let presentationLink = '';
    const pres = recursos.find(r => r.tipo_recurso.toLowerCase().includes('presentacion'));
    if (pres) {
        presentationLink = `
            <div class="alert alert-info mt-3">
                <h5 class="alert-heading h6"><i class="bi bi-display me-2"></i>Presentación de Clase</h5>
                <a href="${pres.descripcion}" target="_blank" class="btn btn-outline-info btn-sm">
                    Ver presentación de esta clase
                </a>
            </div>
        `;
    }

    let asignacionesHTML = '';
    if (asignaciones && asignaciones.length > 0) {
        asignacionesHTML = '<div class="mt-4"><h5><i class="bi bi-pencil-square me-2"></i>Asignaciones</h5>';
        asignaciones.forEach(asig => {
            asignacionesHTML += `
                <div class="card mb-2 border-0 bg-light p-3">
                    <p class="mb-1"><strong>${asig.titulo_asignacion}:</strong> ${asig.descripcion}</p>
                    <p class="small text-muted mb-0">Tipo: ${asig.tipo} | Ponderación: ${asig.ponderacion} | Entrega: ${asig.fecha_entrega}</p>
                </div>
            `;
        });
        asignacionesHTML += '</div>';
    }

    modalBody.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-12">
                <h5><i class="bi bi-info-circle me-2"></i>Información General</h5>
                <div class="table-responsive">
                    <table class="table table-sm table-bordered mb-0">
                        <tr><td class="bg-light fw-bold" style="width: 30%;">Docente</td><td>${asignatura ? asignatura.docente : 'Pablo Antonio Peña Mancia'}</td></tr>
                        <tr><td class="bg-light fw-bold">Período</td><td>${asignatura ? asignatura.periodo : 'N/A'}</td></tr>
                        <tr><td class="bg-light fw-bold">Grado</td><td>${asignatura ? asignatura.grado + ' "' + asignatura.seccion + '"' : 'N/A'}</td></tr>
                        <tr><td class="bg-light fw-bold">Asignatura</td><td>${asignatura ? asignatura.nombre_asignatura : 'N/A'}</td></tr>
                        <tr><td class="bg-light fw-bold">Fecha</td><td>${clase.fecha_clase}</td></tr>
                    </table>
                </div>
            </div>
        </div>

        <div class="mb-4">
            <h5><i class="bi bi-bullseye me-2"></i>Competencia de la Unidad</h5>
            <div class="p-3 bg-light rounded">${unidad ? unidad.competencia_unidad : 'N/A'}</div>
        </div>

        <div class="mb-4">
            <h5><i class="bi bi-award me-2"></i>Indicador de logro</h5>
            <div class="p-3 bg-light rounded">${clase.indicador_logro}</div>
        </div>

        <div class="mb-4">
            <h5><i class="bi bi-layers me-2"></i>Etapas de la Clase</h5>
            <div class="table-responsive">
                <table class="table table-bordered mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th>ETAPAS</th>
                            <th>ESTRATEGIAS DE ENSEÑANZA APRENDIZAJE</th>
                            <th>RECURSOS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${etapasHTML}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="mb-4">
            <h5><i class="bi bi-chat-left-quote me-2"></i>Síntesis del Tema</h5>
            <div class="p-3 bg-light rounded">${clase.sintesis_tema || 'N/A'}</div>
        </div>

        ${asignacionesHTML}
        ${presentationLink}

        <div class="text-center mt-4">
            <button class="btn btn-secondary px-4" id="closeModalBtn">Cerrar</button>
        </div>
    `;

    modal.style.display = 'block';

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modal.style.display = 'none';
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

    if (filter === 'all') {
        filteredEvidences = [...evidences];
        const title = document.getElementById('evidence-title');
        if (title) title.textContent = 'Evidencias de Trabajos Estudiantiles';
    } else {
        filteredEvidences = evidences.filter(evidence => evidence.filter === filter);
        const title = document.getElementById('evidence-title');
        if (title) {
            if (filter === 'programacion') {
                title.textContent = 'Evidencias - Programación (Undécimo)';
            } else if (filter === 'diseño-web') {
                title.textContent = 'Evidencias - Diseño Web I (Duodécimo)';
            } else if (filter === 'otros') {
                title.textContent = 'Evidencias - Otras Asignaturas';
            }
        }
    }

    document.querySelectorAll('[data-filter]').forEach(button => {
        if (button.dataset.filter === filter) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
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
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);

                    if (targetElement) {
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
                e.target.style.maxHeight = '200px';
                e.target.style.width = 'auto';
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
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});
