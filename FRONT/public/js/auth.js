// Configuración de la API
const API_BASE_URL_AUTH = 'http://localhost:9090/api';

// Utilidades para mostrar mensajes
function showAlert(message, type = 'info') {
    // Crear el elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Función para manejar el login
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        dispositivo: navigator.userAgent // Info del dispositivo
    };
    
    // Validaciones básicas
    if (!loginData.email || !loginData.password) {
        showAlert('Por favor completa todos los campos', 'warning');
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Iniciando...';
        submitBtn.disabled = true;
        
        console.log('Enviando datos de login:', loginData);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
        
        if (response.ok) {
            // Login exitoso
            showAlert('¡Bienvenido! Iniciando sesión...', 'success');
            
            // Guardar token en localStorage
            const token = result?.data?.apiKey;
            const user = result?.data?.usuario;
            if (token) localStorage.setItem('authToken', token);
            if (user) localStorage.setItem('user', JSON.stringify(user));
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (modal && typeof modal.hide === 'function') {
                modal.hide();
            }
            
            // Redirigir a la página de cursos con recarga completa
            setTimeout(() => {
                window.location.replace('/cursos');
            }, 800);
            
        } else {
            // Error en login
            showAlert(result.error || 'Error al iniciar sesión', 'danger');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showAlert('Error de conexión. Verifica que el backend esté funcionando.', 'danger');
    } finally {
        // Restaurar botón
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Función para manejar el registro
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const registerData = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    // Validaciones
    if (!registerData.nombre || !registerData.email || !registerData.password) {
        showAlert('Por favor completa todos los campos', 'warning');
        return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'warning');
        return;
    }
    
    if (registerData.password.length < 8) {
        showAlert('La contraseña debe tener al menos 8 caracteres', 'warning');
        return;
    }
    
    // Verificar términos y condiciones
    if (!form.querySelector('#acceptTerms').checked) {
        showAlert('Debes aceptar los términos y condiciones', 'warning');
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Creando cuenta...';
        submitBtn.disabled = true;
        
        console.log('Enviando datos de registro:', registerData);
        
        const response = await fetch(`${API_BASE_URL_AUTH}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
        
        if (response.ok) {
            // Registro exitoso
            showAlert('¡Cuenta creada exitosamente! Iniciando sesión...', 'success');
            
            // Guardar token en localStorage
            const token = result?.data?.usuario?.apiKey || result?.data?.apiKey;
            const user = result?.data?.usuario || result?.data?.user;
            if (token) localStorage.setItem('authToken', token);
            if (user) localStorage.setItem('user', JSON.stringify(user));
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (modal && typeof modal.hide === 'function') {
                modal.hide();
            }
            
            // Redirigir a la página de cursos con recarga completa
            setTimeout(() => {
                window.location.replace('/cursos');
            }, 800);
            
        } else {
            // Error en registro
            showAlert(result.error || 'Error al crear la cuenta', 'danger');
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        showAlert('Error de conexión. Verifica que el backend esté funcionando.', 'danger');
    } finally {
        // Restaurar botón
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Función para cerrar sesión
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    showAlert('Sesión cerrada correctamente', 'info');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para los formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Event listener para cerrar sesión
    const logoutButtons = document.querySelectorAll('form[action="/auth/logout"]');
    logoutButtons.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogout();
        });
    });
    
    // Verificar si hay token guardado y validarlo
    const token = localStorage.getItem('authToken');
    if (token) {
        // Aquí podrías validar el token con el backend si es necesario
        console.log('Usuario autenticado con token:', token);
    }
});

// Función auxiliar para hacer peticiones autenticadas
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    
    const response = await fetch(url, options);
    
    // Si el token expiró, redirigir al login
    if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        showAlert('Sesión expirada. Por favor inicia sesión nuevamente.', 'warning');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    
    return response;
}

// Exportar funciones para uso global
window.authUtils = {
    handleLogin,
    handleRegister,
    handleLogout,
    authenticatedFetch,
    showAlert
};
