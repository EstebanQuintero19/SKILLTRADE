const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const multer = require('multer');
require('dotenv').config();

const app = express();

// Config
const PORT = process.env.FRONTEND_PORT || 4000; // puerto del servidor FRONT
const API_BASE = process.env.API_BASE || 'http://localhost:3000'; // backend API base

// Motor de vistas: EJS
app.set('view engine', 'ejs');
// Ruta a las vistas (este proyecto usa frontend/frontend/views)
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Estáticos opcionales (si usas public/ para assets del front)
app.use('/static', express.static(path.join(__dirname, 'public')));

// Servir archivos CSS y JS directamente
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// Inyectar variables globales para las vistas (por ejemplo, base de API)
app.locals.API_BASE = API_BASE;

// Axios client con API Key (si existe)
const FRONTEND_API_KEY = process.env.FRONTEND_API_KEY || process.env.API_KEY;
const api = axios.create({ baseURL: `${API_BASE}/api` });
api.interceptors.request.use((config) => {
  // API key por usuario desde cookie
  // Si no hay cookie y existe FRONTEND_API_KEY (dev), úsala como fallback
  const req = config.__req;
  const cookieKey = req?.cookies?.auth_token;
  const key = cookieKey || FRONTEND_API_KEY;
  if (key) {
    config.headers['X-API-Key'] = key;
    config.headers['rh-api-key'] = key;
    config.headers['Authorization'] = `Bearer ${key}`;
  }
  return config;
});

// Middleware para inyectar signedIn y datos de usuario
app.use(async (req, res, next) => {
  const hasToken = Boolean(req.cookies?.auth_token);
  res.locals.signedIn = hasToken;
  res.locals.user = null;
  res.locals.token = req.cookies?.auth_token || null; // Pasar token a las vistas
  
  console.log(`Middleware auth - Ruta: ${req.path}, Token presente: ${hasToken}`);
  
  // Si hay token, intentar obtener datos del usuario (evitar rutas de auth y assets)
  if (hasToken && !req.path.includes('/login') && !req.path.includes('/registro') && !req.path.includes('/static')) {
    try {
      const { data } = await api.get('/usuarios/perfil', { __req: req });
      res.locals.user = data?.data?.usuario || data?.usuario || null;
      console.log(`Usuario autenticado: ${res.locals.user?.nombre || 'Sin nombre'}`);
    } catch (error) {
      console.log('Error validando token en middleware:', error.response?.status, error.message);
      
      // Solo limpiar cookie si es específicamente "API Key inválida" o "API Key expirada"
      if (error.response?.status === 401 && !req.path.includes('/logout')) {
        const errorMessage = error.response?.data?.message || '';
        if (errorMessage.includes('API Key inválida') || errorMessage.includes('API Key expirada')) {
          console.log('API Key inválida/expirada detectada, limpiando cookie');
          res.clearCookie('auth_token');
          res.locals.signedIn = false;
          res.locals.token = null;
        } else {
          console.log('Error 401 temporal, manteniendo sesión');
        }
      }
      // Para otros errores (500, timeout, etc.), mantener signedIn = true pero sin datos de usuario
    }
  }
  
  console.log(`Middleware resultado - signedIn: ${res.locals.signedIn}, user: ${res.locals.user ? 'presente' : 'null'}`);
  next();
});

// Rutas de páginas
app.get('/', async (req, res) => {
  console.log(`Ruta HOME - signedIn: ${res.locals.signedIn}, user: ${res.locals.user ? res.locals.user.nombre : 'null'}`);
  try {
    // Obtener cursos y estadísticas en paralelo
    const [cursosResponse, estadisticasResponse] = await Promise.all([
      api.get(`/cursos`, { __req: req }),
      api.get(`/estadisticas`, { __req: req })
    ]);
    
    const cursos = cursosResponse.data?.data?.cursos || cursosResponse.data?.cursos || cursosResponse.data || [];
    const estadisticas = estadisticasResponse.data?.data?.estadisticas || {};
    
    res.render('pages/index', { 
      title: 'Home', 
      cursos, 
      estadisticas,
      API_BASE 
    });
  } catch (err) {
    console.error('Error fetching data for home:', err.message);
    // Valores por defecto si hay error
    const estadisticasDefault = {
      totalCursos: 0,
      totalUsuarios: 0,
      calificacionPromedio: 4.9
    };
    res.render('pages/index', { 
      title: 'Home', 
      cursos: [], 
      estadisticas: estadisticasDefault,
      API_BASE 
    });
  }
});

app.get('/home', (req, res) => res.render('pages/home', { title: 'Home usuario', API_BASE }));
// Ruta para editar curso desde biblioteca
app.get('/biblioteca/editar/:cursoId', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.redirect('/login');
  }
  
  try {
    const { cursoId } = req.params;
    
    // Obtener datos del usuario y curso
    const { data: userData } = await api.get('/usuarios/perfil', { __req: req });
    const usuario = userData?.data?.usuario || userData?.usuario || userData;
    
    const { data } = await api.get(`/cursos/${cursoId}`, { __req: req });
    const curso = data?.data || data;
    
    // Verificar permisos
    const usuarioId = usuario?._id || usuario?.id;
    const ownerId = curso?.owner?._id || curso?.owner?.id || curso?.owner;
    
    if (ownerId?.toString() !== usuarioId?.toString()) {
      return res.status(403).send(`
        <html>
          <head><title>Acceso Denegado</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Acceso Denegado</h1>
            <p>No tienes permisos para editar este curso</p>
            <a href="/biblioteca" style="color: #5a1593; text-decoration: none;">← Volver a Mi Biblioteca</a>
          </body>
        </html>
      `);
    }
    
    res.render('pages/editar_curso', { 
      title: 'Editar Curso', 
      curso,
      API_BASE 
    });
  } catch (err) {
    console.error('Error fetching curso for edit:', err.message);
    res.status(404).send(`
      <html>
        <head><title>Curso no encontrado</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Curso no encontrado</h1>
          <p>El curso que intentas editar no existe</p>
          <a href="/biblioteca" style="color: #5a1593; text-decoration: none;">← Volver a Mi Biblioteca</a>
        </body>
      </html>
    `);
  }
});

