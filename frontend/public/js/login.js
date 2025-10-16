// Funcionalidad para mostrar/ocultar contraseña en login
function setupLoginPasswordToggle() {
  const input = document.getElementById('loginPassword');
  const button = document.getElementById('toggleLoginPassword');
  const icon = document.getElementById('loginEyeIcon');
  
  if (!input || !button || !icon) return;
  
  button.addEventListener('click', function() {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    
    if (type === 'text') {
      icon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
      `;
    } else {
      icon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      `;
    }
  });
}

// Funcionalidad "Recordarme"
function setupRememberMe() {
  const emailInput = document.querySelector('input[name="email"]');
  const rememberCheckbox = document.getElementById('rememberMe');
  
  if (!emailInput || !rememberCheckbox) return;
  
  const savedEmail = localStorage.getItem('rememberedEmail');
  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberCheckbox.checked = true;
  }
  
  rememberCheckbox.addEventListener('change', function() {
    if (this.checked && emailInput.value) {
      localStorage.setItem('rememberedEmail', emailInput.value);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
  });
  
  emailInput.addEventListener('input', function() {
    if (rememberCheckbox.checked) {
      localStorage.setItem('rememberedEmail', this.value);
    }
  });
}

// Funciones para manejar CAPTCHA
async function cargarCaptcha() {
  try {
    const response = await fetch('/api/captcha');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('captchaPregunta').textContent = data.pregunta;
      document.getElementById('captchaRespuesta').value = '';
    } else {
      document.getElementById('captchaPregunta').textContent = 'Error al cargar';
    }
  } catch (error) {
    console.error('Error cargando CAPTCHA:', error);
    document.getElementById('captchaPregunta').textContent = 'Error al cargar';
  }
}

// Validación del formulario antes del envío
function setupFormValidation() {
  const form = document.querySelector('form');
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    const captchaRespuesta = document.getElementById('captchaRespuesta').value;
    
    if (!captchaRespuesta || captchaRespuesta.trim() === '') {
      e.preventDefault();
      alert('Por favor, resuelve la operación matemática');
      return false;
    }
  });
}

// Inicializar funcionalidades cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  setupLoginPasswordToggle();
  setupRememberMe();
  setupFormValidation();
  cargarCaptcha();
  
  const refreshBtn = document.getElementById('refreshCaptcha');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', cargarCaptcha);
  }
});
