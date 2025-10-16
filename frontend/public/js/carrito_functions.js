// JavaScript para la funcionalidad del carrito

// Datos de sesión para autenticación
window.sessionData = {
    signedIn: typeof signedIn !== 'undefined' ? signedIn : false,
    token: typeof token !== 'undefined' ? token : '',
    user: typeof user !== 'undefined' ? user : null
};

function getAuthToken() {
    if (window.sessionData && window.sessionData.token) {
        return window.sessionData.token;
    }
    return localStorage.getItem('authToken') || '';
}

function pagarConMercadoPago() {
    const token = getAuthToken();
    
    if (!token) {
        alert('Debes iniciar sesión para realizar el pago');
        window.location.href = '/login';
        return;
    }

    // Mostrar loading
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
    button.disabled = true;

    // Crear preferencia de pago
    fetch('/api/mercadopago/crear-preferencia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': token,
            'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Redirigir a MercadoPago
        if (data.init_point) {
            window.location.href = data.init_point;
        } else if (data.sandbox_init_point) {
            window.location.href = data.sandbox_init_point;
        } else {
            throw new Error('No se pudo obtener el enlace de pago');
        }
    })
    .catch(error => {
        console.error('Error al crear preferencia de pago:', error);
        alert('Error al procesar el pago: ' + error.message);
        
        // Restaurar botón
        button.innerHTML = originalText;
        button.disabled = false;
    });
}

// Función para remover curso del carrito
function removerDelCarrito(cursoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este curso del carrito?')) {
        return;
    }

    const token = getAuthToken();
    
    if (!token) {
        alert('Debes iniciar sesión para modificar el carrito');
        window.location.href = '/login';
        return;
    }

    // Realizar petición para remover del carrito
    fetch('/api/ventas/carrito/remover', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': token,
            'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ cursoId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Mostrar notificación de éxito
        mostrarNotificacion('Curso eliminado del carrito exitosamente', 'success');
        
        // Recargar la página para mostrar los cambios
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    })
    .catch(error => {
        console.error('Error al remover del carrito:', error);
        mostrarNotificacion('Error al eliminar el curso: ' + error.message, 'error');
    });
}

// Sistema de notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm transform translate-x-full transition-transform duration-300 ${
        tipo === 'success' ? 'bg-green-500' : 
        tipo === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${mensaje}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}
