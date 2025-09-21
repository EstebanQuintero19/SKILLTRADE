require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
const expressLayouts = require('express-ejs-layouts');

const app = express();

// Configuración del motor de plantillas EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'skilltrade-secret-key-2024',
    resave: true,
    saveUninitialized: true,
    name: 'skilltrade.sid',
    cookie: {
        secure: false,
        httpOnly: false,
        sameSite: 'lax'
    }
}));

// Variables globales para las vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.token = req.session.token || null;
    res.locals.isAuthenticated = !!req.session.user;
    res.locals.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9090/api';
    
    
    next();
});

// Configuración de axios para el backend
const apiClient = axios.create({
    baseURL: process.env.API_BASE_URL || 'http://localhost:9090/api',
    timeout: 10000
});

// Interceptor para incluir token en las peticiones
apiClient.interceptors.request.use((config) => {
    // Si hay una sesión activa, incluir el token
    if (config.headers && config.headers['x-session-token']) {
        config.headers.Authorization = `Bearer ${config.headers['x-session-token']}`;
    }
    return config;
});

// Middleware de autenticación
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware de administrador
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.rol !== 'admin') {
        return res.status(403).render('error', { 
            title: 'Acceso Denegado',
            message: 'No tienes permisos para acceder a esta página',
            error: { status: 403 }
        });
    }
    next();
};

// ===== RUTAS PRINCIPALES =====

// Página de inicio
app.get('/', async (req, res) => {
    try {
        const [cursosResponse, usuariosResponse] = await Promise.allSettled([
            apiClient.get('/cursos'),
            apiClient.get('/usuarios')
        ]);

        const cursos = cursosResponse.status === 'fulfilled' ? cursosResponse.value.data : [];
        const usuarios = usuariosResponse.status === 'fulfilled' ? usuariosResponse.value.data : [];

        // Asegurar que cursos sea un array
        const cursosArray = Array.isArray(cursos) ? cursos : [];
        const usuariosArray = Array.isArray(usuarios) ? usuarios : [];

        res.render('index', {
            title: 'SkillTrade - Intercambia conocimientos',
            cursos: cursosArray.slice(0, 6), // Mostrar solo los primeros 6 cursos
            totalCursos: cursosArray.length,
            totalUsuarios: usuariosArray.length
        });
    } catch (error) {
        console.error('Error al cargar la página principal:', error.message);
        res.render('index', {
            title: 'SkillTrade - Intercambia conocimientos',
            cursos: [],
            totalCursos: 0,
            totalUsuarios: 0
        });
    }
});

// ===== RUTAS DE AUTENTICACIÓN =====

// Página de login
app.get('/auth/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', { title: 'Iniciar Sesión' });
});

// Procesar login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const response = await apiClient.post('/usuarios/login', { email, password });
        
        // Guardar datos del usuario en la sesión
        req.session.user = response.data.usuario;
        req.session.token = response.data.token;
        
        res.redirect('/dashboard');
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
        res.render('auth/login', { 
            title: 'Iniciar Sesión',
            error: errorMessage 
        });
    }
});

// Página de registro
app.get('/auth/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', { title: 'Crear Cuenta' });
});

// Procesar registro
app.post('/auth/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        const response = await apiClient.post('/usuarios', { nombre, email, password });
        
        // Guardar datos del usuario en la sesión
        req.session.user = response.data.usuario;
        req.session.token = response.data.token;
        
        res.redirect('/dashboard');
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error al crear la cuenta';
        res.render('auth/register', { 
            title: 'Crear Cuenta',
            error: errorMessage 
        });
    }
});

// Cerrar sesión
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/');
    });
});

// ===== RUTAS PROTEGIDAS =====

// Dashboard del usuario
app.get('/dashboard', requireAuth, async (req, res) => {
    try {
        // Obtener cursos del usuario
        const cursosResponse = await apiClient.get(`/cursos/owner/${req.session.user._id}`, {
            headers: { 'x-session-token': req.session.token }
        });
        
        // Obtener intercambios del usuario
        const exchangesResponse = await apiClient.get(`/exchanges/usuario/${req.session.user._id}`, {
            headers: { 'x-session-token': req.session.token }
        });

        res.render('dashboard/index', {
            title: 'Mi Dashboard',
            cursos: cursosResponse.data || [],
            exchanges: exchangesResponse.data || []
        });
    } catch (error) {
        console.error('Error al cargar dashboard:', error.message);
        res.render('dashboard/index', {
            title: 'Mi Dashboard',
            cursos: [],
            exchanges: []
        });
    }
});

// API Login para el frontend (AJAX)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const response = await apiClient.post('/usuarios/login', { email, password });
        
        // Guardar datos del usuario en la sesión
        req.session.user = response.data.data.usuario;
        req.session.token = response.data.data.apiKey || response.data.data.token;
        
        // Forzar guardado de la sesión
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar sesión:', err);
            }
        });
        
        
        res.json({
            success: true,
            data: response.data,
            message: 'Login exitoso'
        });
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
        res.status(400).json({
            success: false,
            error: errorMessage
        });
    }
});

