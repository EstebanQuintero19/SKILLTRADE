// Variables globales para el modal de intercambio
let usuariosEncontrados = [];
let cursosUsuarioSeleccionado = [];
let todosLosUsuarios = [];

// Función para agregar curso al carrito
async function agregarAlCarrito(cursoId) {
  const isSignedIn = window.sessionData && window.sessionData.signedIn;
  
  if (!isSignedIn) {
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch('/api/ventas/carrito/agregar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ cursoId: cursoId })
    });

    const data = await response.json();

    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }

    if (response.ok) {
      mostrarNotificacion('Curso agregado al carrito exitosamente', 'success');
      actualizarContadorCarrito();
    } else {
      mostrarNotificacion(data.error || 'Error al agregar al carrito', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error de conexión', 'error');
  }
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform translate-x-full transition-all duration-300 ${
    tipo === 'success' ? 'bg-green-500 text-white' :
    tipo === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  
  notificacion.innerHTML = `
    <div class="flex items-center gap-3">
      <i class="fas ${
        tipo === 'success' ? 'fa-check-circle' :
        tipo === 'error' ? 'fa-exclamation-circle' :
        'fa-info-circle'
      }"></i>
      <span>${mensaje}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 hover:opacity-75">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;

  document.body.appendChild(notificacion);

  setTimeout(() => {
    notificacion.style.transform = 'translateX(0)';
  }, 100);

  setTimeout(() => {
    notificacion.style.transform = 'translateX(full)';
    setTimeout(() => {
      if (notificacion.parentElement) {
        notificacion.remove();
      }
    }, 300);
  }, 5000);
}

// Función para actualizar contador del carrito
async function actualizarContadorCarrito() {
  try {
    const response = await fetch('/api/ventas/carrito', {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      const items = data.items || data.data?.items || [];
      const contador = document.querySelector('#carrito-contador');
      if (contador) {
        contador.textContent = items.length;
        contador.style.display = items.length > 0 ? 'inline' : 'none';
      }
    }
  } catch (error) {
    console.error('Error actualizando contador del carrito:', error);
  }
}

// Función para abrir el modal de intercambio
async function abrirModalIntercambio() {
  const modal = document.getElementById('modalIntercambio');
  modal.classList.remove('hidden');
  
  await cargarMisCursos();
}

// Función para cerrar el modal
function cerrarModalIntercambio() {
  const modal = document.getElementById('modalIntercambio');
  modal.classList.add('hidden');
  
  document.getElementById('formIntercambio').reset();
  limpiarUsuarioSeleccionado();
}

// Cargar mis cursos
async function cargarMisCursos() {
  try {
    const token = getAuthToken();
    const response = await fetch('/api/biblioteca/cursos-propios', {
      headers: {
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const select = document.getElementById('miCurso');
      select.innerHTML = '<option value="">Selecciona uno de tus cursos...</option>';
      
      data.cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso._id;
        option.textContent = `${curso.titulo} (${curso.categoria.join(', ')})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error cargando mis cursos:', error);
    mostrarNotificacion('Error al cargar tus cursos', 'error');
  }
}