// Ruta POST para procesar la edición del curso
app.post('/curso/:cursoId/editar', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.redirect('/login');
  }
  
  const { cursoId } = req.params;
  
  try {
    console.log('=== ACTUALIZANDO CURSO ===');
    console.log('Curso ID:', cursoId);
    console.log('Token disponible:', !!req.cookies?.auth_token);
    console.log('Datos del formulario:', req.body);
    
    const { data } = await api.put(`/biblioteca/cursos/${cursoId}`, req.body, { __req: req });
    
    console.log('Curso actualizado exitosamente:', data);
    
    // Verificar si es administrador para redirigir al panel admin
    const esAdmin = res.locals.user?.email === 'skilltrade_admin@gmail.com';
    
    if (esAdmin) {
      // Si es admin, redirigir al panel de cursos admin
      res.redirect('/admin_cursos?mensaje=Curso actualizado exitosamente');
    } else {
      // Si es usuario normal, redirigir a la biblioteca
      res.redirect('/biblioteca?mensaje=Curso actualizado exitosamente');
    }
  } catch (err) {
    console.error('=== ERROR ACTUALIZANDO CURSO ===');
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
    console.error('Message:', err.message);
    console.error('Headers enviados:', err.config?.headers);
    
    const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error al actualizar el curso';
    res.redirect(`/biblioteca/editar/${cursoId}?error=${encodeURIComponent(errorMsg)}`);
  }
});

app.get('/biblioteca', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.render('pages/biblioteca', { 
      title: 'Mi Biblioteca', 
      API_BASE, 
      needAuth: true, 
      cursos: [], 
      paginacion: null,
      q: '',
      categoria: '',
      nivel: ''
    });
  }
  
  try {
    const { page = 1, limit = 6, categoria = '', nivel = '', q = '' } = req.query;
    
    // Construir query string para el backend
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (categoria && categoria !== 'todos') queryParams.append('categoria', categoria);
    if (nivel && nivel !== 'todos') queryParams.append('nivel', nivel);
    if (q && q.trim() !== '') queryParams.append('q', q.trim());
    
    const { data } = await api.get(`/cursos/mis-cursos/paginados?${queryParams.toString()}`, { __req: req });
    
    // Normalizar respuesta del backend
    const cursos = data?.data || [];
    const paginacion = data?.paginacion || {
      pagina: 1,
      totalPaginas: 0,
      totalElementos: 0,
      elementosPorPagina: 6
    };
    
    res.render('pages/biblioteca', { 
      title: 'Mi Biblioteca', 
      API_BASE, 
      needAuth: false, 
      cursos,
      paginacion,
      q: q || '',
      categoria: categoria || '',
      nivel: nivel || ''
    });
  } catch (err) {
    console.error('Error fetching biblioteca:', err.message);
    res.render('pages/biblioteca', { 
      title: 'Mi Biblioteca', 
      API_BASE, 
      needAuth: true, 
      cursos: [], 
      paginacion: null,
      q: '',
      categoria: '',
      nivel: ''
    });
  }
});

app.get('/cursos', async (req, res) => {
  try {
    // Obtener parámetros de búsqueda, filtros y paginación
    const q = req.query.q || '';
    const categoria = req.query.categoria || '';
    const nivel = req.query.nivel || '';
    const precioMin = req.query.precioMin || '';
    const precioMax = req.query.precioMax || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 6; // 6 cursos por página
    
    // Construir query string para el backend
    const queryParams = new URLSearchParams();
    if (q) queryParams.append('q', q);
    if (categoria) queryParams.append('categoria', categoria);
    if (nivel) queryParams.append('nivel', nivel);
    if (precioMin) queryParams.append('precioMin', precioMin);
    if (precioMax) queryParams.append('precioMax', precioMax);
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    // Obtener cursos y estadísticas en paralelo
    const [cursosResponse, estadisticasResponse] = await Promise.all([
      api.get(`/cursos?${queryParams.toString()}`, { __req: req }),
      api.get(`/estadisticas`, { __req: req })
    ]);
    
    // Normalizar la respuesta del backend
    console.log('Respuesta del backend cursos:', cursosResponse.data);
    const data = cursosResponse.data;
    let cursos = [];
    let paginacion = {
      pagina: page,
      totalPaginas: 1,
      totalElementos: 0,
      elementosPorPagina: limit
    };
    
    if (data && data.cursos && Array.isArray(data.cursos)) {
      cursos = data.cursos;
      paginacion = data.paginacion || paginacion;
    } else if (Array.isArray(data)) {
      cursos = data;
    } else if (data && Array.isArray(data.data)) {
      cursos = data.data;
    }
    
    const estadisticas = estadisticasResponse.data?.data?.estadisticas || {};
    
    console.log('Cursos normalizados:', cursos.length, 'cursos encontrados');
    console.log('Paginación:', paginacion);
    
    res.render('pages/cursos', { 
      title: 'Cursos', 
      cursos: cursos, 
      paginacion: paginacion,
      estadisticas,
      API_BASE, 
      q: q,
      categoria: categoria,
      nivel: nivel,
      precioMin: precioMin,
      precioMax: precioMax,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching cursos for cursos page:', error.message);
    // Valores por defecto si hay error
    const estadisticasDefault = {
      totalCursos: 0,
      totalUsuarios: 0,
      calificacionPromedio: 4.9
    };
    const paginacionDefault = {
      pagina: 1,
      totalPaginas: 1,
      totalElementos: 0,
      elementosPorPagina: 6
    };
    res.render('pages/cursos', { 
      title: 'Cursos', 
      cursos: [], 
      paginacion: paginacionDefault,
      estadisticas: estadisticasDefault,
      API_BASE, 
      q: req.query.q || '',
      categoria: req.query.categoria || '',
      nivel: req.query.nivel || '',
      precioMin: req.query.precioMin || '',
      precioMax: req.query.precioMax || '',
      currentPage: parseInt(req.query.page) || 1
    });
  }
});

// Ruta para mostrar el formulario de crear curso
app.get('/cursos/crear', (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  res.render('pages/crear_curso', { title: 'Crear Curso' });
});

// Ruta para mostrar detalle de un curso específico
app.get('/cursos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await api.get(`/cursos/${id}`, { __req: req });
    const curso = data?.data?.curso || data?.curso || data;
    
    if (!curso) {
      return res.status(404).render('pages/error', { 
        title: 'Curso no encontrado',
        error: 'El curso que buscas no existe o ha sido eliminado.'
      });
    }
    
    res.render('pages/curso_detalle', { 
      title: curso.titulo || 'Detalle del Curso',
      curso,
      API_BASE
    });
  } catch (error) {
    console.error('Error fetching curso detail:', error.message);
    res.status(500).render('pages/error', { 
      title: 'Error',
      error: 'Error interno del servidor al cargar el curso.'
    });
  }
});