// Logout
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        res.redirect('/');
    });
});

// ===== RUTAS DE CURSOS =====

// Listar todos los cursos
app.get('/cursos', async (req, res) => {
    try {
        const { categoria, buscar } = req.query;
        let url = '/cursos';
        
        if (categoria) {
            url = `/cursos/categoria/${categoria}`;
        }
        
        const response = await apiClient.get(url);
        let cursos = response.data;
        
        // Asegurar que cursos sea un array
        if (!Array.isArray(cursos)) {
            cursos = cursos?.data || cursos?.cursos || [];
        }
        
        // Filtrar por búsqueda si se proporciona
        if (buscar && Array.isArray(cursos)) {
            cursos = cursos.filter(curso => 
                curso.titulo.toLowerCase().includes(buscar.toLowerCase()) ||
                curso.descripcion.toLowerCase().includes(buscar.toLowerCase())
            );
        }
        
        console.log('Renderizando cursos con usuario:', {
            hasUser: !!req.session.user,
            userEmail: req.session.user?.email
        });
        
        res.render('cursos/cursos', {
            title: 'SKILLTRADE - Cursos',
            cursos,
            categoria: categoria || '',
            buscar: buscar || ''
        });
    } catch (error) {
        console.error('Error al cargar cursos:', error.message);
        res.render('cursos/cursos', {
            title: 'SKILLTRADE - Cursos',
            cursos: [],
            categoria: '',
            buscar: ''
        });
    }
});

// Página de mis cursos (requiere autenticación)
app.get('/mis-cursos', requireAuth, async (req, res) => {
    try {
        res.render('cursos/mis-cursos', {
            title: 'Mis Cursos - SkillTrade',
            user: req.session.user
        });
    } catch (error) {
        console.error('Error al cargar mis cursos:', error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error interno del servidor' 
        });
    }
});

// Ver curso específico
app.get('/cursos/:id', async (req, res) => {
    try {
        const response = await apiClient.get(`/cursos/${req.params.id}`);
        res.render('cursos/detalle', {
            title: response.data.titulo,
            curso: response.data
        });
    } catch (error) {
        console.error('Error al cargar curso:', error.message);
        res.status(404).render('error', {
            title: 'Curso no encontrado',
            message: 'El curso que buscas no existe',
            error: { status: 404 }
        });
    }
});

// ===== RUTAS DE INTERCAMBIOS =====

// Listar intercambios
app.get('/intercambios', requireAuth, async (req, res) => {
    try {
        const response = await apiClient.get('/exchanges', {
            headers: { 'x-session-token': req.session.token }
        });
        
        res.render('intercambios/index', {
            title: 'Intercambios',
            exchanges: response.data
        });
    } catch (error) {
        console.error('Error al cargar intercambios:', error.message);
        res.render('intercambios/index', {
            title: 'Intercambios',
            exchanges: []
        });
    }
});

// ===== RUTAS DE ADMINISTRACIÓN =====

// Panel de administración
app.get('/admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const [usuariosRes, cursosRes, exchangesRes] = await Promise.allSettled([
            apiClient.get('/usuarios', { headers: { 'x-session-token': req.session.token } }),
            apiClient.get('/cursos', { headers: { 'x-session-token': req.session.token } }),
            apiClient.get('/exchanges', { headers: { 'x-session-token': req.session.token } })
        ]);

        res.render('admin/index', {
            title: 'Panel de Administración',
            usuarios: usuariosRes.status === 'fulfilled' ? usuariosRes.value.data : [],
            cursos: cursosRes.status === 'fulfilled' ? cursosRes.value.data : [],
            exchanges: exchangesRes.status === 'fulfilled' ? exchangesRes.value.data : []
        });
    } catch (error) {
        console.error('Error al cargar panel admin:', error.message);
        res.render('admin/index', {
            title: 'Panel de Administración',
            usuarios: [],
            cursos: [],
            exchanges: []
        });
    }
});

// ===== MANEJO DE ERRORES =====

// 404 - Página no encontrada
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Página no encontrada',
        message: 'La página que buscas no existe',
        error: { status: 404 }
    });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error del servidor',
        message: 'Algo salió mal en el servidor',
        error: { status: 500 }
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`SkillTrade Frontend ejecutándose en puerto ${PORT}`);
    console.log(`Accede en: http://localhost:${PORT}`);
    console.log(`🔗 API Backend: ${process.env.API_BASE_URL || 'http://localhost:9090/api'}`);
});

module.exports = app;

//antes solo dios y yo sabíamos como funcionaba adecuadamente este código, ahora solo dios lo sabe
