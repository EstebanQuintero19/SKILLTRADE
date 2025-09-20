/**
 * Sistema de manejo de estados y errores para el frontend
 * Incluye estados de carga, manejo de errores y notificaciones
 */

class StateManager {
    constructor() {
        this.states = new Map();
        this.listeners = new Map();
        this.errorHandlers = new Map();
        this.loadingStates = new Set();
    }

    // Gestión de estados
    setState(key, value) {
        const oldValue = this.states.get(key);
        this.states.set(key, value);
        
        // Notificar a los listeners
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(value, oldValue);
            });
        }
    }

    getState(key) {
        return this.states.get(key);
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
        
        // Retornar función de unsubscribe
        return () => {
            const listeners = this.listeners.get(key);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        };
    }

    // Gestión de estados de carga
    setLoading(key, isLoading = true) {
        if (isLoading) {
            this.loadingStates.add(key);
        } else {
            this.loadingStates.delete(key);
        }
        
        this.setState(`loading_${key}`, isLoading);
        this.updateLoadingUI();
    }

    isLoading(key) {
        return this.loadingStates.has(key);
    }

    updateLoadingUI() {
        // Actualizar indicadores de carga globales
        const globalLoader = document.getElementById('global-loader');
        if (globalLoader) {
            globalLoader.style.display = this.loadingStates.size > 0 ? 'block' : 'none';
        }

        // Actualizar botones con estado de carga
        document.querySelectorAll('[data-loading-key]').forEach(button => {
            const loadingKey = button.getAttribute('data-loading-key');
            const isLoading = this.isLoading(loadingKey);
            
            button.disabled = isLoading;
            const spinner = button.querySelector('.loading-spinner');
            const text = button.querySelector('.button-text');
            
            if (spinner && text) {
                spinner.style.display = isLoading ? 'inline-block' : 'none';
                text.style.display = isLoading ? 'none' : 'inline-block';
            }
        });
    }

    // Gestión de errores
    setError(key, error) {
        this.setState(`error_${key}`, error);
        this.showErrorNotification(error);
    }

    clearError(key) {
        this.setState(`error_${key}`, null);
    }

    getError(key) {
        return this.getState(`error_${key}`);
    }

    // Notificaciones
    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotificationElement(message, type);
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto-remover
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm`;
        
        const typeStyles = {
            success: 'bg-green-600 text-white border-l-4 border-green-400',
            error: 'bg-red-600 text-white border-l-4 border-red-400',
            warning: 'bg-yellow-600 text-white border-l-4 border-yellow-400',
            info: 'bg-blue-600 text-white border-l-4 border-blue-400'
        };

        const typeIcons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };

        notification.className += ` ${typeStyles[type] || typeStyles.info}`;
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="bi bi-${typeIcons[type] || typeIcons.info} text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button class="text-white hover:text-gray-200 focus:outline-none" onclick="window.stateManager.removeNotification(this.parentElement.parentElement)">
                        <i class="bi bi-x text-lg"></i>
                    </button>
                </div>
            </div>
        `;

        return notification;
    }

    removeNotification(notification) {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }

    showErrorNotification(error) {
        let message = 'Ha ocurrido un error';
        
        if (typeof error === 'string') {
            message = error;
        } else if (error && error.message) {
            message = error.message;
        } else if (error && error.error) {
            message = error.error;
        }

        this.showNotification(message, 'error');
    }

    // Gestión de datos de usuario
    setUser(user) {
        this.setState('user', user);
        this.setState('isAuthenticated', !!user);
    }

    getUser() {
        return this.getState('user');
    }

    isAuthenticated() {
        return this.getState('isAuthenticated') || false;
    }

    clearUser() {
        this.setState('user', null);
        this.setState('isAuthenticated', false);
    }

    // Utilidades para formularios
    setFormData(formId, data) {
        this.setState(`form_${formId}`, data);
    }

    getFormData(formId) {
        return this.getState(`form_${formId}`);
    }

    clearFormData(formId) {
        this.setState(`form_${formId}`, null);
    }

    // Gestión de modales
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    // Gestión de navegación
    navigateTo(url, options = {}) {
        const { replace = false, state = null } = options;
        
        if (replace) {
            window.history.replaceState(state, '', url);
        } else {
            window.history.pushState(state, '', url);
        }
        
        // Disparar evento de navegación
        window.dispatchEvent(new CustomEvent('navigate', { detail: { url, options } }));
    }

    // Gestión de caché local
    setCache(key, data, ttl = 300000) { // 5 minutos por defecto
        const cacheData = {
            data,
            timestamp: Date.now(),
            ttl
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    }

    getCache(key) {
        const cached = localStorage.getItem(`cache_${key}`);
        if (!cached) return null;

        try {
            const cacheData = JSON.parse(cached);
            const now = Date.now();
            
            if (now - cacheData.timestamp > cacheData.ttl) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            
            return cacheData.data;
        } catch (error) {
            localStorage.removeItem(`cache_${key}`);
            return null;
        }
    }

    clearCache(key) {
        if (key) {
            localStorage.removeItem(`cache_${key}`);
        } else {
            // Limpiar todo el caché
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('cache_')) {
                    localStorage.removeItem(k);
                }
            });
        }
    }
}

// Instancia global
window.stateManager = new StateManager();

// Utilidades globales
window.showNotification = (message, type, duration) => {
    window.stateManager.showNotification(message, type, duration);
};

window.showError = (error) => {
    window.stateManager.showErrorNotification(error);
};

window.showSuccess = (message) => {
    window.stateManager.showNotification(message, 'success');
};

window.showWarning = (message) => {
    window.stateManager.showNotification(message, 'warning');
};

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Configurar estado inicial
    window.stateManager.setState('isAuthenticated', false);
    window.stateManager.setState('user', null);
    
    // Configurar listeners globales
    window.stateManager.subscribe('isAuthenticated', (isAuth) => {
        // Actualizar UI basado en estado de autenticación
        const authElements = document.querySelectorAll('[data-auth-required]');
        const guestElements = document.querySelectorAll('[data-guest-only]');
        
        authElements.forEach(el => {
            el.style.display = isAuth ? 'block' : 'none';
        });
        
        guestElements.forEach(el => {
            el.style.display = isAuth ? 'none' : 'block';
        });
    });
    
    // Manejar errores globales
    window.addEventListener('error', (event) => {
        console.error('Error global:', event.error);
        window.stateManager.showErrorNotification(event.error);
    });
    
    // Manejar errores de promesas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Promesa rechazada:', event.reason);
        window.stateManager.showErrorNotification(event.reason);
    });
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