// Configurar multer para subida de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

// Ruta proxy para crear cursos
app.post('/api/cursos', upload.single('imagen'), async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    console.log('=== PROXY FRONTEND DEBUG ===');
    console.log('Body recibido:', req.body);
    console.log('Archivo recibido:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file');
    console.log('Auth token:', req.cookies.auth_token ? 'Presente' : 'Ausente');
    
    // Usar form-data para Node.js
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Agregar todos los campos del formulario
    Object.keys(req.body).forEach(key => {
      if (req.body[key]) {
        console.log(`Agregando campo: ${key} = ${req.body[key]}`);
        formData.append(key, req.body[key]);
      }
    });
    
    // Agregar archivo si existe
    if (req.file) {
      console.log('Agregando archivo:', req.file.originalname);
      formData.append('imagen', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    }
    
    console.log('Enviando request al backend...');
    const response = await axios.post(`${API_BASE}/api/cursos`, formData, {
      headers: {
        'X-API-Key': req.cookies.auth_token,
        'rh-api-key': req.cookies.auth_token,
        'Authorization': `Bearer ${req.cookies.auth_token}`,
        ...formData.getHeaders()
      }
    });
    
    const result = response.data;
    console.log('Respuesta del backend:', response.status, result);
    
    res.json(result);
  } catch (error) {
    console.error('Error creating course:', error);
    
    // Si es un error de axios, extraer la respuesta del backend
    if (error.response) {
      console.error('Backend error:', error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Registro
app.get('/registro', (req, res) => {
  if (req.cookies?.auth_token) return res.redirect('/');
  res.render('pages/registro', { title: 'Crear cuenta' });
});
app.post('/registro', async (req, res) => {
  try {
    const { email, nombre, password, confirmPassword, biografia, telefono, captcha_respuesta } = req.body || {};
    
    console.log('Datos de registro recibidos:', { email, nombre, password: '***', confirmPassword: '***', biografia, telefono, captcha_respuesta });
    
    const { data } = await axios.post(`${API_BASE}/api/usuarios`, { 
      email, 
      nombre, 
      password, 
      confirmPassword, 
      biografia, 
      telefono,
      captcha_respuesta
    }, {
      headers: {
        'Cookie': req.headers.cookie || ''
      }
    });
    
    const apiKey = data?.apiKey || data?.data?.apiKey || data?.data?.usuario?.apiKey || data?.usuario?.apiKey;
    
    if (!apiKey) {
      console.log('No se pudo obtener API key de la respuesta:', data);
      return res.status(400).render('pages/registro', { 
        title: 'Crear cuenta', 
        error: 'No se pudo crear la cuenta. Intenta nuevamente.' 
      });
    }
    
    console.log('Usuario registrado exitosamente, API Key obtenida');
    
    // Configurar cookie con opciones mejoradas
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    };
    
    res.cookie('auth_token', apiKey, cookieOptions);
    
    console.log('Cookie de autenticación establecida para usuario registrado');
    
    // Redirigir directamente sin parámetros para evitar problemas
    res.redirect('/');
    
  } catch (err) {
    console.error('Error en registro:', err.response?.data || err.message);
    
    let errorMessage = 'Error en el registro';
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.response?.status === 400 && err.response?.data?.success === false) {
      errorMessage = err.response.data.message || 'Datos inválidos';
    }
    
    res.status(400).render('pages/registro', { 
      title: 'Crear cuenta', 
      error: errorMessage 
    });
  }
});

// Intercambios - Página principal de gestión
app.get('/intercambios', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/intercambios`, { __req: req });
    const exchanges = data?.data?.exchanges || data?.exchanges || data || [];
    res.render('pages/intercambios', { title: 'Intercambios', exchanges, API_BASE });
  } catch (err) {
    console.error('Error cargando intercambios:', err.message);
    res.render('pages/intercambios', { title: 'Intercambios', exchanges: [], API_BASE });
  }
});

// Rutas API proxy para intercambios
app.post('/api/intercambios', async (req, res) => {
  try {
    const response = await api.post('/intercambios', req.body, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error creando intercambio:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.get('/api/intercambios', async (req, res) => {
  try {
    const response = await api.get('/intercambios', { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo intercambios:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.put('/api/intercambios/:id/aceptar', async (req, res) => {
  try {
    const response = await api.put(`/intercambios/${req.params.id}/aceptar`, req.body, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error aceptando intercambio:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.put('/api/intercambios/:id/rechazar', async (req, res) => {
  try {
    const response = await api.put(`/intercambios/${req.params.id}/rechazar`, req.body, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error rechazando intercambio:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.put('/api/intercambios/:id/cancelar', async (req, res) => {
  try {
    const response = await api.put(`/intercambios/${req.params.id}/cancelar`, req.body, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error cancelando intercambio:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

// Rutas proxy para biblioteca
app.get('/api/biblioteca/cursos-propios', async (req, res) => {
  try {
    const response = await api.get('/biblioteca/cursos-propios', { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo cursos propios:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.get('/api/biblioteca/cursos-usuario/:usuarioId', async (req, res) => {
  try {
    const response = await api.get(`/biblioteca/cursos-usuario/${req.params.usuarioId}`, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo cursos de usuario:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.get('/api/biblioteca/cursos-intercambio', async (req, res) => {
  try {
    const response = await api.get('/biblioteca/cursos-intercambio', { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo cursos por intercambio:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.get('/api/biblioteca/cursos-comprados', async (req, res) => {
  try {
    const response = await api.get('/biblioteca/cursos-comprados', { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo cursos comprados:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.get('/api/biblioteca/favoritos', async (req, res) => {
  try {
    const response = await api.get('/biblioteca/favoritos', { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo favoritos:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.post('/api/biblioteca/favoritos/:cursoId', async (req, res) => {
  try {
    const response = await api.post(`/biblioteca/favoritos/${req.params.cursoId}`, {}, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error agregando favorito:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.delete('/api/biblioteca/favoritos/:cursoId', async (req, res) => {
  try {
    const response = await api.delete(`/biblioteca/favoritos/${req.params.cursoId}`, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error removiendo favorito:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.get('/api/usuarios/buscar', async (req, res) => {
  try {
    const response = await api.get(`/usuarios/buscar?q=${encodeURIComponent(req.query.q)}`, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error buscando usuarios:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const response = await api.get('/usuarios', { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

app.get('/api/biblioteca/verificar-acceso/:cursoId', async (req, res) => {
  try {
    const response = await api.get(`/biblioteca/verificar-acceso/${req.params.cursoId}`, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error verificando acceso a curso:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Error interno del servidor'
    });
  }
});

// Ventas Overview
app.get('/ventas', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/ventas`, { __req: req });
    const ventas = data?.data?.ventas || data?.ventas || data || [];
    const total = Array.isArray(ventas) ? ventas.reduce((s,v)=>s+(Number(v?.monto||v?.precio||0)),0) : 0;
    const promedio = Array.isArray(ventas) && ventas.length ? total/ventas.length : 0;
    res.render('pages/ventas', { title: 'Ventas', ventas, summary: { total, promedio } });
  } catch (err) {
    res.render('pages/ventas', { title: 'Ventas', ventas: [], summary: { total: 0, promedio: 0 } });
  }
});

