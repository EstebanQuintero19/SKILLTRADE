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
  
  console.log(`Middleware auth - Ruta: ${req.path}, Token presente: ${hasToken}`);
  
  // Si hay token, intentar obtener datos del usuario (evitar rutas de auth y assets)
  if (hasToken && !req.path.includes('/login') && !req.path.includes('/registro') && !req.path.includes('/static')) {
    try {
      const { data } = await api.get('/usuarios/perfil', { __req: req });
      res.locals.user = data?.data?.usuario || data?.usuario || null;
      console.log(`Usuario autenticado: ${res.locals.user?.nombre || 'Sin nombre'}`);
    } catch (error) {
      console.log('Error validando token en middleware:', error.response?.status, error.message);
      // Solo limpiar cookie si es un error 401 (token inválido) y no estamos en rutas críticas
      if (error.response?.status === 401 && !req.path.includes('/logout')) {
        console.log('Token inválido detectado, limpiando cookie');
        res.clearCookie('auth_token');
        res.locals.signedIn = false;
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
    const { data } = await api.get(`/cursos`, { __req: req });
    const cursos = data?.data?.cursos || data?.cursos || data || [];
    res.render('pages/index', { title: 'Home', cursos, API_BASE });
  } catch (err) {
    console.error('Error fetching cursos for home:', err.message);
    res.render('pages/index', { title: 'Home', cursos: [], API_BASE });
  }
});

app.get('/home', (req, res) => res.render('pages/home', { title: 'Home usuario', API_BASE }));
app.get('/biblioteca', async (req, res) => {
  if (!req.cookies?.auth_token) {
    return res.render('pages/biblioteca', { title: 'Biblioteca', API_BASE, needAuth: true, cursosProgreso: [], cursosCompletados: [] });
  }
  try {
    const { data } = await api.get(`/biblioteca`, { __req: req });
    const biblioteca = data?.data || data || {};
    // Normalización básica
    const cursos = biblioteca.cursos || [];
    const cursosProgreso = cursos.filter(c => c.estado === 'en_progreso' || c.estado === 'activo');
    const cursosCompletados = cursos.filter(c => c.estado === 'completado');
    res.render('pages/biblioteca', { title: 'Biblioteca', API_BASE, needAuth: false, cursosProgreso, cursosCompletados });
  } catch (err) {
    console.error('Error fetching biblioteca:', err.message);
    res.render('pages/biblioteca', { title: 'Biblioteca', API_BASE, needAuth: true, cursosProgreso: [], cursosCompletados: [] });
  }
});

app.get('/cursos', async (req, res) => {
  try {
    const q = req.query.q || ''; // Obtener el parámetro de búsqueda
    const { data } = await api.get(`/cursos`, { __req: req });
    
    // Normalizar la respuesta para asegurar que cursos sea un array
    console.log('Respuesta del backend cursos:', data);
    let cursos = [];
    if (Array.isArray(data)) {
      cursos = data;
    } else if (data && Array.isArray(data.cursos)) {
      cursos = data.cursos;
    } else if (data && Array.isArray(data.data)) {
      cursos = data.data;
    } else if (data && data.data && Array.isArray(data.data.cursos)) {
      cursos = data.data.cursos;
    }
    
    console.log('Cursos normalizados:', cursos.length, 'cursos encontrados');
    
    res.render('pages/cursos', { title: 'Cursos', cursos: cursos, API_BASE, q: q });
  } catch (error) {
    console.error('Error fetching cursos for cursos page:', error.message);
    res.render('pages/cursos', { title: 'Cursos', cursos: [], API_BASE, q: q });
  }
});

