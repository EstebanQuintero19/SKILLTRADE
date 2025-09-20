/**
 * Configuración del frontend SkillTrade
 * Centraliza todas las variables de entorno y configuraciones
 */

require('dotenv').config();

const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'SESSION_SECRET',
    'API_BASE_URL'
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
    PORT: parseInt(process.env.PORT) || 3001,
    
    // Sesiones
    SESSION_SECRET: process.env.SESSION_SECRET,
    
    // API Backend
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:9090/api',
    
    // Analytics (opcional)
    GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
    HOTJAR_ID: process.env.HOTJAR_ID,
    
    // Features
    ENABLE_PWA: process.env.ENABLE_PWA === 'true',
    ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
    ENABLE_DEBUG: process.env.ENABLE_DEBUG === 'true',
    
    // Seguridad
    CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    
    // Cache
    STATIC_CACHE_MAX_AGE: parseInt(process.env.STATIC_CACHE_MAX_AGE) || 86400000, // 1 día
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    
    // Uploads
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
};

// Validaciones adicionales
if (config.NODE_ENV === 'production') {
    if (config.SESSION_SECRET.length < 32) {
        console.error('❌ SESSION_SECRET debe tener al menos 32 caracteres en producción');
        process.exit(1);
    }
    
    if (!config.API_BASE_URL.startsWith('https://')) {
        console.warn('⚠️  Se recomienda usar HTTPS para API_BASE_URL en producción');
    }
}

// Log de configuración (solo en desarrollo)
if (config.NODE_ENV === 'development' && config.ENABLE_DEBUG) {
    console.log('🔧 Configuración del Frontend:');
    console.log(`   Entorno: ${config.NODE_ENV}`);
    console.log(`   Puerto: ${config.PORT}`);
    console.log(`   API URL: ${config.API_BASE_URL}`);
    console.log(`   PWA: ${config.ENABLE_PWA ? 'Habilitado' : 'Deshabilitado'}`);
    console.log(`   Analytics: ${config.ENABLE_ANALYTICS ? 'Habilitado' : 'Deshabilitado'}`);
}

module.exports = config;

