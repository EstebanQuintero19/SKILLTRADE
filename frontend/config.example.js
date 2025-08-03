// Configuración de ejemplo para el frontend
// Copia este archivo como config.js y ajusta los valores

module.exports = {
    // Configuración del servidor
    port: process.env.FRONTEND_PORT || 3000,
    
    // Configuración de la API
    apiUrl: process.env.API_URL || 'http://localhost:9090/api/v0',
    
    // Configuración del entorno
    environment: process.env.NODE_ENV || 'development',
    
    // Configuración de la base de datos ----
    database: {
        url: process.env.DATABASE_URL || 'mongodb://localhost:27017/skilltrade'
    },
    
    // Configuración de sesiones
    session: {
        secret: process.env.SESSION_SECRET || 'skilltrade-secret-key',
        resave: false,
        saveUninitialized: false
    },
    
    // Configuración de CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
    }
}; 