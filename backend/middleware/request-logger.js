/**
 * Middleware de Logging de Peticiones - SkillTrade
 * 
 * Sistema de logging HTTP para monitoreo y auditoría:
 * - Registro de todas las peticiones HTTP
 * - Medición de tiempo de respuesta en milisegundos
 * - Logging diferenciado por código de estado
 * - Captura de información de usuario y IP
 * - Integración con Winston para persistencia
 * 
 * Información registrada:
 * - Método HTTP (GET, POST, PUT, DELETE, etc.)
 * - URL completa de la petición
 * - Código de estado de respuesta
 * - Duración de procesamiento
 * - Dirección IP del cliente
 * - ID del usuario autenticado (si aplica)
 * 
 * Niveles de logging:
 * - ERROR (5xx): Errores del servidor
 * - WARN (4xx): Errores del cliente
 * - INFO (2xx-3xx): Peticiones exitosas
 */

const logger = require('../services/winston-logger');

/**
 * Middleware de logging de peticiones HTTP
 * 
 * Registra información detallada de cada petición HTTP:
 * - Calcula tiempo de respuesta con precisión de nanosegundos
 * - Clasifica logs por código de estado HTTP
 * - Captura metadatos relevantes para auditoría
 * 
 * @param {Object} req - Request object de Express
 * @param {Object} res - Response object de Express
 * @param {Function} next - Función next para continuar middleware chain
 */
const requestLogger = (req, res, next) => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
        const ms = Number((process.hrtime.bigint() - start) / 1000000n);
        
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${ms}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user ? req.user._id : null
        };

        if (res.statusCode >= 500) {
            logger.error('HTTP Request Error', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('HTTP Request Warning', logData);
        } else {
            logger.info('HTTP Request', logData);
        }
    });

    next();
};

module.exports = requestLogger;