// Ruta para mostrar el formulario de crear curso
app.get('/cursos/crear', (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  res.render('pages/crear_curso', { title: 'Crear Curso' });
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
    const { email, nombre, password, confirmPassword, biografia, telefono } = req.body || {};
    
    console.log('Datos de registro recibidos:', { email, nombre, password: '***', confirmPassword: '***', biografia, telefono });
    
    const { data } = await axios.post(`${API_BASE}/api/usuarios`, { 
      email, 
      nombre, 
      password, 
      confirmPassword, 
      biografia, 
      telefono 
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

// Intercambios (tabla estilo mockup)
app.get('/intercambios', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/exchanges`, { __req: req });
    const exchanges = data?.data?.exchanges || data?.exchanges || data || [];
    res.render('pages/intercambios', { title: 'Intercambios', exchanges, API_BASE });
  } catch (err) {
    res.render('pages/intercambios', { title: 'Intercambios', exchanges: [], API_BASE });
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
app.get('/carrito', (req, res) => res.render('pages/carrito', { title: 'Carrito' }));
app.get('/crear-curso', (req, res) => res.render('pages/crear_curso', { title: 'Crear curso' }));

// Admin
app.get('/admin', async (req, res) => {
  try {
    const [usuariosRes, cursosRes, exchangesRes, ventasRes] = await Promise.all([
      api.get(`/usuarios`, { __req: req }).catch(() => ({ data: { data: { usuarios: [] } } })),
      api.get(`/cursos`, { __req: req }).catch(() => ({ data: { data: { cursos: [] } } })),
      api.get(`/exchanges`, { __req: req }).catch(() => ({ data: { data: { exchanges: [] } } })),
      api.get(`/ventas`, { __req: req }).catch(() => ({ data: { data: { ventas: [] } } })),
    ]);

    const usuarios = usuariosRes?.data?.data?.usuarios || usuariosRes?.data?.usuarios || usuariosRes?.data || [];
    const cursos = cursosRes?.data?.data?.cursos || cursosRes?.data?.cursos || cursosRes?.data || [];
    const exchanges = exchangesRes?.data?.data?.exchanges || exchangesRes?.data?.exchanges || exchangesRes?.data || [];
    const ventas = ventasRes?.data?.data?.ventas || ventasRes?.data?.ventas || ventasRes?.data || [];

    const ventasTotal = Array.isArray(ventas)
      ? ventas.reduce((sum, v) => sum + (Number(v?.monto || v?.precio || 0)), 0)
      : 0;

    const stats = {
      usuarios: Array.isArray(usuarios) ? usuarios.length : 0,
      cursos: Array.isArray(cursos) ? cursos.length : 0,
      exchanges: Array.isArray(exchanges) ? exchanges.length : 0,
      ventasTotal
    };

    res.render('pages/dashboard_admin', { title: 'Panel de Administración', stats });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.render('pages/dashboard_admin', { title: 'Panel de Administración', stats: { usuarios: 0, cursos: 0, exchanges: 0, ventasTotal: 0 } });
  }
});
app.get('/admin/config', (req, res) => res.render('pages/config_admin', { title: 'Configuración' }));
app.get('/admin/cursos', (req, res) => res.render('pages/gestion_cursos_admin', { title: 'Gestión de cursos' }));
app.get('/admin/intercambios', (req, res) => res.render('pages/gestion_intercambios_admin', { title: 'Gestión de intercambios' }));
app.get('/admin/usuarios', (req, res) => res.render('pages/gestion_usuarios_admin', { title: 'Gestión de usuarios' }));

// Auth: Login/Logout
app.get('/login', (req, res) => {
  if (req.cookies?.auth_token) return res.redirect('/');
  res.render('pages/login', { title: 'Iniciar sesión' });
});

app.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body || {};
    const { data } = await axios.post(`${API_BASE}/api/usuarios/login`, { email, password });
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
  } catch (_) { /* ignore */ }
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
app.post('/carrito/pagar', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try { await api.post(`/ventas/carrito/pagar`, {}, { __req: req }); } catch (_) {}
  res.redirect('/ventas');
});

// Perfil: ver
app.get('/perfil', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/usuarios/perfil`, { __req: req });
    const usuario = data?.data?.usuario || data?.usuario || data || null;
    res.render('pages/perfil', { title: 'Mi perfil', usuario });
  } catch (err) {
    res.render('pages/perfil', { title: 'Mi perfil', usuario: null });
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
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/usuarios/perfil`, { __req: req });
    const id = (data?.data?.usuario?._id) || (data?.usuario?._id);
    if (!id) return res.redirect('/perfil');
    const { nombre, biografia, telefono } = req.body || {};
    await api.put(`/usuarios/${id}`, { nombre, biografia, telefono }, { __req: req });
    res.redirect('/perfil');
  } catch (err) {
    res.redirect('/perfil');
  }
});

// Perfil: cambiar contraseña
app.post('/perfil/password', async (req, res) => {
  if (!req.cookies?.auth_token) return res.redirect('/login');
  try {
    const { data } = await api.get(`/usuarios/perfil`, { __req: req });
    const id = (data?.data?.usuario?._id) || (data?.usuario?._id);
    const { actual, nueva } = req.body || {};
    if (!id || !nueva) return res.redirect('/perfil');
    await api.post(`/usuarios/${id}/password`, { actual, nueva }, { __req: req });
    res.redirect('/perfil');
  } catch (err) {
    res.redirect('/perfil');
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
