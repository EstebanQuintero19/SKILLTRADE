const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

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

// Middleware para inyectar signedIn
app.use((req, res, next) => {
  res.locals.signedIn = Boolean(req.cookies?.auth_token);
  next();
});

// Rutas de páginas
app.get('/', async (req, res) => {
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
    const { data } = await api.get(`/cursos`, { __req: req });
    const cursos = data?.data?.cursos || data?.cursos || data || [];
    res.render('pages/cursos', { title: 'Cursos', cursos, API_BASE });
  } catch (err) {
    console.error('Error fetching cursos:', err.message);
    res.render('pages/cursos', { title: 'Cursos', cursos: [], API_BASE });
  }
});

// Registro
app.get('/registro', (req, res) => {
  if (req.cookies?.auth_token) return res.redirect('/');
  res.render('pages/registro', { title: 'Crear cuenta' });
});
app.post('/registro', async (req, res) => {
  try {
    const { email, nombre, password, biografia, telefono } = req.body || {};
    const { data } = await axios.post(`${API_BASE}/api/usuarios`, { email, nombre, password, biografia, telefono });
    const apiKey = data?.apiKey || data?.data?.apiKey || data?.data?.usuario?.apiKey || data?.usuario?.apiKey;
    if (!apiKey) return res.status(400).render('pages/registro', { title: 'Crear cuenta', error: 'No se pudo crear la cuenta' });
    res.cookie('auth_token', apiKey, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 86400000 });
    res.redirect('/');
  } catch (err) {
    res.status(400).render('pages/registro', { title: 'Crear cuenta', error: 'Error en el registro' });
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
    const { email, password } = req.body || {};
    const { data } = await axios.post(`${API_BASE}/api/usuarios/login`, { email, password });
    const apiKey = data?.apiKey || data?.data?.apiKey || data?.data?.usuario?.apiKey || data?.usuario?.apiKey;
    if (!apiKey) return res.status(401).render('pages/login', { title: 'Iniciar sesión', error: 'Credenciales inválidas' });
    // Set cookie segura
    res.cookie('auth_token', apiKey, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
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
