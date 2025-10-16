// JavaScript para la página de detalle del curso

// Datos de sesión para autenticación
window.sessionData = {
    signedIn: typeof signedIn !== 'undefined' ? signedIn : false,
    token: typeof token !== 'undefined' ? token : '',
    user: typeof user !== 'undefined' ? user : null
};

// Función para obtener token de autenticación
function getAuthToken() {
    // Priorizar token de sesión del servidor
    if (window.sessionData && window.sessionData.token) {
        return window.sessionData.token;
    }
    // Fallback a localStorage (compatibilidad)
    return localStorage.getItem('authToken') || '';
}

// Función para mostrar notificaciones toast
function mostrarToast(mensaje, tipo = 'info') {
    // Remover toast existente si hay uno
    const toastExistente = document.querySelector('.toast');
    if (toastExistente) {
        toastExistente.remove();
    }

    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
                <span>${mensaje}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Mostrar toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Función para agregar curso al carrito
async function agregarAlCarrito(cursoId) {
    const btn = document.getElementById('btnAgregarCarrito');
    const btnText = document.getElementById('btnText');
    
    if (!btn || !btnText) return;

    // Estado de carga
    btn.classList.add('btn-loading');
    btn.disabled = true;
    btnText.textContent = 'Agregando...';

    try {
        console.log('agregarAlCarrito - Enviando request para curso:', cursoId);
        
        const response = await fetch('/api/ventas/carrito/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Incluir cookies
            body: JSON.stringify({ cursoId })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarToast('Curso agregado al carrito exitosamente', 'success');
            
            // Cambiar botón temporalmente
            btnText.textContent = 'Agregado!';
            btn.classList.remove('bg-[#5a1593]', 'hover:bg-[#4a1275]');
            btn.classList.add('bg-green-500', 'hover:bg-green-600');
            
            // Actualizar contador del carrito si existe
            actualizarContadorCarrito();
            
            // Restaurar botón después de 2 segundos
            setTimeout(() => {
                btnText.textContent = 'Agregar al Carrito';
                btn.classList.remove('bg-green-500', 'hover:bg-green-600');
                btn.classList.add('bg-[#5a1593]', 'hover:bg-[#4a1275]');
            }, 2000);
            
        } else if (response.status === 401) {
            mostrarToast('Debes iniciar sesión para agregar cursos al carrito', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            const errorMsg = data.error || data.message || 'Error al agregar al carrito';
            mostrarToast(errorMsg, 'error');
            console.error('Error del servidor:', data);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error de conexión. Intenta nuevamente.', 'error');
    } finally {
        // Remover estado de carga
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Función para actualizar contador del carrito
async function actualizarContadorCarrito() {
    try {
        const response = await fetch('/api/ventas/carrito', {
            method: 'GET',
            credentials: 'include' // Incluir cookies
        });
        
        if (response.ok) {
            const data = await response.json();
            const contador = document.querySelector('#carrito-contador');
            if (contador) {
                // Manejar diferentes estructuras de respuesta
                let itemsCount = 0;
                if (data.carrito && data.carrito.items) {
                    itemsCount = Array.isArray(data.carrito.items) ? data.carrito.items.length : 0;
                } else if (Array.isArray(data.items)) {
                    itemsCount = data.items.length;
                }
                
                contador.textContent = itemsCount;
                contador.style.display = itemsCount > 0 ? 'inline-block' : 'none';
            }
        } else if (response.status === 401) {
            console.log('Usuario no autenticado para obtener carrito');
            // No mostrar error si el usuario no está autenticado
        } else {
            console.error('Error obteniendo carrito:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error actualizando contador del carrito:', error);
    }
}

// Función para verificar estado de autenticación
async function verificarAuth() {
    try {
        const response = await fetch('/api/usuarios/perfil', {
            method: 'GET',
            credentials: 'include' // Incluir cookies
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Usuario autenticado:', data);
            mostrarToast('Usuario autenticado correctamente', 'success');
        } else {
            console.log('Usuario no autenticado:', response.status);
            mostrarToast('Usuario no autenticado', 'error');
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        mostrarToast('Error verificando autenticación', 'error');
    }
}

// Función para verificar acceso al curso
async function verificarAccesoCurso(cursoId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`/api/biblioteca/verificar-acceso/${cursoId}`, {
            headers: {
                'X-API-Key': token,
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Acceso al curso verificado:', data);
            
            // Mostrar información de acceso
            if (data.tieneAcceso) {
                mostrarAccesoCurso(data.origen);
            } else {
                mostrarSinAcceso();
            }
        } else {
            console.log('Sin acceso al curso');
            mostrarSinAcceso();
        }
    } catch (error) {
        console.error('Error verificando acceso al curso:', error);
    }
}

// Mostrar información de acceso al curso
function mostrarAccesoCurso(origen) {
    const contenedor = document.getElementById('acceso-info');
    if (!contenedor) return;

    let mensaje = '';
    let color = '';
    let icono = '';

    switch (origen) {
        case 'propio':
            mensaje = 'Este es tu curso';
            color = 'bg-blue-100 text-blue-800 border-blue-200';
            icono = 'fas fa-user';
            break;
        case 'intercambio':
            mensaje = 'Acceso por intercambio temporal';
            color = 'bg-teal-100 text-teal-800 border-teal-200';
            icono = 'fas fa-exchange-alt';
            break;
        case 'venta':
            mensaje = 'Curso comprado';
            color = 'bg-green-100 text-green-800 border-green-200';
            icono = 'fas fa-shopping-cart';
            break;
        case 'suscripcion':
            mensaje = 'Acceso por suscripción';
            color = 'bg-purple-100 text-purple-800 border-purple-200';
            icono = 'fas fa-crown';
            break;
        default:
            mensaje = 'Tienes acceso a este curso';
            color = 'bg-gray-100 text-gray-800 border-gray-200';
            icono = 'fas fa-check';
    }

    contenedor.innerHTML = `
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${color}">
            <i class="${icono}"></i>
            ${mensaje}
        </div>
    `;
    contenedor.classList.remove('hidden');
}

// Mostrar mensaje de sin acceso
function mostrarSinAcceso() {
    const contenedor = document.getElementById('acceso-info');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border bg-red-100 text-red-800 border-red-200">
            <i class="fas fa-lock"></i>
            No tienes acceso a este curso
        </div>
    `;
    contenedor.classList.remove('hidden');
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Debug: Mostrar información de sesión
    console.log('=== DEBUG SESSION DATA ===');
    console.log('window.sessionData:', window.sessionData);
    console.log('Token disponible:', window.sessionData?.token ? 'SÍ' : 'NO');
    console.log('Token length:', window.sessionData?.token?.length || 0);
    console.log('SignedIn:', window.sessionData?.signedIn);
    console.log('User:', window.sessionData?.user);
    console.log('========================');
    
    actualizarContadorCarrito();
    
    // Verificar autenticación si el usuario está logueado
    if (window.sessionData && window.sessionData.signedIn) {
        console.log('Usuario reportado como autenticado por el servidor');
        console.log('Token del servidor disponible:', window.sessionData.token ? "SÍ" : "NO");
        
        // Verificar autenticación después de 1 segundo
        setTimeout(verificarAuth, 1000);
        
        // Verificar acceso al curso si hay cursoId disponible
        if (typeof cursoId !== 'undefined') {
            setTimeout(() => verificarAccesoCurso(cursoId), 1500);
        }
    } else {
        console.log('Usuario no autenticado según el servidor');
    }
});
