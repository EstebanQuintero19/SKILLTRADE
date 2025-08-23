document.addEventListener("DOMContentLoaded", () => {
  // — Toggle Dark Mode —
  const toggleButton = document.getElementById("toggle-darkmode");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      toggleButton.classList.toggle("btn-dark", isDark);
      toggleButton.classList.toggle("btn-light", !isDark);
      toggleButton.innerHTML = isDark
        ? '<i class="bi bi-sun-fill"></i>'
        : '<i class="bi bi-moon-fill"></i>';
    });
  }

  // — Login Form —
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value.trim();
      
      if (!email || !password) {
        showAlert("Por favor completa todos los campos.", "error");
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAlert("Ingresa un correo electrónico válido.", "error");
        return;
      }

      // Mostrar loading
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Iniciando sesión...';

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            dispositivo: navigator.userAgent
          })
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Login exitoso:', data);
          
          // Guardar token en localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
          
          showAlert("¡Bienvenido! Redirigiendo...", "success");
          
          // Cerrar modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
          if (modal) {
            modal.hide();
          }
          
          // Redirigir según el rol a mis-cursos
          console.log('Redirigiendo después del login...');
          setTimeout(() => {
            console.log('Ejecutando redirección del login...');
            if (data.usuario.rol === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/mis-cursos';
            }
          }, 800);
          
        } else {
          showAlert(data.error || "Error al iniciar sesión", "error");
        }
        
      } catch (error) {
        console.error('Error en login:', error);
        showAlert("Error de conexión. Intenta nuevamente.", "error");
      } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // — Register Form —
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      const email = document.getElementById("registerEmail")?.value.trim();
      const password = document.getElementById("registerPassword")?.value.trim();
      const confirmPassword = document.getElementById("confirmPassword")?.value.trim();
      
      if (!email || !password || !confirmPassword) {
        showAlert("Por favor completa todos los campos.", "error");
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showAlert("Ingresa un correo electrónico válido.", "error");
        return;
      }
      
      if (password.length < 8) {
        showAlert("La contraseña debe tener al menos 8 caracteres.", "error");
        return;
      }
      
      if (password !== confirmPassword) {
        showAlert("Las contraseñas no coinciden.", "error");
        return;
      }

      // Mostrar loading
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Registrando...';

      console.log('INICIANDO PETICIÓN DE REGISTRO...');
      console.log('Email:', email);
      console.log('Nombre:', email.split('@')[0]);
      
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            nombre: email.split('@')[0], // Usar la parte del email como nombre temporal
            password
          })
        });
        
        console.log('📡 RESPUESTA RECIBIDA:', response);

        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Response data:', data);
        
        if (response.ok) {
          console.log('REGISTRO EXITOSO - INICIANDO REDIRECCIÓN');
          
          // Guardar token en localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
          console.log('Token guardado en localStorage');
          
          showAlert("¡Registro exitoso! Redirigiendo...", "success");
          
          // Cerrar modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
          if (modal) {
            modal.hide();
            console.log('Modal cerrado');
          }
          
          // REDIRECCIÓN INMEDIATA SIN TIMEOUT
          console.log('EJECUTANDO REDIRECCIÓN INMEDIATA A /mis-cursos');
          
          // Método 1: window.location.href
          try {
            window.location.href = '/mis-cursos';
          } catch (e) {
            console.error('Error con window.location.href:', e);
            
            // Método 2: window.location.replace
            try {
              window.location.replace('/mis-cursos');
            } catch (e2) {
              console.error('Error con window.location.replace:', e2);
              
              // Método 3: history.pushState + location.reload
              history.pushState(null, null, '/mis-cursos');
              window.location.reload();
            }
          }
          
        } else {
          showAlert(data.error || "Error al registrarse", "error");
        }
        
      } catch (error) {
        console.error('Error en registro:', error);
        showAlert("Error de conexión. Intenta nuevamente.", "error");
      } finally {
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // — Google Button Placeholder —
  document.querySelectorAll(".google-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showAlert("Función de Google no implementada... aún", "info");
    });
  });

  // — Carrito, Toast y Badge —
  const cart = [];
  const cartList = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const cartModalEl = document.getElementById("cartModal");
  const badgeEl = document.getElementById("cart-count");
  const toastEl = document.getElementById("addedToast");

  document.querySelectorAll(".btn-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card-course");
      if (!card) return;
      const title = card.querySelector(".card-title-tittle h4")?.innerText.trim() || "";
      const priceText = card.querySelector(".btn-price")?.innerText.trim() || "0";
      const price = parseFloat(priceText.replace(/[^\d]/g, "")) || 0;
      cart.push({ title, price });

      // badge
      if (badgeEl) {
        badgeEl.innerText = cart.length;
        badgeEl.classList.toggle("d-none", cart.length === 0);
      }

      // toast
      if (toastEl && window.bootstrap?.Toast) {
        new bootstrap.Toast(toastEl).show();
      }
    });
  });

  // Renderizar carrito
  if (cartModalEl) {
    cartModalEl.addEventListener("show.bs.modal", () => {
      if (cartList) {
        cartList.innerHTML = "";
        cart.forEach((item) => {
          const li = document.createElement("li");
          li.className =
            "list-group-item d-flex justify-content-between align-items-center";
          li.innerHTML = `
            ${item.title}
            <span>${item.price.toLocaleString("es-CO", {
              style: "currency",
              currency: "COP",
            })}</span>
          `;
          cartList.appendChild(li);
        });
      }
      if (cartTotal) {
        const total = cart.reduce((sum, itm) => sum + itm.price, 0);
        cartTotal.innerText = total.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
        });
      }
    });
  }
});