// Notificaciones
app.get('/notificaciones', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/notificaciones`, { __req: req });
    const items = data?.data?.notificaciones || data?.notificaciones || data || [];
    res.render('pages/notificaciones', { title: 'Notificaciones', items });
  } catch (err) {
    res.render('pages/notificaciones', { title: 'Notificaciones', items: [] });
  }
});
app.post('/notificaciones/leer-todas', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try { await api.patch(`/notificaciones/leer-todas`, {}, { __req: req }); } catch (_) {}
  res.redirect('/notificaciones');
});
app.post('/notificaciones/:id/leida', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try { await api.patch(`/notificaciones/${req.params.id}/leida`, {}, { __req: req }); } catch (_) {}
  res.redirect('/notificaciones');
});
app.post('/notificaciones/:id/eliminar', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try { await api.delete(`/notificaciones/${req.params.id}`, { __req: req }); } catch (_) {}
  res.redirect('/notificaciones');
});
app.get('/ventas/historial', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/ventas/historial`, { __req: req });
    const ventas = data?.data?.ventas || data?.ventas || data || [];
    res.render('pages/ventas_historial', { title: 'Historial de compras', ventas, API_BASE });
  } catch (err) {
    res.render('pages/ventas_historial', { title: 'Historial de compras', ventas: [], API_BASE });
  }
});

app.get('/curso/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data } = await api.get(`/cursos/${id}`, { __req: req });
    const curso = data?.data?.curso || data?.curso || data || null;
    if (!curso) return res.status(404).send('Curso no encontrado');
    res.render('pages/curso_detalle', { title: curso.titulo || 'Curso detalle', curso, API_BASE });
  } catch (err) {
    console.error('Error fetching curso detalle:', err.message);
    res.status(500).send('Error cargando el curso');
  }
});
// Editar curso (GET/POST) y eliminar
app.get('/curso/:id/editar', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  const { id } = req.params;
  try {
    const { data } = await api.get(`/cursos/${id}`, { __req: req });
    const curso = data?.data?.curso || data?.curso || data || null;
    res.render('pages/editar_curso', { title: 'Editar curso', curso });
  } catch (err) {
    res.redirect(`/curso/${id}`);
  }
});
app.post('/curso/:id/editar', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  const { id } = req.params;
  try {
    const { titulo, descripcion, categoria, precio, nivel, visibilidad, etiquetas, videoIntroductorio } = req.body || {};
    await api.put(`/cursos/${id}`, {
      titulo,
      descripcion,
      categoria: (categoria||'').split(',').map(s=>s.trim()).filter(Boolean),
      precio: Number(precio||0),
      nivel,
      visibilidad,
      etiquetas: (etiquetas||'').split(',').map(s=>s.trim()).filter(Boolean),
      videoIntroductorio
    }, { __req: req });
    if (precio !== undefined) {
      await api.patch(`/cursos/${id}/precio`, { precio: Number(precio||0) }, { __req: req }).catch(()=>{});
    }
  } catch (err) { /* ignore */ }
  res.redirect(`/curso/${id}`);
});
app.post('/curso/:id/eliminar', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  const { id } = req.params;
  try { await api.delete(`/cursos/${id}`, { __req: req }); } catch (_) {}
  res.redirect('/cursos');
});

