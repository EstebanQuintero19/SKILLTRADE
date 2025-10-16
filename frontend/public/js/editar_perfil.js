// Función para obtener token de autenticación
function getAuthToken() {
  if (window.sessionData && window.sessionData.token) {
    return window.sessionData.token;
  }
  return localStorage.getItem('authToken') || '';
}

// Función para mostrar/ocultar contraseñas
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const icon = document.getElementById(fieldId + '-icon');
  
  if (field.type === 'password') {
    field.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    field.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

// Validación de fortaleza de contraseña
function checkPasswordStrength(password) {
  let strength = 0;
  let feedback = 'Débil';
  let color = 'bg-red-400';
  let width = '20%';

  if (password.length >= 6) strength += 1;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  switch (strength) {
    case 0:
    case 1:
      feedback = 'Muy débil';
      color = 'bg-red-500';
      width = '20%';
      break;
    case 2:
      feedback = 'Débil';
      color = 'bg-red-400';
      width = '40%';
      break;
    case 3:
      feedback = 'Regular';
      color = 'bg-yellow-400';
      width = '60%';
      break;
    case 4:
      feedback = 'Fuerte';
      color = 'bg-green-400';
      width = '80%';
      break;
    case 5:
      feedback = 'Muy fuerte';
      color = 'bg-green-500';
      width = '100%';
      break;
  }

  return { feedback, color, width };
}

// Función para mostrar notificaciones toast
function mostrarNotificacion(mensaje, tipo = 'success') {
  const colores = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const toast = document.createElement('div');
  toast.className = `toast fixed top-4 right-4 ${colores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`;
  toast.innerHTML = `
    <i class="fas ${tipo === 'success' ? 'fa-check' : tipo === 'error' ? 'fa-times' : 'fa-info'}"></i>
    <span>${mensaje}</span>
    <button onclick="this.parentElement.remove()" class="ml-2 hover:bg-white/20 rounded p-1">
      <i class="fas fa-times text-xs"></i>
    </button>
  `;

  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Función para cambiar contraseña
async function cambiarContrasena() {
  const passwordActual = document.getElementById('passwordActual').value;
  const passwordNueva = document.getElementById('passwordNueva').value;
  const passwordConfirmar = document.getElementById('passwordConfirmar').value;

  if (!passwordActual || !passwordNueva || !passwordConfirmar) {
    mostrarNotificacion('Por favor completa todos los campos de contraseña', 'error');
    return;
  }

  if (passwordNueva.length < 6) {
    mostrarNotificacion('La nueva contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  if (passwordNueva !== passwordConfirmar) {
    mostrarNotificacion('Las contraseñas no coinciden', 'error');
    return;
  }

  try {
    const token = getAuthToken();
    if (!token) {
      mostrarNotificacion('No estás autenticado', 'error');
      return;
    }

    const response = await fetch('/api/usuarios/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        passwordActual: passwordActual,
        passwordNuevo: passwordNueva
      })
    });

    const data = await response.json();

    if (response.ok) {
      mostrarNotificacion('Contraseña actualizada exitosamente', 'success');
      document.getElementById('passwordActual').value = '';
      document.getElementById('passwordNueva').value = '';
      document.getElementById('passwordConfirmar').value = '';
      document.getElementById('strength-fill').style.width = '0%';
      document.getElementById('strength-text').textContent = 'Débil';
      document.getElementById('password-match').classList.add('hidden');
    } else {
      mostrarNotificacion(data.mensaje || 'Error al cambiar la contraseña', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error de conexión', 'error');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Contador de caracteres para biografía
  const bioTextarea = document.querySelector('textarea[name="biografia"]');
  const bioCount = document.getElementById('bio-count');
  
  if (bioTextarea && bioCount) {
    const updateCount = () => {
      bioCount.textContent = bioTextarea.value.length;
    };
    
    bioTextarea.addEventListener('input', updateCount);
    updateCount();
  }

  // Mostrar notificaciones basadas en parámetros URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'perfil_actualizado') {
    mostrarNotificacion('Perfil actualizado exitosamente', 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  if (urlParams.get('error') === 'error_actualizacion') {
    mostrarNotificacion('Error al actualizar el perfil. Inténtalo de nuevo.', 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const passwordNueva = document.getElementById('passwordNueva');
  const passwordConfirmar = document.getElementById('passwordConfirmar');
  const strengthFill = document.getElementById('strength-fill');
  const strengthText = document.getElementById('strength-text');
  const passwordMatch = document.getElementById('password-match');

  if (passwordNueva) {
    passwordNueva.addEventListener('input', function() {
      const password = this.value;
      const strength = checkPasswordStrength(password);
      
      strengthFill.className = `h-full transition-all duration-300 ${strength.color}`;
      strengthFill.style.width = strength.width;
      strengthText.textContent = strength.feedback;
      
      if (passwordConfirmar.value) {
        validatePasswordMatch();
      }
    });
  }

  if (passwordConfirmar) {
    passwordConfirmar.addEventListener('input', validatePasswordMatch);
  }

  function validatePasswordMatch() {
    const nueva = passwordNueva.value;
    const confirmar = passwordConfirmar.value;
    
    if (confirmar.length > 0) {
      if (nueva === confirmar) {
        passwordMatch.textContent = 'Las contraseñas coinciden';
        passwordMatch.className = 'text-xs mt-1 text-green-600';
        passwordMatch.classList.remove('hidden');
      } else {
        passwordMatch.textContent = 'Las contraseñas no coinciden';
        passwordMatch.className = 'text-xs mt-1 text-red-600';
        passwordMatch.classList.remove('hidden');
      }
    } else {
      passwordMatch.classList.add('hidden');
    }
  }
});
