// ===== MAIN JAVASCRIPT FOR SKILLTRADE FRONTEND =====

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize forms
    initForms();
    
    // Initialize tooltips and dropdowns
    initDropdowns();
    
    // Initialize scroll effects
    initScrollEffects();
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            
            // Change icon
            const icon = mobileMenuButton.querySelector('i');
            if (mobileMenu.classList.contains('hidden')) {
                icon.className = 'bi bi-list text-xl';
            } else {
                icon.className = 'bi bi-x text-xl';
            }
        });
    }
}

// ===== FORMS =====
function initForms() {
    // Add loading states to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="bi bi-hourglass-split mr-2"></i>Procesando...';
            }
        });
    });
    
    // Form validation
    initFormValidation();
}

function initFormValidation() {
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateEmail(this);
        });
    });
    
    // Password validation
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            validatePassword(this);
        });
    });
}

function validateEmail(input) {
    const email = input.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        showInputError(input, 'Por favor ingresa un email válido');
    } else {
        clearInputError(input);
    }
}

function validatePassword(input) {
    const password = input.value;
    
    if (password && password.length < 8) {
        showInputError(input, 'La contraseña debe tener al menos 8 caracteres');
    } else {
        clearInputError(input);
    }
}

function showInputError(input, message) {
    clearInputError(input);
    
    input.classList.add('border-red-500');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'text-red-400 text-sm mt-1 input-error';
    errorDiv.textContent = message;
    
    input.parentNode.appendChild(errorDiv);
}

function clearInputError(input) {
    input.classList.remove('border-red-500');
    
    const errorDiv = input.parentNode.querySelector('.input-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// ===== DROPDOWNS =====
function initDropdowns() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.group');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                // Reset dropdown state
                const dropdownMenu = dropdown.querySelector('[class*="opacity-0"]');
                if (dropdownMenu) {
                    dropdownMenu.classList.add('opacity-0', 'invisible');
                    dropdownMenu.classList.remove('opacity-100', 'visible');
                }
            }
        });
    });
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    // Scroll to top button
    createScrollToTopButton();
    
    // Navbar scroll effect
    initNavbarScrollEffect();
    
    // Animate elements on scroll
    initScrollAnimations();
}

function createScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '<i class="bi bi-arrow-up"></i>';
    scrollButton.className = 'fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 opacity-0 invisible z-50';
    scrollButton.id = 'scroll-to-top';
    
    document.body.appendChild(scrollButton);
    
    scrollButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollButton.classList.remove('opacity-0', 'invisible');
            scrollButton.classList.add('opacity-100', 'visible');
        } else {
            scrollButton.classList.add('opacity-0', 'invisible');
            scrollButton.classList.remove('opacity-100', 'visible');
        }
    });
}

function initNavbarScrollEffect() {
    const header = document.querySelector('header');
    if (!header) return;
    
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.classList.add('shadow-lg');
        } else {
            header.classList.remove('shadow-lg');
        }
        
        lastScrollY = currentScrollY;
    });
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate
    const animateElements = document.querySelectorAll('.card, .grid > div, section > div');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// ===== UTILITY FUNCTIONS =====

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    // Set colors based on type
    switch (type) {
        case 'success':
            notification.classList.add('bg-green-600', 'text-white');
            break;
        case 'error':
            notification.classList.add('bg-red-600', 'text-white');
            break;
        case 'warning':
            notification.classList.add('bg-yellow-600', 'text-white');
            break;
        default:
            notification.classList.add('bg-blue-600', 'text-white');
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Loading state
function showLoading(element) {
    const originalContent = element.innerHTML;
    element.innerHTML = '<i class="bi bi-hourglass-split mr-2"></i>Cargando...';
    element.disabled = true;
    
    return function hideLoading() {
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(date) {
    return new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// API helper functions
const API = {
    baseURL: window.location.origin.includes('localhost') ? 'http://localhost:9090/api/v0' : '/api/v0',
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options });
    },
    
    post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    },
    
    put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    },
    
    delete(endpoint, options = {}) {
        return this.request(endpoint, { method: 'DELETE', ...options });
    }
};

// Export for use in other scripts
window.SkillTrade = {
    showNotification,
    showLoading,
    formatCurrency,
    formatDate,
    debounce,
    API
};
