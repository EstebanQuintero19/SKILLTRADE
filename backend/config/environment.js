/**
 * Configuración segura de variables de entorno
 * Valida que todas las variables críticas estén presentes
 */

require('dotenv').config();

// Variables mínimas requeridas para poder arrancar el servidor en desarrollo
// En producción se recomienda definir todas explícitamente
const requiredEnvVars = [
    'NODE_ENV',
    'PORT'
];

// Validar variables críticas
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.warn('⚠️  Variables mínimas faltantes. Se usarán valores por defecto:', missingVars.join(', '));
}

const config = {
    // Servidor
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 3000,
    
    // Base de datos
    // Si hay credenciales de Atlas, úsalas; si no, usa Mongo local por defecto
    MONGODB_URI: (process.env.USER_DB && process.env.PASS_DB && process.env.DB_NAME)
        ? `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@adso2873441.ex6dvxq.mongodb.net/${process.env.DB_NAME}`
        : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skilltrade'),
    
    // Seguridad
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
    API_KEY: process.env.API_KEY || 'dev-api-key',
    
    // CORS
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'],
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    
    // Email (opcional)
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 465,
    EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    ERROR_EMAIL_TO: process.env.ERROR_EMAIL_TO,
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    CONSOLE_LOG_LEVEL: process.env.CONSOLE_LOG_LEVEL || 'info',
    EMAIL_NOTIFICATIONS_ENABLED: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
    
    // Archivos
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
};

// Validaciones adicionales
if (config.NODE_ENV === 'production') {
    if (!config.EMAIL_USER || !config.EMAIL_PASS) {
        console.warn('⚠️  Email notifications disabled in production: missing EMAIL_USER or EMAIL_PASS');
        config.EMAIL_NOTIFICATIONS_ENABLED = false;
    }
    
    if (config.LOG_LEVEL === 'debug') {
        console.warn('⚠️  Debug logging enabled in production - consider changing LOG_LEVEL to "info"');
    }
}

module.exports = config;
