
/**
 * Middleware de Request Log (Deprecated) - SkillTrade
 * 
 * Versión legacy del sistema de logging de peticiones HTTP.
 * Este middleware ha sido reemplazado por request-logger.js
 * que utiliza Winston para un logging más robusto.
 * 
 * Funcionalidades básicas:
 * - Logging simple de peticiones HTTP
 * - Medición de tiempo de respuesta
 * - Captura de información básica de usuario
 * - Registro de User-Agent y dirección IP
 */

const logger = require('../logger');

module.exports = function requestLog(req, res, next) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const ms = Number((process.hrtime.bigint() - start) / 1000000n);
        
        // Usar el nuevo sistema de logging
        logger.info('HTTP Request', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${ms}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user ? req.user._id : null
        });
    });
    next();
};
