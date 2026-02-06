// Configuración global para planes de clase
const PLAN_CONFIG = {
    'diseño-web': {
        file: 'Portafolio/Planes/Planes_DW_parcial_1.html',
        presentations: {
            'Introducción a HTML': 'https://informatica0101.github.io/IMA-Informatica/III_BTP_A/introduccion_diseno_web.html'
        }
    },
    'programacion': {
        file: 'Portafolio/Planes/Planes_Programacion_parcial_1.html',
        presentations: {
            'Introducción a la Programación': 'https://informatica0101.github.io/IMA-Informatica/II_BTP_A/Programacion/introduccion_programacion.html'
        }
    }
};

// Datos de evidencias para el carrusel
const evidences = [
    {
        id: 1,
        title: "Línea de tiempo de la programación",
        description: "Evidencia de estudiantes de Undécimo creando su primer tarea.",
        filter: "programacion",
        imageUrl: "imagenes/Evidencias/Linea_tiempo.PNG"
    },
    {
        id: 2,
        title: "Línea de tiempo de la programación",
        description: "Evidencia de estudiantes de Undécimo creando su primer tarea.",
        filter: "programacion",
        imageUrl: "imagenes/Evidencias/Linea_tiempo2.PNG"
    },
    {
        id: 3,
        title: "Introducción a Diseño Web",
        description: "Cuadro conceptual de términos en el desarrollo web.",
        filter: "diseño-web",
        imageUrl: "imagenes/Evidencias/cuadro.PNG"
    }
];

// Variables globales para el carrusel
let currentFilter = 'all';
let filteredEvidences = [...evidences];
let carouselInstance = null;

// Función para cargar plan de clase dinámicamente
async function loadClassPlan(subject, topic, weekIndex) {
    const config = PLAN_CONFIG[subject];
    if (!config) return;
    
    try {
        const response = await fetch(config.file);
        const html = await response.text();
        
        // Extraer solo el contenido relevante del plan
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Buscar el plan específico por semana
        const scriptContent = doc.querySelector('script').textContent;
        const planMatch = scriptContent.match(/const classPlans = (\[[\s\S]*?\]);/);
        
        if (planMatch) {
            const classPlans = eval(planMatch[1]);
            const plan = classPlans[weekIndex];
            
            if (plan) {
                displayPlanModal(plan, config.presentations[topic]);
            }
        }
    } catch (error) {
        console.error('Error al cargar el plan:', error);
        alert('Error al cargar el plan de clase. Por favor, intente nuevamente.');
    }
}

// Función para mostrar el modal con el plan
function displayPlanModal(plan, presentationUrl) {
    const modal = document.getElementById('planModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `Semana ${plan.week}: ${plan.topic}`;
    
    let etapasHTML = '';
    plan.details.etapas.forEach(etapa => {
        etapasHTML += `
            <tr>
                <td>${etapa.etapa}</td>
                <td>${etapa.estrategia}</td>
                <td>${etapa.recursos}</td>
            </tr>
        `;
    });
    
    let presentationLink = '';
    if (presentationUrl) {
        presentationLink = `
            <div class="plan-detail">
                <h3>Presentación de Clase</h3>
                <a href="${presentationUrl}" target="_blank" class="presentation-link">
                    Ver presentación de esta clase
                </a>
            </div>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="plan-detail">
            <h3>Información General</h3>
            <table class="detail-table">
                <tr><td>Docente</td><td>${plan.details.docente}</td></tr>
                <tr><td>Período</td><td>${plan.details.periodo}</td></tr>
                <tr><td>Grado</td><td>${plan.details.grado}</td></tr>
                <tr><td>Asignatura</td><td>${plan.details.asignatura}</td></tr>
                <tr><td>Fecha</td><td>${plan.details.fecha}</td></tr>
            </table>
        </div>
        
        <div class="plan-detail">
            <h3>Competencia de la Unidad</h3>
            <p>${plan.details.competencia}</p>
        </div>
        
        <div class="plan-detail">
            <h3>Indicador de logro</h3>
            <p>${plan.details.indicador}</p>
        </div>
        
        <div class="plan-detail">
            <h3>Etapas de la Clase</h3>
            <table class="stages-table">
                <thead>
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
        
        <div class="plan-detail">
            <h3>Asignación de Tareas</h3>
            <p>${plan.details.tareas}</p>
        </div>
        
        ${presentationLink}
        
        <div class="plan-detail">
            <h3>Evaluación</h3>
            <table class="detail-table">
                <tr><td>Criterios de Evaluación</td><td>${plan.details.criterios}</td></tr>
                <tr><td>Fecha de entrega</td><td>${plan.details.entrega}</td></tr>
                <tr><td>Ponderación</td><td>${plan.details.ponderacion}</td></tr>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button class="btn btn-secondary" id="closeModalBtn">Cerrar</button>
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
        
        carouselItem.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <img src="${evidence.imageUrl}" class="img-fluid" alt="${evidence.title}" style="max-height: 300px; width: auto;">
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
    carouselInstance = new bootstrap.Carousel(carouselElement, {
        interval: 5000,
        wrap: true
    });
}

// Función para filtrar evidencias
function filterEvidences(filter) {
    currentFilter = filter;
    
    if (filter === 'all') {
        filteredEvidences = [...evidences];
        document.getElementById('evidence-title').textContent = 'Evidencias de Trabajos Estudiantiles';
    } else {
        filteredEvidences = evidences.filter(evidence => evidence.filter === filter);
        
        if (filter === 'programacion') {
            document.getElementById('evidence-title').textContent = 'Evidencias - Programación (Undécimo)';
        } else if (filter === 'diseño-web') {
            document.getElementById('evidence-title').textContent = 'Evidencias - Diseño Web I (Duodécimo)';
        } else if (filter === 'otros') {
            document.getElementById('evidence-title').textContent = 'Evidencias - Otras Asignaturas';
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
                        if (navbarCollapse.classList.contains('show')) {
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
        document.getElementById('closeModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});