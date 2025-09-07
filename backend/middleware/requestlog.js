
const { log } = require('../services/fslogger');

module.exports = function requestLog(req, res, next) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const ms = Number((process.hrtime.bigint() - start) / 1000000n);
        log.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
};
