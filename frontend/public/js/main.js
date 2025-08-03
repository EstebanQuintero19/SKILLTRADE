// Main JavaScript for SKILLTRADE

document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    cards.forEach(card => {
        observer.observe(card);
    });

    // Course filter functionality
    const filterRadios = document.querySelectorAll('input[name="categoria"]');
    filterRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const categoria = this.value;
            if (categoria) {
                window.location.href = `/cursos?categoria=${categoria}`;
            } else {
                window.location.href = '/cursos';
            }
        });
    });

    // View toggle for courses (grid/list)
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const cursosContainer = document.getElementById('cursos-container');

    if (gridViewBtn && listViewBtn && cursosContainer) {
        gridViewBtn.addEventListener('click', function() {
            cursosContainer.classList.remove('list-view');
            cursosContainer.classList.add('grid-view');
            this.classList.add('active');
            listViewBtn.classList.remove('active');
        });

        listViewBtn.addEventListener('click', function() {
            cursosContainer.classList.remove('grid-view');
            cursosContainer.classList.add('list-view');
            this.classList.add('active');
            gridViewBtn.classList.remove('active');
        });
    }

    // Search functionality
    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = this.querySelector('input[type="search"]');
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location.href = `/cursos?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    }

    // Modal functionality
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                modal.classList.remove('show');
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            });
        });
    });

    // Form validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('is-invalid');
                } else {
                    field.classList.remove('is-invalid');
                }
            });

            if (!isValid) {
                e.preventDefault();
                alert('Por favor, completa todos los campos requeridos.');
            }
        });
    });

    // Cart functionality
    const cartButtons = document.querySelectorAll('.btn-cart');
    const cartCount = document.getElementById('cart-count');
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    cartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const courseId = this.getAttribute('data-course-id');
            const courseTitle = this.getAttribute('data-course-title');
            const coursePrice = this.getAttribute('data-course-price');

            // Add to cart
            const cartItem = {
                id: courseId,
                title: courseTitle,
                price: coursePrice
            };

            if (!cartItems.find(item => item.id === courseId)) {
                cartItems.push(cartItem);
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                
                // Update cart count
                if (cartCount) {
                    cartCount.textContent = cartItems.length;
                }

                // Show success message
                showNotification('Curso agregado al carrito', 'success');
            } else {
                showNotification('El curso ya está en el carrito', 'warning');
            }
        });
    });

    // Update cart count on page load
    if (cartCount) {
        cartCount.textContent = cartItems.length;
    }

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Dark mode toggle (if exists)
    const darkModeToggle = document.getElementById('toggle-darkmode');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
            
            const icon = this.querySelector('i');
            if (isDarkMode) {
                icon.className = 'bi bi-sun-fill';
            } else {
                icon.className = 'bi bi-moon-fill';
            }
        });

        // Check for saved dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            const icon = darkModeToggle.querySelector('i');
            icon.className = 'bi bi-sun-fill';
        }
    }

    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    console.log('SKILLTRADE frontend loaded successfully!');
}); 