// — Función para mostrar alertas —
function showAlert(message, type = 'info') {
  // Crear el elemento de alerta
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  
  alertDiv.innerHTML = `
    <i class="bi bi-${getAlertIcon(type)}"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
}

function getAlertIcon(type) {
  switch(type) {
    case 'success': return 'check-circle-fill';
    case 'error': return 'exclamation-triangle-fill';
    case 'warning': return 'exclamation-triangle-fill';
    case 'info': return 'info-circle-fill';
    default: return 'info-circle-fill';
  }
}

// — Verificar si el usuario ya está logueado —
function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const usuario = localStorage.getItem('usuario');
  
  if (token && usuario) {
    // Usuario ya está logueado, actualizar UI
    try {
      const userData = JSON.parse(usuario);
      updateUIForLoggedUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  }
}

// — Actualizar UI para usuario logueado —
function updateUIForLoggedUser(usuario) {
  // Solo ocultar botones si NO estamos en la landing page
  const isLandingPage = window.location.pathname === '/';
  
  if (!isLandingPage) {
    // Ocultar botones de login/register en otras páginas
    const loginBtn = document.querySelector('[data-bs-target="#loginModal"]');
    const registerBtn = document.querySelector('[data-bs-target="#registerModal"]');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
  } else {
    // En la landing page, mostrar dropdown de usuario junto a los botones
    const authButtons = document.querySelector('.auth-buttons, .d-flex.gap-2');
    if (authButtons) {
      // Verificar si ya existe el dropdown
      if (!document.getElementById('user-dropdown')) {
        const userDropdown = document.createElement('div');
        userDropdown.id = 'user-dropdown';
        userDropdown.className = 'dropdown ms-2';
        userDropdown.innerHTML = `
          <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle"></i> ${usuario.nombre}
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="/mis-cursos"><i class="bi bi-book"></i> Mis Cursos</a></li>
            <li><a class="dropdown-item" href="/dashboard"><i class="bi bi-speedometer2"></i> Dashboard</a></li>
            <li><a class="dropdown-item" href="/perfil"><i class="bi bi-person"></i> Mi Perfil</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Cerrar Sesión</button></li>
          </ul>
        `;
        authButtons.appendChild(userDropdown);
      }
    }
  }
  
  // Mostrar información del usuario en otras páginas
  const userInfo = document.getElementById('user-info');
  if (userInfo && !isLandingPage) {
    userInfo.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle"></i> ${usuario.nombre}
        </button>
        <ul class="dropdown-menu">
          <li><a class="dropdown-item" href="/mis-cursos"><i class="bi bi-book"></i> Mis Cursos</a></li>
          <li><a class="dropdown-item" href="/dashboard"><i class="bi bi-speedometer2"></i> Dashboard</a></li>
          <li><a class="dropdown-item" href="/perfil"><i class="bi bi-person"></i> Mi Perfil</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><button class="dropdown-item" onclick="logout()"><i class="bi bi-box-arrow-right"></i> Cerrar Sesión</button></li>
        </ul>
      </div>
    `;
    userInfo.style.display = 'block';
  }
}

// — Función para cerrar sesión —
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  showAlert('Sesión cerrada exitosamente', 'success');
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Verificar estado de autenticación al cargar la página
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// — Scroll to Top Button —
window.addEventListener("scroll", () => {
  const btn = document.getElementById("btn-scroll-top");
  if (btn) btn.style.display = window.scrollY > 300 ? "block" : "none";
});
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
