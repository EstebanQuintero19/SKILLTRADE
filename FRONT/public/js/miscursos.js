// Configuración de la API
const API_BASE_URL = 'http://localhost:9090/api';

// Función para obtener el token de autenticación
function getAuthToken() {
    // Priorizar token de sesión del servidor
    if (window.sessionData && window.sessionData.token) {
        return window.sessionData.token;
    }
    // Fallback a localStorage para compatibilidad
    return localStorage.getItem('authToken');
}

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Función para crear curso
document.getElementById("formCrearCurso").addEventListener("submit", async function (e) {
    e.preventDefault();

    const imagenInput = document.getElementById("imagenCurso");
    const titulo = document.getElementById("tituloCurso").value;
    const categoria = document.getElementById("categoriaCurso").value;
    const descripcion = document.getElementById("descripcionCurso").value;

    if (!imagenInput.files.length) {
        showAlert("Por favor sube una imagen.", 'warning');
        return;
    }

    // Mostrar loading
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando curso...';
    submitBtn.disabled = true;

    try {
        // Crear FormData para enviar archivo
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('categoria', categoria);
        formData.append('descripcion', descripcion);
        formData.append('precio', document.getElementById('precioCurso')?.value || 0);
        formData.append('nivel', document.getElementById('nivelCurso')?.value || 'Principiante');
        formData.append('imagen', imagenInput.files[0]);

        const response = await fetch(`${API_BASE_URL}/cursos`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('¡Curso creado exitosamente!', 'success');
            
            // Recargar la lista de cursos para mostrar el nuevo curso
            await cargarMisCursos();
            
            // Limpiar formulario y cerrar modal
            document.getElementById("formCrearCurso").reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById("crearCursoModal"));
            if (modal) {
                modal.hide();
            }
            // Forzar eliminación del backdrop si queda
            setTimeout(() => {
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 300);

        } else {
            showAlert(result.error || 'Error al crear el curso', 'danger');
        }

    } catch (error) {
        console.error('Error:', error);
        showAlert('Error de conexión. Verifica que el backend esté funcionando.', 'danger');
    } finally {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Variable para almacenar el curso actual
let currentCourseId = '';
let currentCourseTitle = '';

// Función para establecer el curso actual
function setCurrentCourse(courseId, courseTitle) {
    currentCourseId = courseId;
    currentCourseTitle = courseTitle;
    document.getElementById('nombreCursoSesion').value = courseTitle;
}

// Función para agregar sesión
document.getElementById("formAgregarSesion").addEventListener("submit", async function (e) {
    e.preventDefault();

    const tituloSesion = document.getElementById("tituloSesion").value;
    const descripcionSesion = document.getElementById("descripcionSesion").value;
    const videoInput = document.getElementById("videoSesion");

    if (!videoInput.files.length) {
        showAlert("Por favor sube un video.", 'warning');
        return;
    }

    if (!currentCourseId) {
        showAlert("Error: No se ha seleccionado un curso.", 'danger');
        return;
    }

    // Mostrar loading
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Agregando sesión...';
    submitBtn.disabled = true;

    try {
        // Crear FormData para enviar archivo
        const formData = new FormData();
        formData.append('titulo', tituloSesion);
        formData.append('descripcion', descripcionSesion);
        formData.append('video', videoInput.files[0]);
        formData.append('cursoId', currentCourseId);

        const response = await fetch(`${API_BASE_URL}/cursos/${currentCourseId}/sesiones`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('¡Sesión agregada exitosamente!', 'success');
            
            // Limpiar formulario y cerrar modal
            document.getElementById("formAgregarSesion").reset();
            bootstrap.Modal.getInstance(document.getElementById("agregarSesionModal")).hide();

        } else {
            showAlert(result.error || 'Error al agregar la sesión', 'danger');
        }

    } catch (error) {
        console.error('Error:', error);
        showAlert('Error de conexión. Verifica que el backend esté funcionando.', 'danger');
    } finally {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Función para cargar cursos del usuario
async function cargarMisCursos() {
    try {
        const response = await fetch(`${API_BASE_URL}/mis-cursos`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            const cursosContainer = document.getElementById('cursosContainer');
            const createButton = cursosContainer.querySelector('.crear-curso-btn').parentElement;
            
            // Limpiar cursos existentes (excepto el botón de crear)
            cursosContainer.innerHTML = '';
            cursosContainer.appendChild(createButton);

            // Agregar cursos del usuario
            if (result.data && result.data.length > 0) {
                result.data.forEach(curso => {
                    const cursoElement = document.createElement("div");
                    cursoElement.className = "col-md-4";
                    cursoElement.innerHTML = `
                        <div class="card text-dark" data-course-id="${curso._id}">
                            <img src="${curso.imagen || '/images/placeholder-course.jpg'}" class="card-img-top" alt="${curso.titulo}">
                            <div class="card-body">
                                <h5 class="card-title fw-bold">${curso.titulo}</h5>
                                <span class="badge bg-secondary mb-2">${curso.categoria}</span>
                                <p class="card-text">${curso.descripcion}</p>
                                <div class="d-flex justify-content-between align-items-center mt-2">
                                    <small class="text-muted">Precio: $${(curso.precio || 0).toLocaleString('es-CO')}</small>
                                    <span class="badge bg-info">${curso.nivel || 'Principiante'}</span>
                                </div>
                                <button class="btn btn-purple w-100 mt-2" data-bs-toggle="modal" data-bs-target="#agregarSesionModal" onclick="setCurrentCourse('${curso._id}', '${curso.titulo}')">agregar sesión</button>
                            </div>
                        </div>
                    `;
                    cursosContainer.prepend(cursoElement);
                });
                
                // Actualizar contador
                document.getElementById('totalCursos').textContent = result.data.length;
                document.getElementById('noCursosMessage').style.display = 'none';
            } else {
                // Mostrar mensaje cuando no hay cursos
                document.getElementById('totalCursos').textContent = '0';
                document.getElementById('noCursosMessage').style.display = 'block';
            }
        } else {
            console.error('Error al cargar cursos:', result.error);
            showAlert('Error al cargar tus cursos', 'warning');
        }
    } catch (error) {
        console.error('Error al cargar cursos:', error);
        showAlert('Error de conexión al cargar cursos', 'danger');
    }
}

// Función de búsqueda
function buscarCursos() {
    const searchTerm = document.querySelector('input[placeholder="busca los cursos..."]').value.toLowerCase();
    const cursos = document.querySelectorAll('#cursosContainer .col-md-4:not(:has(.crear-curso-btn))');
    
    cursos.forEach(curso => {
        const titulo = curso.querySelector('.card-title').textContent.toLowerCase();
        const descripcion = curso.querySelector('.card-text').textContent.toLowerCase();
        
        if (titulo.includes(searchTerm) || descripcion.includes(searchTerm)) {
            curso.style.display = 'block';
        } else {
            curso.style.display = 'none';
        }
    });
}

// Event listener para búsqueda
document.querySelector('input[placeholder="busca los cursos..."]').addEventListener('input', buscarCursos);

// Función para ordenar cursos A-Z
function ordenarCursos() {
    const checkbox = document.querySelector('input[type="checkbox"]');
    const cursosContainer = document.getElementById('cursosContainer');
    const createButton = cursosContainer.querySelector('.crear-curso-btn').parentElement;
    const cursos = Array.from(cursosContainer.querySelectorAll('.col-md-4:not(:has(.crear-curso-btn))'));
    
    if (checkbox.checked) {
        cursos.sort((a, b) => {
            const tituloA = a.querySelector('.card-title').textContent;
            const tituloB = b.querySelector('.card-title').textContent;
            return tituloA.localeCompare(tituloB);
        });
    }
    
    // Limpiar container y reagregar en orden
    cursosContainer.innerHTML = '';
    cursos.forEach(curso => cursosContainer.appendChild(curso));
    cursosContainer.appendChild(createButton);
}

// Event listener para ordenamiento
document.querySelector('input[type="checkbox"]').addEventListener('change', ordenarCursos);

// Cargar cursos al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    if (!getAuthToken()) {
        window.location.href = '/';
        return;
    }
    
    cargarMisCursos();
});
