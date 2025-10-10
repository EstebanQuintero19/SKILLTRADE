const express = require('express');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Importar configuración y middlewares
const config = require('./config/environment');
const logger = require('./services/winston-logger');

const app = express();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.UPLOAD_PATH);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: 1 // Solo un archivo por petición
    },
    fileFilter: function (req, file, cb) {
        // Validación más estricta de archivos
        const allowedMimes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/avi'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
        }
    }
});

// ===== CORS BÁSICO =====
const cors = require('cors');
app.use(cors({
    origin: ['http://localhost:4000', 'http://localhost:3001'],
    credentials: true
}));

// ===== MIDDLEWARE GENERAL =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== ARCHIVOS ESTÁTICOS =====
app.use('/uploads', express.static(config.UPLOAD_PATH));

// ===== CONFIGURACIÓN DE MONGOOSE =====
mongoose.set('strictQuery', true);

// ===== CONEXIÓN A BASE DE DATOS =====

mongoose.connect(config.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferCommands: false
}).catch(err => {
    console.error('Error inicial de conexión a MongoDB:', err.message);
    // No cerrar el servidor, solo mostrar el error
});

mongoose.connection.on('connected', () => {
    logger.info('Conectado a MongoDB', {
        environment: config.NODE_ENV,
        database: config.DB_NAME
    });
});

mongoose.connection.on('error', (err) => {
    logger.error('Error de conexión a MongoDB', {
        error: err.message,
        stack: err.stack
    });
});

mongoose.connection.on('disconnected', () => {
    logger.warn('Desconectado de MongoDB');
});

// ===== CONFIGURACIÓN GLOBAL =====
app.locals.upload = upload;

// ===== RUTAS =====
// Cargar controladores necesarios
const usuarioController = require('./controller/usuario.controller');
const cursoController = require('./controller/curso.controller');
const bibliotecaController = require('./controller/biblioteca.controller');
const ventaController = require('./controller/venta.controller');

// Cargar middleware de autenticación
const { autenticarApiKey } = require('./middleware/auth');

// Rutas de usuario
app.post('/api/usuarios', usuarioController.registrarUsuario);
app.post('/api/usuarios/login', usuarioController.loginUsuario);
app.get('/api/estadisticas', usuarioController.obtenerEstadisticasGenerales);

// Rutas de usuario autenticadas
app.get('/api/usuarios/perfil', autenticarApiKey, usuarioController.obtenerPerfil);
app.get('/api/usuarios/:id', autenticarApiKey, usuarioController.obtenerUsuarioPorId);
app.put('/api/usuarios/:id', autenticarApiKey, usuarioController.editarPerfil);
app.put('/api/usuarios/perfil', autenticarApiKey, usuarioController.editarPerfil);
app.post('/api/usuarios/password', autenticarApiKey, usuarioController.cambiarPassword);
app.delete('/api/usuarios/:id', autenticarApiKey, usuarioController.eliminarUsuario);
app.post('/api/auth/logout', autenticarApiKey, usuarioController.cerrarSesion);
app.get('/api/usuarios', autenticarApiKey, usuarioController.obtenerUsuarios);
app.post('/api/usuarios/limpiar-duplicado', usuarioController.limpiarUsuarioDuplicado);

// Rutas de cursos (básicas para el frontend)
app.get('/api/cursos', cursoController.obtenerCursos);
app.get('/api/cursos/:id', cursoController.obtenerCursoPorId);
app.get('/api/cursos/mis-cursos/paginados', autenticarApiKey, cursoController.obtenerMisCursosPaginados);
app.put('/api/cursos/:id', autenticarApiKey, cursoController.actualizarCurso);
app.delete('/api/cursos/:id', autenticarApiKey, cursoController.eliminarCurso);
app.post('/api/cursos', autenticarApiKey, (req, res, next) => {
    const upload = req.app.locals.upload;
    if (upload) {
        upload.single('imagen')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            next();
        });
    } else {
        next();
    }
}, cursoController.crearCurso);

// Rutas de biblioteca
app.put('/api/biblioteca/cursos/:cursoId', autenticarApiKey, bibliotecaController.editarCursoDesdeLibreria);
app.delete('/api/biblioteca/cursos/:cursoId', autenticarApiKey, bibliotecaController.eliminarCursoDesdeLibreria);

// Rutas de ventas y carrito
app.post('/api/ventas', autenticarApiKey, ventaController.crearVenta);
app.get('/api/ventas', autenticarApiKey, ventaController.obtenerVentas);

// Rutas específicas del carrito (DEBEN ir antes de /api/ventas/:id)
app.post('/api/ventas/carrito/agregar', autenticarApiKey, ventaController.agregarAlCarrito);
app.get('/api/ventas/carrito', autenticarApiKey, ventaController.obtenerCarrito);
app.post('/api/ventas/carrito/remover', autenticarApiKey, ventaController.removerDelCarrito);
app.post('/api/ventas/carrito/pagar', autenticarApiKey, ventaController.pagarCarrito);

// Ruta genérica de ventas (DEBE ir después de las rutas específicas)
app.get('/api/ventas/:id', autenticarApiKey, ventaController.obtenerVentaPorId);

app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'SKILLTRADE API v1.0',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            register: 'POST /api/usuarios',
            login: 'POST /api/usuarios/login',
            cursos: 'GET /api/cursos'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'OK', 
        message: 'SKILLTRADE API is running',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV
    });
});

// ===== MANEJO DE ERRORES =====
// Manejadores de error comentados temporalmente

// ===== SERVIDOR =====
const server = app.listen(config.PORT, "0.0.0.0", () => {
    logger.info('Servidor iniciado', {
        port: config.PORT,
        environment: config.NODE_ENV,
        endpoint: `http://localhost:${config.PORT}/api`
    });
});

// Manejo de errores del servidor
server.on('error', (err) => {
    console.error('Error del servidor:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`Puerto ${config.PORT} ya está en uso`);
    }
});

// Evitar que el proceso se cierre por errores no manejados
process.on('uncaughtException', (err) => {
    console.error('❌ Excepción no capturada:', err.message);
    console.error('Stack:', err.stack);
    // No cerrar el proceso, solo loguear el error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    // No cerrar el proceso, solo loguear el error
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    logger.info('SIGTERM recibido, cerrando servidor gracefully');
    server.close(() => {
        logger.info('Servidor cerrado');
        mongoose.connection.close(false, () => {
            logger.info('Conexión a MongoDB cerrada');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT recibido, cerrando servidor gracefully');
    server.close(() => {
        logger.info('Servidor cerrado');
        mongoose.connection.close(false, () => {
            logger.info('Conexión a MongoDB cerrada');
            process.exit(0);
        });
    });
});


