/**
 * Configuración segura de variables de entorno
 * Valida que todas las variables críticas estén presentes
 */

require('dotenv').config();

const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'USER_DB',
    'PASS_DB',
    'DB_NAME',
    'JWT_SECRET',
    'API_KEY'
];

// Validar variables críticas
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
    console.error('💡 Crea un archivo .env con las siguientes variables:');
    missingVars.forEach(varName => {
        console.error(`   ${varName}=tu_valor_aqui`);
    });
    process.exit(1);
}

const config = {
    // Servidor
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT) || 9090,
    
    // Base de datos
    MONGODB_URI: `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@adso2873441.ex6dvxq.mongodb.net/${process.env.DB_NAME}`,
    
    // Seguridad
    JWT_SECRET: process.env.JWT_SECRET,
    API_KEY: process.env.API_KEY,
    
    // CORS
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    
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
