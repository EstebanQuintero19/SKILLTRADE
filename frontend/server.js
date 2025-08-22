require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de express-ejs-layouts
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la API
const API_BASE_URL = process.env.API_URL || 'http://localhost:9090/api/v0';

// Middleware para verificar autenticación en rutas protegidas
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    if (!token) {
        return res.redirect('/login');
    }
    next();
};

// ===== RUTAS DE AUTENTICACIÓN =====
app.get('/login', (req, res) => {
    res.render('login', { layout: false });
});

app.get('/register', (req, res) => {
    res.render('register', { layout: false });
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard', { layout: false });
});

// API Routes para autenticación
app.post('/api/login', async (req, res) => {
    try {
        console.log('Frontend recibió petición de login:', req.body);
        console.log('Enviando petición al backend:', `${API_BASE_URL}/auth/login`);
        
        const response = await axios.post(`${API_BASE_URL}/auth/login`, req.body);
        
        console.log('Respuesta exitosa del backend:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error completo en login frontend:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error message:', error.message);
        
        res.status(error.response?.status || 500).json(
            error.response?.data || { error: 'Error interno del servidor' }
        );
    }
});

app.post('/api/register', async (req, res) => {
    try {
        console.log('Frontend recibió petición de registro:', req.body);
        const response = await axios.post(`${API_BASE_URL}/auth/register`, req.body);
        console.log('Backend respondió exitosamente:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error en registro:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(
            error.response?.data || { error: 'Error de conexión' }
        );
    }
});

// Proxy routes para cursos
app.get('/api/cursos', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/cursos`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cursos' });
    }
});

app.get('/api/cursos/owner/:ownerId', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/cursos/owner/${req.params.ownerId}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cursos del owner' });
    }
});

app.post('/api/cursos', async (req, res) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/cursos`, req.body, {
            headers: { 
                Authorization: req.headers.authorization,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(
            error.response?.data || { error: 'Error al crear curso' }
        );
    }
});

app.put('/api/cursos/:id', async (req, res) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/cursos/${req.params.id}`, req.body, {
            headers: { 
                Authorization: req.headers.authorization,
                'Content-Type': 'application/json'
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(
            error.response?.data || { error: 'Error al actualizar curso' }
        );
    }
});

app.delete('/api/cursos/:id', async (req, res) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/cursos/${req.params.id}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(
            error.response?.data || { error: 'Error al eliminar curso' }
        );
    }
});

// Proxy routes para el backend
app.get('/api/backend/cursos', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/cursos`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cursos' });
    }
});

app.get('/api/backend/usuarios', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/usuarios`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// Rutas principales
app.get('/', async (req, res) => {
    try {
        const [cursosResponse, usuariosResponse] = await Promise.allSettled([
            axios.get(`${API_BASE_URL}/cursos`),
            axios.get(`${API_BASE_URL}/usuarios`)
        ]);

        const cursos = cursosResponse.status === 'fulfilled' ? cursosResponse.value.data : [];
        const usuarios = usuariosResponse.status === 'fulfilled' ? usuariosResponse.value.data : [];

        res.render('index', {
            pageTitle: 'SKILLTRADE',
            cursos: cursos.slice(0, 6),
            totalUsuarios: usuarios.length,
            totalCursos: cursos.length
        });
    } catch (error) {
        console.error('Error al cargar la página principal:', error);
        res.render('index', {
            pageTitle: 'SKILLTRADE',
            cursos: [],
            totalUsuarios: 0,
            totalCursos: 0
        });
    }
});

app.get('/cursos', async (req, res) => {
    try {
        const { categoria, search } = req.query;
        let url = `${API_BASE_URL}/cursos`;
        
        if (categoria && categoria !== 'todos') {
            url = `${API_BASE_URL}/cursos/categoria/${categoria}`;
        }

        const response = await axios.get(url);
        let cursos = response.data;
        
        // Filtro de búsqueda si se proporciona
        if (search) {
            cursos = cursos.filter(curso => 
                curso.titulo.toLowerCase().includes(search.toLowerCase()) ||
                curso.descripcion.toLowerCase().includes(search.toLowerCase())
            );
        }

        res.render('cursos', {
            pageTitle: 'Courses',
            cursos: cursos,
            categoria: categoria || 'todos',
            search: search || ''
        });
    } catch (error) {
        console.error('Error al cargar cursos:', error);
        res.render('cursos', {
            pageTitle: 'Courses',
            cursos: [],
            categoria: req.query.categoria || 'todos',
            search: req.query.search || ''
        });
    }
});

app.get('/curso/:id', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/cursos/${req.params.id}`);
        res.render('curso', {
            pageTitle: 'Course',
            curso: response.data
        });
    } catch (error) {
        console.error('Error al cargar curso:', error);
        res.status(404).render('error', {
            title: 'SKILLTRADE - Curso no encontrado',
            message: 'El curso que buscas no existe'
        });
    }
});

