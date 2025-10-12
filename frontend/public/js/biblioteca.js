// Funciones para la biblioteca de cursos

// Función para editar curso
async function editarCurso(cursoId) {
    try {
        console.log('Editando curso:', cursoId);
        
        // Obtener datos actuales del curso
        const cursoElement = document.querySelector(`[data-curso-id="${cursoId}"]`);
        if (!cursoElement) {
            console.error('No se encontró el elemento del curso');
            return;
        }
        
        // Obtener datos del curso desde el DOM
        const titulo = cursoElement.querySelector('.curso-titulo')?.textContent?.trim() || '';
        const descripcion = cursoElement.querySelector('.curso-descripcion')?.textContent?.trim() || '';
        const precio = cursoElement.querySelector('.curso-precio')?.textContent?.replace(/[^\d]/g, '') || '0';
        
        // Crear modal de edición
        const modal = crearModalEdicion(cursoId, { titulo, descripcion, precio });
        document.body.appendChild(modal);
        
        // Mostrar modal
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        mostrarNotificacion('Error al abrir el editor del curso', 'error');
    }
}

// Función para crear el modal de edición
function crearModalEdicion(cursoId, datosActuales) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = `modal-editar-${cursoId}`;
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Editar Curso</h3>
                <button onclick="cerrarModal('${cursoId}')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="form-editar-${cursoId}" onsubmit="guardarCambiosCurso(event, '${cursoId}')">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Título</label>
                    <input type="text" id="titulo-${cursoId}" name="titulo" 
                           value="${datosActuales.titulo}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                           required>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                    <textarea id="descripcion-${cursoId}" name="descripcion" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                              required>${datosActuales.descripcion}</textarea>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Precio (COP)</label>
                    <input type="number" id="precio-${cursoId}" name="precio" 
                           value="${datosActuales.precio}" 
                           min="0" max="100000"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
                    <select id="nivel-${cursoId}" name="nivel" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="Principiante">Principiante</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="avanzado">Avanzado</option>
                    </select>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="cerrarModal('${cursoId}')"
                            class="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" id="btn-guardar-${cursoId}"
                            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    `;
    
    return modal;
}

// Función para guardar cambios del curso
async function guardarCambiosCurso(event, cursoId) {
    event.preventDefault();
    
    const btnGuardar = document.getElementById(`btn-guardar-${cursoId}`);
    const textoOriginal = btnGuardar.textContent;
    
    try {
        // Mostrar estado de carga
        btnGuardar.textContent = 'Guardando...';
        btnGuardar.disabled = true;
        
        // Obtener datos del formulario
        const formData = {
            titulo: document.getElementById(`titulo-${cursoId}`).value.trim(),
            descripcion: document.getElementById(`descripcion-${cursoId}`).value.trim(),
            precio: parseFloat(document.getElementById(`precio-${cursoId}`).value) || 0,
            nivel: document.getElementById(`nivel-${cursoId}`).value
        };
        
        // Validaciones básicas
        if (!formData.titulo) {
            throw new Error('El título es obligatorio');
        }
        
        if (!formData.descripcion) {
            throw new Error('La descripción es obligatoria');
        }
        
        // Enviar request al servidor
        const response = await fetch(`/api/biblioteca/cursos/${cursoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarNotificacion('Curso actualizado exitosamente', 'success');
            cerrarModal(cursoId);
            
            // Recargar la página para mostrar los cambios
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(data.error || 'Error al actualizar el curso');
        }
        
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        mostrarNotificacion(error.message, 'error');
    } finally {
        // Restaurar botón
        btnGuardar.textContent = textoOriginal;
        btnGuardar.disabled = false;
    }
}

// Función para cerrar modal
function cerrarModal(cursoId) {
    const modal = document.getElementById(`modal-editar-${cursoId}`);
    if (modal) {
        modal.remove();
    }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Remover notificación existente si hay una
    const notificacionExistente = document.querySelector('.notificacion-toast');
    if (notificacionExistente) {
        notificacionExistente.remove();
    }
    
    // Crear nueva notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-toast fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transform transition-all duration-300 translate-x-full`;
    
    // Colores según el tipo
    const colores = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };
    
    notificacion.classList.add(colores[tipo] || colores.info);
    notificacion.textContent = mensaje;
    
    // Agregar al DOM
    document.body.appendChild(notificacion);
    
    // Animar entrada
    setTimeout(() => {
        notificacion.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notificacion.classList.add('translate-x-full');
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, 300);
    }, 5000);
}

// Función para eliminar curso (si se necesita en el futuro)
async function eliminarCurso(cursoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/biblioteca/cursos/${cursoId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarNotificacion('Curso eliminado exitosamente', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error(data.error || 'Error al eliminar el curso');
        }
        
    } catch (error) {
        console.error('Error al eliminar curso:', error);
        mostrarNotificacion(error.message, 'error');
    }
}

console.log('Biblioteca.js cargado correctamente');