// Rutas proxy para biblioteca
app.put('/api/biblioteca/cursos/:cursoId', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    const { data } = await api.put(`/biblioteca/cursos/${req.params.cursoId}`, req.body, { __req: req });
    res.json(data);
  } catch (error) {
    console.error('Error editando curso desde biblioteca:', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Error interno del servidor';
    res.status(status).json({ error: message });
  }
});

app.delete('/api/biblioteca/cursos/:cursoId', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    const { data } = await api.delete(`/biblioteca/cursos/${req.params.cursoId}`, { __req: req });
    res.json(data);
  } catch (error) {
    console.error('Error eliminando curso desde biblioteca:', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Error interno del servidor';
    res.status(status).json({ error: message });
  }
});

app.get('/crear-curso', (req, res) => res.render('pages/crear_curso', { title: 'Crear curso' }));

// Admin routes (old - commented out, replaced by new admin panel below)
/*
app.get('/admin', async (req, res) => {
  // Old admin route - replaced by new admin panel
});
app.get('/admin/config', (req, res) => res.render('pages/config_admin', { title: 'Configuración' }));
app.get('/admin/cursos', (req, res) => res.render('pages/gestion_cursos_admin', { title: 'Gestión de cursos' }));
app.get('/admin/intercambios', (req, res) => res.render('pages/gestion_intercambios_admin', { title: 'Gestión de intercambios' }));
app.get('/admin/usuarios', (req, res) => res.render('pages/gestion_usuarios_admin', { title: 'Gestión de usuarios' }));
*/

// Auth: Login/Logout
app.get('/login', (req, res) => {
  if (req.cookies?.auth_token) return res.redirect('/');
  res.render('pages/login', { title: 'Iniciar sesión' });
});

app.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe, captcha_respuesta } = req.body || {};
    const { data } = await axios.post(`${API_BASE}/api/usuarios/login`, { 
      email, 
      password, 
      captcha_respuesta 
    }, {
      headers: {
        'Cookie': req.headers.cookie || ''
      }
    });
    const apiKey = data?.apiKey || data?.data?.apiKey || data?.data?.usuario?.apiKey || data?.usuario?.apiKey;
    if (!apiKey) return res.status(401).render('pages/login', { title: 'Iniciar sesión', error: 'Credenciales inválidas' });
    
    // Configurar cookie basada en "Recordarme"
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    
    // Si "Recordarme" está marcado, la cookie dura 30 días, sino es sesión
    if (rememberMe === 'on') {
      cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
      console.log('Login con "Recordarme" activado - cookie persistente por 30 días');
    } else {
      // Sin maxAge = cookie de sesión (se elimina al cerrar navegador)
      console.log('Login sin "Recordarme" - cookie de sesión');
    }
    
    res.cookie('auth_token', apiKey, cookieOptions);
    
    console.log('Cookie de autenticación establecida para login:', {
      rememberMe: rememberMe === 'on' ? 'Sí' : 'No',
      cookieDuration: rememberMe === 'on' ? '30 días' : 'sesión',
      apiKeyLength: apiKey ? apiKey.length : 0
    });
    
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(401).render('pages/login', { title: 'Iniciar sesión', error: 'Credenciales inválidas' });
  }
});

app.post('/logout', async (req, res) => {
  try {
    const key = req.cookies?.auth_token;
    if (key) {
      await axios.post(`${API_BASE}/api/auth/logout`, {}, {
        headers: {
          'X-API-Key': key,
          'Authorization': `Bearer ${key}`
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Logout error:', err.message);
  }
  
  res.clearCookie('auth_token');
  res.redirect('/');
});

// Carrito y checkout
app.get('/carrito', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/ventas/carrito`, { __req: req });
    const items = data?.data?.items || data?.items || data || [];
    res.render('pages/carrito', { title: 'Carrito', items });
  } catch (err) {
    res.render('pages/carrito', { title: 'Carrito', items: [] });
  }
});

// Mis cursos
app.get('/mis-cursos', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/biblioteca/cursos-propios`, { __req: req });
    const cursos = data?.cursos || data?.data || data || [];
    res.render('pages/mis_cursos', { title: 'Mis cursos', cursos });
  } catch (err) {
    res.render('pages/mis_cursos', { title: 'Mis cursos', cursos: [] });
  }
});

// Biblioteca
app.get('/biblioteca', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  res.render('pages/biblioteca', { title: 'Mi Biblioteca' });
});

// Ruta proxy para perfil de usuario
app.get('/api/usuarios/perfil', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const { data } = await api.get('/usuarios/perfil', { __req: req });
    res.json(data);
  } catch (error) {
    console.error('Error en proxy /api/usuarios/perfil:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Error interno del servidor'
    });
  }
});

