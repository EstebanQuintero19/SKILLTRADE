/**
 * Sistema de validación robusto para el frontend
 * Incluye validaciones en tiempo real y sanitización
 */

class FormValidator {
    constructor(formSelector, options = {}) {
        this.form = document.querySelector(formSelector);
        this.options = {
            realTime: true,
            showErrors: true,
            sanitize: true,
            ...options
        };
        this.rules = {};
        this.errors = {};
        
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.setupEventListeners();
        this.setupDefaultRules();
    }

    setupEventListeners() {
        if (this.options.realTime) {
            // Validación en tiempo real
            this.form.addEventListener('input', (e) => {
                if (e.target.matches('input, textarea, select')) {
                    this.validateField(e.target);
                }
            });

            this.form.addEventListener('blur', (e) => {
                if (e.target.matches('input, textarea, select')) {
                    this.validateField(e.target);
                }
            });
        }

        // Validación al enviar
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.showFormErrors();
            }
        });
    }

    setupDefaultRules() {
        // Reglas por defecto basadas en el tipo de input
        const defaultRules = {
            email: {
                required: true,
                email: true,
                minLength: 5,
                maxLength: 100
            },
            password: {
                required: true,
                minLength: 8,
                maxLength: 128,
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
            },
            text: {
                required: true,
                minLength: 2,
                maxLength: 100,
                pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
            },
            nombre: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
            },
            telefono: {
                pattern: /^[\+]?[1-9][\d]{0,15}$/
            },
            url: {
                pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
            }
        };

        // Aplicar reglas por defecto
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            const fieldType = field.type || field.name || 'text';
            if (defaultRules[fieldType]) {
                this.addRule(field.name, defaultRules[fieldType]);
            }
        });
    }

    addRule(fieldName, rules) {
        this.rules[fieldName] = { ...this.rules[fieldName], ...rules };
    }

    validateField(field) {
        const fieldName = field.name;
        const value = this.options.sanitize ? this.sanitizeInput(field.value) : field.value;
        
        // Actualizar el valor si fue sanitizado
        if (this.options.sanitize && field.value !== value) {
            field.value = value;
        }

        const rules = this.rules[fieldName];
        if (!rules) return true;

        const errors = [];

        // Validación requerida
        if (rules.required && (!value || value.trim() === '')) {
            errors.push('Este campo es obligatorio');
        }

        // Validación de longitud mínima
        if (value && rules.minLength && value.length < rules.minLength) {
            errors.push(`Mínimo ${rules.minLength} caracteres`);
        }

        // Validación de longitud máxima
        if (value && rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Máximo ${rules.maxLength} caracteres`);
        }

        // Validación de email
        if (value && rules.email && !this.isValidEmail(value)) {
            errors.push('Formato de email inválido');
        }

        // Validación de patrón
        if (value && rules.pattern && !rules.pattern.test(value)) {
            errors.push('Formato inválido');
        }

        // Validación personalizada
        if (value && rules.custom && typeof rules.custom === 'function') {
            const customError = rules.custom(value);
            if (customError) {
                errors.push(customError);
            }
        }

        // Guardar errores
        this.errors[fieldName] = errors;

        // Mostrar errores
        if (this.options.showErrors) {
            this.showFieldError(field, errors);
        }

        return errors.length === 0;
    }

    validateForm() {
        let isValid = true;
        
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, errors) {
        // Remover errores anteriores
        this.clearFieldError(field);

        if (errors.length > 0) {
            // Agregar clase de error al campo
            field.classList.add('border-red-500', 'focus:ring-red-500');
            field.classList.remove('border-gray-600', 'focus:ring-blue-500');

            // Crear elemento de error
            const errorElement = document.createElement('div');
            errorElement.className = 'mt-2 text-sm text-red-400 flex items-center';
            errorElement.innerHTML = `
                <i class="bi bi-exclamation-circle mr-1"></i>
                ${errors[0]}
            `;
            errorElement.setAttribute('data-field-error', field.name);

            // Insertar después del campo
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        } else {
            // Remover clase de error
            field.classList.remove('border-red-500', 'focus:ring-red-500');
            field.classList.add('border-gray-600', 'focus:ring-blue-500');
        }
    }

    clearFieldError(field) {
        const errorElement = field.parentNode.querySelector(`[data-field-error="${field.name}"]`);
        if (errorElement) {
            errorElement.remove();
        }
    }

    showFormErrors() {
        // Scroll al primer error
        const firstError = this.form.querySelector('.border-red-500');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }

        // Mostrar mensaje general
        this.showNotification('Por favor, corrige los errores en el formulario', 'error');
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '')
            .trim();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        const typeStyles = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            warning: 'bg-yellow-600 text-white',
            info: 'bg-blue-600 text-white'
        };

        notification.className += ` ${typeStyles[type] || typeStyles.info}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    // Métodos públicos
    getErrors() {
        return this.errors;
    }

    clearErrors() {
        this.errors = {};
        this.form.querySelectorAll('[data-field-error]').forEach(el => el.remove());
        this.form.querySelectorAll('.border-red-500').forEach(field => {
            field.classList.remove('border-red-500', 'focus:ring-red-500');
            field.classList.add('border-gray-600', 'focus:ring-blue-500');
        });
    }

    isValid() {
        return Object.values(this.errors).every(errors => errors.length === 0);
    }
}

// Utilidades globales
window.FormValidator = FormValidator;

// Validaciones específicas para SkillTrade
window.SkillTradeValidations = {
    // Validación de contraseña fuerte
    strongPassword: (value) => {
        if (!value) return null;
        
        const hasLower = /[a-z]/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[@$!%*?&]/.test(value);
        
        if (!hasLower) return 'Debe contener al menos una letra minúscula';
        if (!hasUpper) return 'Debe contener al menos una letra mayúscula';
        if (!hasNumber) return 'Debe contener al menos un número';
        if (!hasSpecial) return 'Debe contener al menos un carácter especial (@$!%*?&)';
        
        return null;
    },

    // Validación de confirmación de contraseña
    confirmPassword: (value, originalPassword) => {
        if (!value) return null;
        if (value !== originalPassword) return 'Las contraseñas no coinciden';
        return null;
    },

    // Validación de nombre de usuario
    username: (value) => {
        if (!value) return null;
        if (value.length < 3) return 'Mínimo 3 caracteres';
        if (value.length > 30) return 'Máximo 30 caracteres';
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Solo letras, números, guiones y guiones bajos';
        return null;
    }
};

// Auto-inicializar validadores en formularios comunes
document.addEventListener('DOMContentLoaded', () => {
    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginValidator = new FormValidator('#loginForm');
        loginValidator.addRule('email', { required: true, email: true });
        loginValidator.addRule('password', { required: true, minLength: 6 });
    }

    // Formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const registerValidator = new FormValidator('#registerForm');
        registerValidator.addRule('nombre', { required: true, minLength: 2, maxLength: 50 });
        registerValidator.addRule('email', { required: true, email: true });
        registerValidator.addRule('password', { 
            required: true, 
            minLength: 8,
            custom: window.SkillTradeValidations.strongPassword
        });
        registerValidator.addRule('confirmPassword', {
            required: true,
            custom: (value) => {
                const password = document.getElementById('registerPassword').value;
                return window.SkillTradeValidations.confirmPassword(value, password);
            }
        });
    }
});
