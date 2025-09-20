/**
 * Middleware simple de logging de requests con Winston
 */

const logger = require('../services/winston-logger');

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
