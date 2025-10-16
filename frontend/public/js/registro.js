// Funcionalidad para mostrar/ocultar contraseñas
function setupPasswordToggle(inputId, buttonId, iconId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  const icon = document.getElementById(iconId);
  
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

// Validación de contraseñas en tiempo real
function validatePasswords() {
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordMatch = document.getElementById('passwordMatch');
  const matchMessage = document.getElementById('matchMessage');
  const submitBtn = document.getElementById('submitBtn');
  
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  if (confirmPassword.length === 0) {
    passwordMatch.classList.add('hidden');
    submitBtn.disabled = false;
    return;
  }
  
  passwordMatch.classList.remove('hidden');
  
  if (password === confirmPassword) {
    matchMessage.textContent = '✓ Las contraseñas coinciden';
    matchMessage.className = 'text-green-600';
    submitBtn.disabled = false;
  } else {
    matchMessage.textContent = '✗ Las contraseñas no coinciden';
    matchMessage.className = 'text-red-600';
    submitBtn.disabled = true;
  }
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  // Configurar toggles para ambas contraseñas
  setupPasswordToggle('password', 'togglePassword', 'eyeIcon');
  setupPasswordToggle('confirmPassword', 'toggleConfirmPassword', 'eyeIconConfirm');

  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  // Validar longitud mínima de contraseña
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    if (password.length > 0 && password.length < 6) {
      this.classList.add('border-red-300');
      this.classList.remove('border-gray-300');
    } else {
      this.classList.remove('border-red-300');
      this.classList.add('border-gray-300');
    }
    validatePasswords();
  });

  confirmPasswordInput.addEventListener('input', validatePasswords);

  // Cargar CAPTCHA al cargar la página
  cargarCaptcha();

  // Botón para refrescar CAPTCHA
  document.getElementById('refreshCaptcha').addEventListener('click', cargarCaptcha);

  // Validación del formulario antes del envío
  document.querySelector('form').addEventListener('submit', function(e) {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const captchaRespuesta = document.getElementById('captchaRespuesta').value;
    
    if (password !== confirmPassword) {
      e.preventDefault();
      alert('Las contraseñas no coinciden');
      return false;
    }
    
    if (password.length < 6) {
      e.preventDefault();
      alert('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    
    if (!captchaRespuesta || captchaRespuesta.trim() === '') {
      e.preventDefault();
      alert('Por favor, resuelve la operación matemática');
      return false;
    }
  });
});