app.get('/intercambios', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/exchanges`);
        res.render('intercambios', {
            pageTitle: 'Trade',
            exchanges: response.data
        });
    } catch (error) {
        console.error('Error al cargar intercambios:', error);
        res.render('intercambios', {
            pageTitle: 'Trade',
            exchanges: []
        });
    }
});

app.get('/admin', async (req, res) => {
    try {
        const [usuariosResponse, cursosResponse, exchangesResponse] = await Promise.allSettled([
            axios.get(`${API_BASE_URL}/usuarios`),
            axios.get(`${API_BASE_URL}/cursos`),
            axios.get(`${API_BASE_URL}/exchanges`)
        ]);

        const usuarios = usuariosResponse.status === 'fulfilled' ? usuariosResponse.value.data : [];
        const cursos = cursosResponse.status === 'fulfilled' ? cursosResponse.value.data : [];
        const exchanges = exchangesResponse.status === 'fulfilled' ? exchangesResponse.value.data : [];

        res.render('admin', {
            pageTitle: 'Admin Panel',
            usuarios,
            cursos,
            exchanges
        });
    } catch (error) {
        console.error('Error al cargar panel admin:', error);
        res.render('admin', {
            pageTitle: 'Admin Panel',
            usuarios: [],
            cursos: [],
            exchanges: []
        });
    }
});

app.get('/comprar/:id', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/cursos/${req.params.id}`);
        res.render('comprar', {
            pageTitle: 'Buy Course',
            curso: response.data
        });
    } catch (error) {
        console.error('Error al cargar página de compra:', error);
        res.status(404).render('error', {
            title: 'SKILLTRADE - Error',
            message: 'No se pudo cargar la información del curso'
        });
    }
});

app.get('/mis-cursos', async (req, res) => {
    try {
        // Por ahora mostrar todos los cursos, después se filtrarán por usuario
        const response = await axios.get(`${API_BASE_URL}/cursos`);
        res.render('mis-cursos', {
            pageTitle: 'My Courses',
            cursos: response.data
        });
    } catch (error) {
        console.error('Error al cargar mis cursos:', error);
        res.render('mis-cursos', {
            pageTitle: 'My Courses',
            cursos: []
        });
    }
});

// Ruta de prueba para verificar estilos
app.get('/test', (req, res) => {
    res.render('test', {
        title: 'SKILLTRADE - Prueba de Estilos'
    });
});

// Ruta de prueba simple
app.get('/test-simple', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'test-simple.ejs'));
});

// Ruta de prueba directa sin layout
app.get('/test-direct', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index-direct.ejs'));
});

// API Routes para el frontend
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Frontend funcionando correctamente' });
});

app.get('/api/backend-status', async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}`);
        res.json({ 
            status: 'OK', 
            backend: 'Conectado',
            message: response.data.message 
        });
    } catch (error) {
        res.json({ 
            status: 'Error', 
            backend: 'Desconectado',
            message: 'No se pudo conectar con el backend' 
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'SKILLTRADE - Error',
        message: 'Algo salió mal'
    });
});

app.use((req, res) => {
    res.status(404).render('error', {
        title: 'SKILLTRADE - Página no encontrada',
        message: 'La página que buscas no existe'
    });
});

app.listen(PORT, () => {
    console.log(`Frontend corriendo en: http://localhost:${PORT}`);
    console.log(`API conectada a: ${API_BASE_URL}`);
}); 