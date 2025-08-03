require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la API
const API_BASE_URL = process.env.API_URL || 'http://localhost:9090/api/v0';

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
            title: 'SKILLTRADE - Inicio',
            cursos: cursos.slice(0, 6),
            totalUsuarios: usuarios.length,
            totalCursos: cursos.length
        });
    } catch (error) {
        console.error('Error al cargar la página principal:', error);
        res.render('index', {
            title: 'SKILLTRADE - Inicio',
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
            title: 'SKILLTRADE - Cursos',
            cursos: cursos,
            categoria: categoria || 'todos',
            search: search || ''
        });
    } catch (error) {
        console.error('Error al cargar cursos:', error);
        res.render('cursos', {
            title: 'SKILLTRADE - Cursos',
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
            title: `SKILLTRADE - ${response.data.titulo}`,
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
            title: 'SKILLTRADE - Intercambios',
            exchanges: response.data
        });
    } catch (error) {
        console.error('Error al cargar intercambios:', error);
        res.render('intercambios', {
            title: 'SKILLTRADE - Intercambios',
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
            title: 'SKILLTRADE - Panel de Administración',
            usuarios,
            cursos,
            exchanges
        });
    } catch (error) {
        console.error('Error al cargar panel admin:', error);
        res.render('admin', {
            title: 'SKILLTRADE - Panel de Administración',
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
            title: `SKILLTRADE - Comprar ${response.data.titulo}`,
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
            title: 'SKILLTRADE - Mis Cursos',
            cursos: response.data
        });
    } catch (error) {
        console.error('Error al cargar mis cursos:', error);
        res.render('mis-cursos', {
            title: 'SKILLTRADE - Mis Cursos',
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