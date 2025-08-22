async function crearCurso() {
    const titulo = document.getElementById("tituloCurso").value;
    const categoria = document.getElementById("categoriaCurso").value;
    const descripcion = document.getElementById("descripcionCurso").value;
    const precio = document.getElementById("precioCurso").value;
    const imagenInput = document.getElementById("imagenCurso");

    console.log('Datos del formulario:', { titulo, categoria, descripcion, precio });

    if (!titulo || !categoria || !descripcion || !precio) {
        alert("Por favor completa todos los campos obligatorios.");
        return;
    }

    if (!imagenInput.files.length) {
        alert("Por favor sube una imagen.");
        return;
    }

    try {
        const reader = new FileReader();
        
        reader.onload = async function(event) {
            const imageBase64 = event.target.result;
            
            const cursoData = {
                titulo: titulo,
                categoria: categoria,
                descripcion: descripcion,
                precio: precio,
                nivel: 'basico',
                visibilidad: 'publico',
                imagen: imageBase64
            };

            console.log('Datos a enviar:', cursoData);

            const token = localStorage.getItem('token');
            if (!token) {
                alert("Debes iniciar sesión para crear un curso.");
                return;
            }

            const response = await fetch('/api/cursos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cursoData)
            });

            if (response.ok) {
                const curso = await response.json();
                
                const nuevoCurso = document.createElement("div");
                nuevoCurso.className = "col-md-4";
                nuevoCurso.innerHTML = `
                    <div class="card text-dark" data-curso-id="${curso._id}">
                        <img src="${imageBase64}" class="card-img-top" alt="${curso.titulo}">
                        <div class="card-body">
                            <h5 class="card-title fw-bold">${curso.titulo}</h5>
                            <span class="badge bg-secondary mb-2">${curso.categoria}</span>
                            <p class="card-text">${curso.descripcion}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-warning">
                                    <i class="bi bi-star"></i>
                                    <i class="bi bi-star"></i>
                                    <i class="bi bi-star"></i>
                                    <i class="bi bi-star"></i>
                                    <i class="bi bi-star"></i>
                                </span>
                                <span class="text-muted">(0.0)</span>
                            </div>
                            <div class="d-flex gap-2 mt-2">
                                <button class="btn btn-purple flex-fill" data-bs-toggle="modal" data-bs-target="#agregarSesionModal" data-curso-id="${curso._id}">
                                    agregar sesión
                                </button>
                                <button class="btn btn-outline-primary" onclick="editarCurso('${curso._id}', '${curso.titulo}', '${curso.categoria}', '${curso.descripcion}', '${curso.precio}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="eliminarCurso('${curso._id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                const crearCursoBtn = document.querySelector('.crear-curso-btn').parentElement;
                crearCursoBtn.parentElement.insertBefore(nuevoCurso, crearCursoBtn);
                
                document.getElementById("formCrearCurso").reset();
                bootstrap.Modal.getInstance(document.getElementById("crearCursoModal")).hide();
                
                alert("Curso creado exitosamente!");
            } else {
                const error = await response.json();
                alert("Error al crear el curso: " + error.error);
            }
        };
        
        reader.readAsDataURL(imagenInput.files[0]);
    } catch (error) {
        console.error('Error:', error);
        alert("Error de conexión al crear el curso.");
    }
}

async function eliminarCurso(cursoId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este curso?")) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cursos/${cursoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const cursoElement = document.querySelector(`[data-curso-id="${cursoId}"]`).closest('.col-md-4');
        
        if (response.ok || response.status === 404) {
            if (cursoElement) {
                cursoElement.remove();
            }
            alert("Curso eliminado exitosamente!");
        } else {
            const error = await response.json();
            alert("Error al eliminar el curso: " + error.error);
        }
    } catch (error) {
        console.error('Error:', error);
        const cursoElement = document.querySelector(`[data-curso-id="${cursoId}"]`).closest('.col-md-4');
        if (cursoElement) {
            cursoElement.remove();
        }
        alert("Curso eliminado de la interfaz.");
    }
}

async function cargarMisCursos() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (!usuario) return;

        const response = await fetch(`/api/cursos/owner/${usuario._id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const cursos = await response.json();
            const container = document.getElementById('cursosContainer');
            
            cursos.forEach(curso => {
                const imagenSrc = curso.imagen && curso.imagen.startsWith('data:') 
                    ? curso.imagen 
                    : `/images/${curso.imagen || 'default-course.jpg'}`;
                
                const cursoElement = document.createElement("div");
                cursoElement.className = "col-md-4";
                cursoElement.innerHTML = `
                    <div class="card text-dark" data-curso-id="${curso._id}">
                        <img src="${imagenSrc}" class="card-img-top" alt="${curso.titulo}">
                        <div class="card-body">
                            <h5 class="card-title fw-bold">${curso.titulo}</h5>
                            <span class="badge bg-secondary mb-2">${curso.categoria}</span>
                            <p class="card-text">${curso.descripcion}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-warning">
                                    ${generarEstrellas(curso.estadisticas?.calificacionPromedio || 0)}
                                </span>
                                <span class="text-muted">(${(curso.estadisticas?.calificacionPromedio || 0).toFixed(1)})</span>
                            </div>
                            <div class="d-flex gap-2 mt-2">
                                <button class="btn btn-purple flex-fill" data-bs-toggle="modal" data-bs-target="#agregarSesionModal" data-curso-id="${curso._id}">
                                    agregar sesión
                                </button>
                                <button class="btn btn-outline-primary" onclick="editarCurso('${curso._id}', '${curso.titulo}', '${curso.categoria}', '${curso.descripcion}', '${curso.precio}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="eliminarCurso('${curso._id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                const crearCursoBtn = document.querySelector('.crear-curso-btn').parentElement;
                crearCursoBtn.parentElement.insertBefore(cursoElement, crearCursoBtn);
            });
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
    }
}

function generarEstrellas(rating) {
    let estrellas = '';
    for (let i = 0; i < 5; i++) {
        if (i < Math.floor(rating)) {
            estrellas += '<i class="bi bi-star-fill"></i>';
        } else {
            estrellas += '<i class="bi bi-star"></i>';
        }
    }
    return estrellas;
}

function editarCurso(cursoId, titulo, categoria, descripcion, precio) {
    document.getElementById('editarCursoId').value = cursoId;
    document.getElementById('editarTituloCurso').value = titulo;
    document.getElementById('editarCategoriaCurso').value = categoria;
    document.getElementById('editarDescripcionCurso').value = descripcion;
    document.getElementById('editarPrecioCurso').value = precio;
    
    const modal = new bootstrap.Modal(document.getElementById('editarCursoModal'));
    modal.show();
}

async function actualizarCurso() {
    const cursoId = document.getElementById('editarCursoId').value;
    const titulo = document.getElementById('editarTituloCurso').value;
    const categoria = document.getElementById('editarCategoriaCurso').value;
    const descripcion = document.getElementById('editarDescripcionCurso').value;
    const precio = document.getElementById('editarPrecioCurso').value;
    const imagenInput = document.getElementById('editarImagenCurso');

    if (!titulo || !categoria || !descripcion || !precio) {
        alert("Por favor completa todos los campos obligatorios.");
        return;
    }

    try {
        let cursoData = {
            titulo: titulo,
            categoria: categoria,
            descripcion: descripcion,
            precio: precio,
            nivel: 'basico',
            visibilidad: 'publico'
        };

        if (imagenInput.files.length > 0) {
            const reader = new FileReader();
            
            reader.onload = async function(event) {
                cursoData.imagen = event.target.result;
                await enviarActualizacion(cursoId, cursoData);
            };
            
            reader.readAsDataURL(imagenInput.files[0]);
        } else {
            await enviarActualizacion(cursoId, cursoData);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error al actualizar el curso.");
    }
}

async function enviarActualizacion(cursoId, cursoData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cursos/${cursoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cursoData)
        });

        if (response.ok) {
            const cursoActualizado = await response.json();
            
            const cursoElement = document.querySelector(`[data-curso-id="${cursoId}"]`);
            if (cursoElement) {
                const imagenSrc = cursoActualizado.imagen && cursoActualizado.imagen.startsWith('data:') 
                    ? cursoActualizado.imagen 
                    : `/images/${cursoActualizado.imagen || 'default-course.jpg'}`;
                
                cursoElement.querySelector('.card-img-top').src = imagenSrc;
                cursoElement.querySelector('.card-title').textContent = cursoActualizado.titulo;
                cursoElement.querySelector('.badge').textContent = cursoActualizado.categoria;
                cursoElement.querySelector('.card-text').textContent = cursoActualizado.descripcion;
            }
            
            bootstrap.Modal.getInstance(document.getElementById('editarCursoModal')).hide();
            alert("Curso actualizado exitosamente!");
        } else {
            const error = await response.json();
            alert("Error al actualizar el curso: " + error.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Error de conexión al actualizar el curso.");
    }
}

document.addEventListener('DOMContentLoaded', cargarMisCursos);
