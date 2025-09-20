/**
 * Sistema de logging consolidado con Winston
 * Versión de producción lista con seguridad mejorada
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/environment');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuración de Winston
const { combine, timestamp, printf, json, colorize, errors } = winston.format;

// Formato para consola
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const base = `${timestamp} [${level.toUpperCase()}] ${message}`;
    const stackPart = stack ? `\n${stack}` : '';
    const metaPart = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${base}${stackPart}${metaPart}`;
});

// Formato para archivos
const fileFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

// Crear logger de Winston
const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: fileFormat,
    transports: [
        // Consola
        new winston.transports.Console({
            level: config.CONSOLE_LOG_LEVEL,
            format: combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                errors({ stack: true }),
                consoleFormat
            ),
            silent: config.NODE_ENV === 'test'
        }),
        
        // Archivo de errores
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        }),
        
        // Archivo combinado
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
        })
    ],
    
    // Manejo de excepciones y rechazos
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'exceptions.log'),
            format: fileFormat
        })
    ],
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'rejections.log'),
            format: fileFormat
        })
    ],
    exitOnError: false
});

// Sistema de notificaciones por email (opcional)
let mailTransporter = null;

const setupEmailNotifications = () => {
    if (!config.EMAIL_NOTIFICATIONS_ENABLED || !config.EMAIL_USER || !config.EMAIL_PASS) {
        logger.warn('Email notifications disabled: missing configuration');
        return null;
    }

    try {
        const nodemailer = require('nodemailer');
        mailTransporter = nodemailer.createTransporter({
            host: config.EMAIL_HOST || 'smtp.gmail.com',
            port: config.EMAIL_PORT,
            secure: config.EMAIL_SECURE,
            auth: { 
                user: config.EMAIL_USER, 
                pass: config.EMAIL_PASS 
            }
        });
        
        logger.info('Email notifications configured successfully');
        return mailTransporter;
    } catch (error) {
        logger.error('Failed to setup email notifications', { error: error.message });
        return null;
    }
};

// Enviar email para errores críticos
const sendErrorEmail = async (errorInfo) => {
    if (!mailTransporter) return;
    
    try {
        const subjectMessage = typeof errorInfo.message === 'string'
            ? errorInfo.message
            : (errorInfo.message && errorInfo.message.toString()) || 'Error';

        const mailOptions = {
            from: config.EMAIL_FROM,
            to: config.ERROR_EMAIL_TO || 'admin@skilltrade.com',
            subject: `[SKILLTRADE ERROR] ${subjectMessage}`,
            text: JSON.stringify(errorInfo, null, 2)
        };

        await mailTransporter.sendMail(mailOptions);
        logger.info('Error notification email sent successfully');
    } catch (mailErr) {
        console.error('Failed to send error email:', mailErr.message);
    }
};

// Interceptar errores para enviar emails automáticamente
const originalError = logger.error.bind(logger);
logger.error = function patchedError(message, ...args) {
    const baseInfo = {
        level: 'error',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV
    };

    // Si el mensaje es una instancia de Error, enriquecer la información
    if (message instanceof Error) {
        baseInfo.message = message.message;
        baseInfo.stack = message.stack;
        baseInfo.errorName = message.name;
    } else {
        baseInfo.message = typeof message === 'string' ? message : JSON.stringify(message);
    }

    if (args && args.length > 0) {
        if (args.length === 1 && typeof args[0] === 'object') {
            Object.assign(baseInfo, args[0]);
        } else {
            baseInfo.meta = args;
        }
    }

    // Enviar email para errores críticos (fire-and-forget)
    if (config.EMAIL_NOTIFICATIONS_ENABLED) {
        sendErrorEmail(baseInfo).catch(() => {});
    }

    return originalError(message, ...args);
};

// Agregar método fatal personalizado
logger.fatal = function(message, ...args) {
    const baseInfo = {
        level: 'fatal',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV
    };

    if (message instanceof Error) {
        baseInfo.message = message.message;
        baseInfo.stack = message.stack;
        baseInfo.errorName = message.name;
    } else {
        baseInfo.message = typeof message === 'string' ? message : JSON.stringify(message);
    }

    if (args && args.length > 0) {
        if (args.length === 1 && typeof args[0] === 'object') {
            Object.assign(baseInfo, args[0]);
        } else {
            baseInfo.meta = args;
        }
    }

    // Siempre enviar email para errores fatales
    if (config.EMAIL_NOTIFICATIONS_ENABLED) {
        sendErrorEmail(baseInfo).catch(() => {});
    }

    return logger.error(message, ...args);
};

// Inicializar notificaciones por email si está habilitado
if (config.EMAIL_NOTIFICATIONS_ENABLED) {
    setupEmailNotifications();
}

// Métodos de utilidad para logging específico
logger.auth = (action, userId, details = {}) => {
    logger.info('Authentication event', { action, userId, ...details, category: 'auth' });
};

logger.user = (action, userId, details = {}) => {
    logger.info('User event', { action, userId, ...details, category: 'user' });
};

logger.course = (action, courseId, userId, details = {}) => {
    logger.info('Course event', { action, courseId, userId, ...details, category: 'course' });
};

logger.exchange = (action, exchangeId, userId, details = {}) => {
    logger.info('Exchange event', { action, exchangeId, userId, ...details, category: 'exchange' });
};

logger.security = (action, userId, details = {}) => {
    logger.warn('Security event', { action, userId, ...details, category: 'security' });
};

logger.performance = (action, duration, details = {}) => {
    logger.info('Performance event', { 
        action, 
        duration: `${duration}ms`, 
        ...details, 
        category: 'performance' 
    });
};

module.exports = logger;