// Función para buscar usuarios
async function buscarUsuarios(query) {
  try {
    const token = getAuthToken();
    const response = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(query)}`, {
      headers: {
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      mostrarResultadosUsuarios(data.data || []);
    }
  } catch (error) {
    console.error('Error buscando usuarios:', error);
  }
}

// Función para cargar todos los usuarios
async function cargarTodosLosUsuarios() {
  try {
    const token = getAuthToken();
    const response = await fetch('/api/usuarios', {
      headers: {
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      let usuarios = [];
      if (data.data && data.data.usuarios) {
        usuarios = data.data.usuarios;
      } else if (data.usuarios) {
        usuarios = data.usuarios;
      } else if (Array.isArray(data.data)) {
        usuarios = data.data;
      } else if (Array.isArray(data)) {
        usuarios = data;
      }
      
      todosLosUsuarios = usuarios;
    }
  } catch (error) {
    console.error('Error cargando todos los usuarios:', error);
  }
}

// Mostrar resultados de búsqueda de usuarios
function mostrarResultadosUsuarios(usuarios) {
  const contenedor = document.getElementById('resultadosUsuarios');
  
  if (!contenedor) {
    return;
  }
  
  if (usuarios.length === 0) {
    contenedor.innerHTML = `
      <div class="p-2 text-center text-gray-500">
        <i class="fas fa-users text-sm"></i>
        <span class="text-xs ml-2">No se encontraron usuarios</span>
      </div>
    `;
    contenedor.classList.remove('hidden');
    return;
  }
  
  contenedor.innerHTML = '';
  contenedor.classList.remove('hidden');
  
  usuarios.forEach((usuario, index) => {
    const div = document.createElement('div');
    div.className = `flex items-center px-2 py-1.5 hover:bg-teal-50 cursor-pointer transition-colors ${index === usuarios.length - 1 ? '' : 'border-b border-gray-100'}`;
    div.innerHTML = `
      <div class="w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-2 flex-shrink-0">
        ${usuario.nombre.charAt(0).toUpperCase()}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-medium text-gray-900 text-xs truncate">${usuario.nombre}</div>
      </div>
      <i class="fas fa-chevron-right text-gray-400 text-xs ml-1 flex-shrink-0"></i>
    `;
    
    div.addEventListener('click', () => seleccionarUsuario(usuario));
    contenedor.appendChild(div);
  });
}

// Seleccionar usuario
async function seleccionarUsuario(usuario) {
  document.getElementById('usuarioSeleccionado').value = usuario._id;
  document.getElementById('nombreUsuarioElegido').textContent = usuario.nombre;
  document.getElementById('emailUsuarioElegido').textContent = usuario.email;
  document.getElementById('usuarioElegido').classList.remove('hidden');
  document.getElementById('resultadosUsuarios').classList.add('hidden');
  document.getElementById('buscarUsuario').value = '';
  
  await cargarCursosUsuario(usuario._id);
}

// Limpiar usuario seleccionado
function limpiarUsuarioSeleccionado() {
  document.getElementById('usuarioSeleccionado').value = '';
  document.getElementById('usuarioElegido').classList.add('hidden');
  document.getElementById('cursoUsuario').innerHTML = '<option value="">Primero selecciona un usuario...</option>';
  document.getElementById('cursoUsuario').disabled = true;
}

// Cargar cursos del usuario seleccionado
async function cargarCursosUsuario(usuarioId) {
  try {
    const token = getAuthToken();
    const response = await fetch(`/api/biblioteca/cursos-usuario/${usuarioId}`, {
      headers: {
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      const select = document.getElementById('cursoUsuario');
      select.innerHTML = '<option value="">Selecciona el curso que deseas...</option>';
      select.disabled = false;
      
      let cursos = [];
      if (data.data && Array.isArray(data.data)) {
        cursos = data.data;
      } else if (data.cursos && Array.isArray(data.cursos)) {
        cursos = data.cursos;
      } else if (Array.isArray(data)) {
        cursos = data;
      }
      
      if (cursos.length > 0) {
        cursos.forEach(curso => {
          const option = document.createElement('option');
          option.value = curso._id;
          option.textContent = `${curso.titulo} (${curso.categoria.join(', ')}) - ${curso.precio > 0 ? '$' + curso.precio : 'Gratis'}`;
          select.appendChild(option);
        });
      } else {
        select.innerHTML = '<option value="">Este usuario no tiene cursos disponibles</option>';
      }
    }
  } catch (error) {
    console.error('Error cargando cursos del usuario:', error);
    mostrarNotificacion('Error al cargar cursos del usuario', 'error');
  }
}

// Enviar solicitud de intercambio
async function enviarSolicitudIntercambio() {
  try {
    const formData = new FormData(document.getElementById('formIntercambio'));
    const data = Object.fromEntries(formData.entries());
    
    if (!data.cursoEmisor) {
      mostrarNotificacion('Selecciona uno de tus cursos', 'error');
      return;
    }
    
    if (!data.receptor) {
      mostrarNotificacion('Selecciona un usuario', 'error');
      return;
    }
    
    if (!data.cursoReceptor) {
      mostrarNotificacion('Selecciona el curso que deseas', 'error');
      return;
    }
    
    const token = getAuthToken();
    const response = await fetch('/api/intercambios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      mostrarNotificacion('Solicitud de intercambio enviada exitosamente', 'success');
      cerrarModalIntercambio();
    } else {
      const error = await response.json();
      mostrarNotificacion(error.error || 'Error al enviar solicitud', 'error');
    }
  } catch (error) {
    console.error('Error enviando solicitud:', error);
    mostrarNotificacion('Error al enviar solicitud de intercambio', 'error');
  }
}

// Función para obtener token de autenticación
function getAuthToken() {
  if (window.sessionData && window.sessionData.token) {
    return window.sessionData.token;
  }
  return localStorage.getItem('authToken') || '';
}

// Función para toggle favorito
async function toggleFavorito(cursoId) {
  try {
    const token = getAuthToken();
    if (!token) {
      mostrarNotificacion('Debes iniciar sesión para agregar favoritos', 'error');
      return;
    }

    const btn = document.querySelector(`button[onclick="toggleFavorito('${cursoId}')"]`);
    const icon = btn.querySelector('i');
    
    btn.disabled = true;
    icon.className = 'fas fa-spinner fa-spin text-gray-400';
    
    const response = await fetch(`/api/biblioteca/favoritos/${cursoId}`, {
      method: 'POST',
      headers: {
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.action === 'added') {
        icon.className = 'fas fa-heart text-red-500';
        btn.classList.add('active');
        mostrarNotificacion('Curso agregado a favoritos', 'success');
      } else {
        icon.className = 'fas fa-heart text-gray-400';
        btn.classList.remove('active');
        mostrarNotificacion('Curso removido de favoritos', 'success');
      }
    } else {
      icon.className = 'fas fa-heart text-gray-400';
      mostrarNotificacion('Error al actualizar favoritos', 'error');
    }
    
    btn.disabled = false;
  } catch (error) {
    console.error('Error toggling favorito:', error);
    mostrarNotificacion('Error de conexión', 'error');
    
    const btn = document.querySelector(`button[onclick="toggleFavorito('${cursoId}')"]`);
    if (btn) {
      const icon = btn.querySelector('i');
      icon.className = 'fas fa-heart text-gray-400';
      btn.disabled = false;
    }
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Búsqueda de usuarios en tiempo real
  const buscarInput = document.getElementById('buscarUsuario');
  let timeoutBusqueda;
  
  if (buscarInput) {
    buscarInput.addEventListener('focus', async () => {
      if (todosLosUsuarios.length === 0) {
        const contenedor = document.getElementById('resultadosUsuarios');
        contenedor.innerHTML = `
          <div class="p-2 text-center text-gray-500">
            <i class="fas fa-spinner fa-spin text-sm"></i>
            <span class="text-xs ml-2">Cargando...</span>
          </div>
        `;
        contenedor.classList.remove('hidden');
        
        await cargarTodosLosUsuarios();
      }
      mostrarResultadosUsuarios(todosLosUsuarios);
    });

    buscarInput.addEventListener('input', (e) => {
      clearTimeout(timeoutBusqueda);
      const query = e.target.value.trim();
      
      if (query.length === 0) {
        mostrarResultadosUsuarios(todosLosUsuarios);
        return;
      }
      
      if (query.length < 2) {
        document.getElementById('resultadosUsuarios').classList.add('hidden');
        return;
      }
      
      const usuariosFiltrados = todosLosUsuarios.filter(usuario => 
        usuario.nombre.toLowerCase().includes(query.toLowerCase()) ||
        usuario.email.toLowerCase().includes(query.toLowerCase())
      );
      
      mostrarResultadosUsuarios(usuariosFiltrados);
      
      timeoutBusqueda = setTimeout(() => {
        buscarUsuarios(query);
      }, 500);
    });

    document.addEventListener('click', (e) => {
      if (!buscarInput.contains(e.target) && !document.getElementById('resultadosUsuarios').contains(e.target)) {
        document.getElementById('resultadosUsuarios').classList.add('hidden');
      }
    });
  }

  // Formulario de intercambio
  const form = document.getElementById('formIntercambio');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await enviarSolicitudIntercambio();
    });
  }

  // Envío automático del formulario de búsqueda
  const searchForm = document.querySelector('form[action="/cursos"]');
  const searchInput = searchForm?.querySelector('input[name="q"]');
  
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchForm.submit();
      }, 1000);
    });
  }
  
  // Animación inicial de las tarjetas
  const cards = document.querySelectorAll('.course-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });

  // Actualizar contador del carrito al cargar la página
  actualizarContadorCarrito();
});

// Efecto parallax sutil en el hero
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.gradient-bg');
  if (hero) {
    hero.style.transform = `translateY(${scrolled * 0.2}px)`;
  }
});
