const express = require('express');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Importar configuración y middlewares
const config = require('./config/environment');
const routes = require('./routes');
const logger = require('./services/winston-logger');
const { 
    helmetConfig, 
    corsConfig, 
    generalLimiter, 
    sanitizeInputs,
    securityHeaders 
} = require('./middleware/security');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

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

// ===== MIDDLEWARE DE SEGURIDAD =====
app.use(helmetConfig);
app.use(corsConfig);
app.use(securityHeaders);
app.use(sanitizeInputs);

// ===== MIDDLEWARE GENERAL =====
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== RATE LIMITING =====
app.use(generalLimiter);

// ===== ARCHIVOS ESTÁTICOS =====
app.use('/uploads', express.static(config.UPLOAD_PATH));

// ===== CONEXIÓN A BASE DE DATOS =====
mongoose.connect(config.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0
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
app.use('/api', routes);

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
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ===== SERVIDOR =====
const server = app.listen(config.PORT, () => {
    logger.info('Servidor iniciado', {
        port: config.PORT,
        environment: config.NODE_ENV,
        endpoint: `http://localhost:${config.PORT}/api`
    });
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


