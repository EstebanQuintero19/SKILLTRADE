
/**
 * @deprecated Este middleware ha sido reemplazado por request-logger.js
 * Se mantiene por compatibilidad pero se recomienda migrar al nuevo sistema
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
