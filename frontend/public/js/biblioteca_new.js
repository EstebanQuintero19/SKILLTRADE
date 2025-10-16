let seccionActual = 'propios';

// Función para obtener el token de autenticación
function getAuthToken() {
  return document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1] || '';
}

// Función para cambiar de sección
async function cambiarSeccion(seccion) {
  if (seccionActual === seccion) return;
  
  seccionActual = seccion;
  
  // Actualizar tabs
  document.querySelectorAll('.section-tab').forEach(tab => {
    tab.classList.remove('section-active');
    tab.classList.add('bg-gray-100', 'text-gray-700');
  });
  
  const tabActivo = document.getElementById(`tab-${seccion}`);
  tabActivo.classList.add('section-active');
  tabActivo.classList.remove('bg-gray-100', 'text-gray-700');
  
  // Cargar cursos de la sección
  await cargarCursos(seccion);
}

// Función para cargar cursos según la sección
async function cargarCursos(seccion) {
  const contenedor = document.getElementById('contenedor-cursos');
  contenedor.innerHTML = `
    <div class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
      <p class="text-gray-600">Cargando cursos...</p>
    </div>
  `;
  
  try {
    const token = getAuthToken();
    let endpoint = '';
    
    switch(seccion) {
      case 'propios':
        endpoint = '/api/biblioteca/cursos-propios';
        break;
      case 'intercambio':
        endpoint = '/api/biblioteca/cursos-intercambio';
        break;
      case 'favoritos':
        endpoint = '/api/biblioteca/favoritos';
        break;
      case 'comprados':
        endpoint = '/api/biblioteca/cursos-comprados';
        break;
    }
    
    const response = await fetch(endpoint, {
      headers: {
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const cursos = data.data || data.cursos || [];
      mostrarCursos(cursos, seccion);
    } else {
      mostrarError('Error al cargar los cursos');
    }
  } catch (error) {
    console.error('Error cargando cursos:', error);
    mostrarError('Error de conexión');
  }
}

// Función para mostrar cursos
function mostrarCursos(cursos, seccion) {
  const contenedor = document.getElementById('contenedor-cursos');
  
  if (cursos.length === 0) {
    contenedor.innerHTML = mostrarEstadoVacio(seccion);
    return;
  }
  
  const cursosHTML = cursos.map(curso => `
    <div class="bg-white rounded-xl card-shadow overflow-hidden course-card">
      <div class="relative">
        <img src="${curso.imagen || '/images/default-course.jpg'}" alt="${curso.titulo}" class="w-full h-48 object-cover">
        ${seccion !== 'propios' && seccion !== 'intercambio' ? `
          <button onclick="toggleFavorito('${curso._id}')" class="favorite-btn absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg">
            <i class="fas fa-heart text-gray-400"></i>
          </button>
        ` : ''}
        ${seccion === 'intercambio' && curso.intercambio ? `
          <div class="absolute top-3 left-3 bg-teal-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <i class="fas fa-clock mr-1"></i>
            Hasta ${new Date(curso.intercambio.fechaFin).toLocaleDateString()}
          </div>
        ` : ''}
      </div>
      <div class="p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-2">${curso.titulo}</h3>
        <p class="text-gray-600 mb-4 line-clamp-2">${curso.descripcion || 'Sin descripción'}</p>
        
        <div class="flex flex-wrap gap-2 mb-4">
          ${(curso.categoria || []).map(cat => `
            <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">${cat}</span>
          `).join('')}
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4 text-sm text-gray-500">
            <span><i class="fas fa-signal mr-1"></i>${curso.nivel || 'Principiante'}</span>
            ${curso.precio ? `<span class="font-bold text-green-600">$${curso.precio.toLocaleString()}</span>` : ''}
          </div>
          
          <div class="flex gap-2">
            ${seccion === 'propios' ? `
              <a href="/curso/${curso._id}/editar" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-edit mr-1"></i>Editar
              </a>
            ` : `
              <a href="/curso/${curso._id}" class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-eye mr-1"></i>Ver
              </a>
            `}
          </div>
        </div>
        
        ${seccion === 'intercambio' && curso.intercambio ? `
          <div class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600">
              <i class="fas fa-user mr-1"></i>
              Intercambiado con: <strong>${curso.intercambio.solicitante.nombre}</strong>
            </p>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  contenedor.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${cursosHTML}
    </div>
  `;
}

// Función para mostrar estado vacío
function mostrarEstadoVacio(seccion) {
  const mensajes = {
    propios: {
      icono: 'fas fa-user-graduate',
      titulo: 'No tienes cursos creados',
      descripcion: 'Comienza creando tu primer curso y comparte tu conocimiento',
      accion: '<a href="/crear-curso" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"><i class="fas fa-plus mr-2"></i>Crear Curso</a>'
    },
    intercambio: {
      icono: 'fas fa-exchange-alt',
      titulo: 'No tienes cursos por intercambio',
      descripcion: 'Los cursos que recibas por intercambio aparecerán aquí',
      accion: '<a href="/cursos" class="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"><i class="fas fa-search mr-2"></i>Explorar Cursos</a>'
    },
    favoritos: {
      icono: 'fas fa-heart',
      titulo: 'No tienes cursos favoritos',
      descripcion: 'Marca cursos como favoritos para acceder fácilmente a ellos',
      accion: '<a href="/cursos" class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"><i class="fas fa-heart mr-2"></i>Explorar Cursos</a>'
    },
    comprados: {
      icono: 'fas fa-shopping-cart',
      titulo: 'No has comprado cursos',
      descripcion: 'Los cursos que compres aparecerán aquí para acceso permanente',
      accion: '<a href="/cursos" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"><i class="fas fa-shopping-cart mr-2"></i>Explorar Cursos</a>'
    }
  };
  
  const mensaje = mensajes[seccion];
  
  return `
    <div class="text-center py-16">
      <div class="bg-white rounded-xl card-shadow p-12 max-w-md mx-auto">
        <i class="${mensaje.icono} text-6xl text-gray-300 mb-6"></i>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">${mensaje.titulo}</h3>
        <p class="text-gray-600 mb-8">${mensaje.descripcion}</p>
        ${mensaje.accion}
      </div>
    </div>
  `;
}

// Función para mostrar error
function mostrarError(mensaje) {
  const contenedor = document.getElementById('contenedor-cursos');
  contenedor.innerHTML = `
    <div class="text-center py-16">
      <div class="bg-white rounded-xl card-shadow p-12 max-w-md mx-auto">
        <i class="fas fa-exclamation-triangle text-6xl text-red-300 mb-6"></i>
        <h3 class="text-2xl font-bold text-gray-900 mb-4">Error</h3>
        <p class="text-gray-600 mb-8">${mensaje}</p>
        <button onclick="cargarCursos(seccionActual)" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          <i class="fas fa-redo mr-2"></i>Reintentar
        </button>
      </div>
    </div>
  `;
}

// Función para toggle favorito
async function toggleFavorito(cursoId) {
  try {
    const token = getAuthToken();
    const response = await fetch(`/api/biblioteca/favoritos/${cursoId}`, {
      method: 'POST',
      headers: {
        'X-API-Key': token,
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      // Recargar la sección actual
      await cargarCursos(seccionActual);
    }
  } catch (error) {
    console.error('Error toggling favorito:', error);
  }
}

// Cargar cursos al inicializar
document.addEventListener('DOMContentLoaded', () => {
  cargarCursos('propios');
});