// Ruta proxy para CAPTCHA
app.get('/api/captcha', async (req, res) => {
  try {
    console.log('=== PROXY CAPTCHA ===');
    console.log('Frontend session ID:', req.sessionID);
    console.log('Cookies enviadas al backend:', req.headers.cookie);
    
    const response = await axios.get(`${API_BASE}/api/captcha`, {
      headers: {
        'Cookie': req.headers.cookie || '',
        'User-Agent': req.headers['user-agent'] || 'SkillTrade-Frontend'
      },
      withCredentials: true
    });
    
    console.log('Respuesta del backend CAPTCHA:', response.data);
    
    // Reenviar cookies del backend al frontend si las hay
    if (response.headers['set-cookie']) {
      response.headers['set-cookie'].forEach(cookie => {
        res.append('Set-Cookie', cookie);
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error en proxy /api/captcha:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Error al generar CAPTCHA'
    });
  }
});

// Rutas proxy para API del carrito
app.post('/api/ventas/carrito/agregar', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const response = await api.post(`/ventas/carrito/agregar`, req.body, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error agregando al carrito:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

app.get('/api/ventas/carrito', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const response = await api.get(`/ventas/carrito`, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo carrito:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

app.post('/api/ventas/carrito/remover', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const response = await api.post(`/ventas/carrito/remover`, req.body, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error removiendo del carrito:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Ruta para agregar curso al carrito desde formularios HTML
app.post('/carrito', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.redirect('/login');
  }
  
  try {
    const { cursoId } = req.body;
    await api.post(`/ventas/carrito/agregar`, { cursoId }, { __req: req });
    res.redirect('/carrito');
  } catch (error) {
    console.error('Error agregando al carrito desde formulario:', error.message);
    // En caso de error, redirigir de vuelta al curso
    const cursoId = req.body?.cursoId;
    if (cursoId) {
      res.redirect(`/curso/${cursoId}`);
    } else {
      res.redirect('/cursos');
    }
  }
});

app.post('/carrito/pagar', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try { await api.post(`/ventas/carrito/pagar`, {}, { __req: req }); } catch (_) {}
  res.redirect('/ventas');
});

// Ruta proxy para historial de compras
app.get('/api/ventas/historial/compras', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const response = await api.get(`/ventas/historial/compras`, { 
      __req: req,
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo historial de compras:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// ===== RUTAS DE MERCADOPAGO =====

// Crear preferencia de pago
app.post('/api/mercadopago/crear-preferencia', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const response = await api.post(`/mercadopago/crear-preferencia`, req.body, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error creando preferencia MercadoPago:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Obtener estado del pago
app.get('/api/mercadopago/pago/:paymentId', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const { paymentId } = req.params;
    const response = await api.get(`/mercadopago/pago/${paymentId}`, { __req: req });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo estado del pago:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// Páginas de resultado de pago
app.get('/pago/exito', (req, res) => {
  const { payment_id } = req.query;
  res.render('pages/pago_exito', { 
    title: 'Pago Exitoso', 
    payment_id 
  });
});

app.get('/pago/fallo', (req, res) => {
  res.render('pages/pago_fallo', { 
    title: 'Pago Fallido' 
  });
});

app.get('/pago/pendiente', (req, res) => {
  const { payment_id } = req.query;
  res.render('pages/pago_pendiente', { 
    title: 'Pago Pendiente', 
    payment_id 
  });
});

// Perfil: ver
app.get('/perfil', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/usuarios/perfil`, { __req: req });
    const usuario = data?.data?.usuario || data?.usuario || data || null;
    res.render('pages/perfil', { title: 'Mi perfil', usuario, esPropio: true });
  } catch (err) {
    res.render('pages/perfil', { title: 'Mi perfil', usuario: null, esPropio: true });
  }
});

// Perfil: ver perfil de otro usuario
app.get('/usuario/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data } = await api.get(`/usuarios/${id}`, { __req: req });
    const usuario = data?.data?.usuario || data?.usuario || data || null;
    
    if (!usuario) {
      return res.status(404).render('pages/error', { 
        title: 'Usuario no encontrado', 
        error: 'El usuario que buscas no existe' 
      });
    }
    
    res.render('pages/perfil', { 
      title: `Perfil de ${usuario.nombre}`, 
      usuario, 
      esPropio: false 
    });
  } catch (err) {
    console.error('Error al obtener perfil de usuario:', err.response?.status, err.message);
    
    if (err.response?.status === 403) {
      // Perfil privado
      res.render('pages/perfil_privado', { 
        title: 'Perfil Privado',
        usuarioId: id
      });
    } else if (err.response?.status === 404) {
      res.status(404).render('pages/error', { 
        title: 'Usuario no encontrado', 
        error: 'El usuario que buscas no existe' 
      });
    } else {
      res.status(500).render('pages/error', { 
        title: 'Error del servidor', 
        error: 'Error interno del servidor' 
      });
    }
  }
});

// Perfil: editar (GET/POST)
app.get('/perfil/editar', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/usuarios/perfil`, { __req: req });
    const usuario = data?.data?.usuario || data?.usuario || data || null;
    res.render('pages/editar_perfil', { title: 'Editar perfil', usuario });
  } catch (err) {
    res.redirect('/perfil');
  }
});
app.post('/perfil/editar', async (req, res) => {
  if (!req.cookies?.auth_token) {
    console.log('No hay token de autenticación, redirigiendo a login');
    return res.redirect('/login');
  }
  
  try {
    console.log('=== EDITANDO PERFIL ===');
    console.log('Token presente:', !!req.cookies?.auth_token);
    console.log('Datos recibidos del formulario:', req.body);
    
    const { nombre, biografia, telefono, notificaciones_email, notificaciones_cursos, visibilidad } = req.body || {};
    const datosActualizar = { 
      nombre, 
      biografia, 
      telefono,
      visibilidad,
      notificaciones_email: notificaciones_email === 'on',
      notificaciones_cursos: notificaciones_cursos === 'on'
    };
    
    console.log('Datos a enviar al backend:', datosActualizar);
    console.log('URL completa:', `${API_BASE}/api/usuarios/perfil`);
    
    // Hacer la petición PUT - usar ruta sin ID ya que el backend usa el usuario autenticado
    console.log('Enviando petición PUT...');
    const response = await api.put(`/usuarios/perfil`, datosActualizar, { __req: req });
    
    console.log('Respuesta exitosa del backend:', response.data);
    console.log('Status code:', response.status);
    
    // Verificar si es administrador para redirigir al panel admin
    const esAdmin = res.locals.user?.email === 'skilltrade_admin@gmail.com';
    
    if (esAdmin) {
      // Si es admin, redirigir al panel de usuarios admin
      res.redirect('/admin_usuarios?mensaje=Usuario actualizado exitosamente');
    } else {
      // Si es usuario normal, redirigir a su perfil
      res.redirect('/perfil?success=perfil_actualizado');
    }
  } catch (err) {
    console.error('ERROR al editar perfil:');
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    
    res.redirect('/perfil?error=error_actualizacion');
  }
});

// Perfil: cambiar contraseña (formulario HTML)
app.post('/perfil/password', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { actual, nueva } = req.body || {};
    if (!actual || !nueva) return res.redirect('/perfil');
    await api.post(`/usuarios/password`, { actual, nueva }, { __req: req });
    res.redirect('/perfil');
  } catch (err) {
    res.redirect('/perfil');
  }
});

// API Proxy: cambiar contraseña (para AJAX)
app.post('/api/usuarios/password', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { actual, nueva } = req.body || {};
    console.log('Frontend proxy - Cambiar password:', { actual: !!actual, nueva: !!nueva });

    const response = await axios.post(`${API_BASE}/api/usuarios/password`, {
      actual,
      nueva
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error en proxy cambiar password:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Error interno del servidor'
    });
  }
});

// Perfil: eliminar cuenta
app.post('/perfil/eliminar', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/usuarios/perfil`, { __req: req });
    const id = (data?.data?.usuario?._id) || (data?.usuario?._id);
    if (id) await api.delete(`/usuarios/${id}`, { __req: req });
  } catch (_) {}
  res.clearCookie('auth_token');
  res.redirect('/');
});

// ===== RUTAS DEL PANEL DE ADMINISTRADOR =====
// Verificar si el usuario es administrador
const verificarAdminFrontend = (req, res, next) => {
  if (!res.locals.signedIn || !res.locals.user) {
    return res.redirect('/login');
  }
  
  if (res.locals.user.email !== 'skilltrade_admin@gmail.com') {
    return res.status(403).render('pages/error', { 
      title: 'Acceso Denegado',
      mensaje: 'No tienes permisos para acceder al panel de administrador',
      codigo: 403
    });
  }
  
  next();
};

// Perfil: ver perfil de usuario desde admin (solo para administradores)
app.get('/perfil/:id', verificarAdminFrontend, async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`Admin viendo perfil de usuario: ${id}`);
    const { data } = await api.get(`/usuarios/${id}`, { __req: req });
    const usuario = data?.data?.usuario || data?.usuario || data || null;
    
    if (!usuario) {
      return res.status(404).render('pages/error', { 
        title: 'Usuario no encontrado', 
        error: 'El usuario que buscas no existe' 
      });
    }
    
    console.log(`Perfil obtenido para usuario: ${usuario.nombre} (${usuario.email})`);
    
    // Renderizar vista específica para admin
    res.render('pages/admin_ver_usuario', { 
      title: `Perfil de ${usuario.nombre}`, 
      usuario,
      esAdmin: true
    });
  } catch (err) {
    console.error('Error al obtener perfil de usuario desde admin:', err.response?.status, err.message);
    
    if (err.response?.status === 404) {
      res.status(404).render('pages/error', { 
        title: 'Usuario no encontrado', 
        error: 'El usuario que buscas no existe' 
      });
    } else {
      res.status(500).render('pages/error', { 
        title: 'Error del servidor', 
        error: 'Error interno del servidor' 
      });
    }
  }
});

// Panel de administrador principal
app.get('/admin', verificarAdminFrontend, async (req, res) => {
  try {
    console.log('=== ACCESO AL PANEL ADMIN ===');
    console.log('Usuario autenticado:', res.locals.signedIn);
    console.log('Email del usuario:', res.locals.user?.email);
    console.log('Token disponible:', !!res.locals.token);
    console.log('Token value:', res.locals.token);
    
    console.log('Haciendo petición a /admin/estadisticas...');
    const { data } = await api.get('/admin/estadisticas', { __req: req });
    console.log('Respuesta del backend:', data);
    
    const estadisticas = data?.estadisticas || {};
    console.log('Estadísticas procesadas:', estadisticas);
    
    res.render('pages/admin_panel', {
      title: 'Panel de Administrador',
      estadisticas
    });
  } catch (error) {
    console.error('Error al cargar panel admin:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error completo:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      mensaje: 'Error al cargar el panel de administrador: ' + error.message,
      codigo: 500
    });
  }
});

// Panel de cursos (admin)
app.get('/admin_cursos', verificarAdminFrontend, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const { data } = await api.get(`/admin/cursos?page=${page}`, { __req: req });
    
    res.render('pages/admin_cursos', {
      title: 'Gestión de Cursos - Admin',
      cursos: data?.cursos || [],
      paginacion: data?.paginacion || {}
    });
  } catch (error) {
    console.error('Error al cargar cursos admin:', error.message);
    res.status(500).render('pages/error', {
      title: 'Error',
      mensaje: 'Error al cargar los cursos',
      codigo: 500
    });
  }
});

// Panel de usuarios (admin)
app.get('/admin_usuarios', verificarAdminFrontend, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const { data } = await api.get(`/admin/usuarios?page=${page}`, { __req: req });
    
    res.render('pages/admin_usuarios', {
      title: 'Gestión de Usuarios - Admin',
      usuarios: data?.usuarios || [],
      paginacion: data?.paginacion || {}
    });
  } catch (error) {
    console.error('Error al cargar usuarios admin:', error.message);
    res.status(500).render('pages/error', {
      title: 'Error',
      mensaje: 'Error al cargar los usuarios',
      codigo: 500
    });
  }
});

// Panel de ventas (admin)
app.get('/admin_ventas', verificarAdminFrontend, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const { data } = await api.get(`/admin/ventas?page=${page}`, { __req: req });
    
    res.render('pages/admin_ventas', {
      title: 'Gestión de Ventas - Admin',
      ventas: data?.ventas || [],
      paginacion: data?.paginacion || {}
    });
  } catch (error) {
    console.error('Error al cargar ventas admin:', error.message);
    res.status(500).render('pages/error', {
      title: 'Error',
      mensaje: 'Error al cargar las ventas',
      codigo: 500
    });
  }
});

// Panel de intercambios (admin)
app.get('/admin_intercambios', verificarAdminFrontend, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const { data } = await api.get(`/admin/intercambios?page=${page}`, { __req: req });
    
    res.render('pages/admin_intercambios', {
      title: 'Gestión de Intercambios - Admin',
      intercambios: data?.intercambios || [],
      paginacion: data?.paginacion || {}
    });
  } catch (error) {
    console.error('Error al cargar intercambios admin:', error.message);
    res.status(500).render('pages/error', {
      title: 'Error',
      mensaje: 'Error al cargar los intercambios',
      codigo: 500
    });
  }
});

// ===== RUTAS PROXY PARA OPERACIONES ADMIN =====

// Eliminar curso desde panel admin
app.delete('/api/admin/cursos/:id', verificarAdminFrontend, async (req, res) => {
  try {
    console.log('=== ELIMINANDO CURSO DESDE ADMIN ===');
    console.log('Curso ID:', req.params.id);
    console.log('Token disponible:', !!req.cookies?.auth_token);
    
    const { data } = await api.delete(`/admin/cursos/${req.params.id}`, { __req: req });
    console.log('Respuesta del backend:', data);
    
    res.json(data);
  } catch (error) {
    console.error('Error al eliminar curso:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Error interno del servidor'
    });
  }
});

// Eliminar usuario desde panel admin
app.delete('/api/admin/usuarios/:id', verificarAdminFrontend, async (req, res) => {
  try {
    console.log('=== ELIMINANDO USUARIO DESDE ADMIN ===');
    console.log('Usuario ID:', req.params.id);
    console.log('Token disponible:', !!req.cookies?.auth_token);
    
    const { data } = await api.delete(`/admin/usuarios/${req.params.id}`, { __req: req });
    console.log('Respuesta del backend:', data);
    
    res.json(data);
  } catch (error) {
    console.error('Error al eliminar usuario:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Error interno del servidor'
    });
  }
});

// Editar usuario desde panel admin (GET - mostrar formulario)
app.get('/admin/usuario/:id/editar', verificarAdminFrontend, async (req, res) => {
  try {
    console.log('=== CARGANDO FORMULARIO EDITAR USUARIO ADMIN ===');
    console.log('Usuario ID:', req.params.id);
    
    const { data } = await api.get(`/usuarios/${req.params.id}`, { __req: req });
    const usuario = data?.data?.usuario || data?.usuario || data;
    
    if (!usuario) {
      return res.status(404).render('pages/error', {
        title: 'Usuario no encontrado',
        mensaje: 'El usuario que intentas editar no existe',
        codigo: 404
      });
    }
    
    res.render('pages/admin_editar_usuario', {
      title: `Editar Usuario: ${usuario.nombre}`,
      usuario
    });
  } catch (error) {
    console.error('Error al cargar usuario para editar:', error.response?.data || error.message);
    res.status(500).render('pages/error', {
      title: 'Error',
      mensaje: 'Error al cargar los datos del usuario',
      codigo: 500
    });
  }
});

// Editar usuario desde panel admin (POST - procesar formulario)
app.post('/admin/usuario/:id/editar', verificarAdminFrontend, async (req, res) => {
  try {
    console.log('=== ACTUALIZANDO USUARIO DESDE ADMIN ===');
    console.log('Usuario ID:', req.params.id);
    console.log('Datos del formulario:', req.body);
    
    const { data } = await api.put(`/usuarios/${req.params.id}`, req.body, { __req: req });
    console.log('Usuario actualizado exitosamente:', data);
    
    res.redirect('/admin_usuarios?mensaje=Usuario actualizado exitosamente');
  } catch (error) {
    console.error('Error al actualizar usuario:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || 'Error al actualizar el usuario';
    res.redirect(`/admin/usuario/${req.params.id}/editar?error=${encodeURIComponent(errorMsg)}`);
  }
});

// Healthcheck del front
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'frontend', apiBase: API_BASE });
});

// 404
app.use((req, res) => res.status(404).send('Not Found'));

app.listen(PORT, () => {
  console.log(`Frontend server listening on http://localhost:${PORT}`);
  console.log(`Using API base: ${API_BASE}`);
});
