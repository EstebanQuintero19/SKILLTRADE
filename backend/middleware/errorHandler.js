/**
 * Middleware de Manejo de Errores - SkillTrade
 * 
 * Sistema centralizado para captura y procesamiento de errores:
 * - Manejo de errores de Mongoose y MongoDB
 * - Errores de validación con mensajes descriptivos
 * - Errores de autenticación y autorización
 * - Errores de aplicación personalizados
 * - Logging detallado para debugging
 * - Respuestas consistentes y seguras
 * 
 * Tipos de errores manejados:
 * - ValidationError: Errores de validación de Mongoose
 * - CastError: Errores de formato de ObjectId
 * - MongoServerError: Errores de duplicados y base de datos
 * - AppError: Errores personalizados de la aplicación
 * - Errores no operacionales: Bugs y errores inesperados
 * 
 * Características de seguridad:
 * - No expone información sensible en producción
 * - Stack traces solo en desarrollo
 * - Logging completo para auditoría
 * - Respuestas sanitizadas para el cliente
 */

const config = require('../config/environment');

/**
 * Clase personalizada para errores de la aplicación
 */
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Manejo de errores de Mongoose
 */
const handleMongooseError = (error) => {
    let message = 'Error de validación';
    let statusCode = 400;

    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        message = `Datos inválidos: ${errors.join(', ')}`;
    } else if (error.name === 'CastError') {
        message = `Formato de ID inválido: ${error.value}`;
    } else if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        message = `${field} ya existe en el sistema`;
    } else if (error.name === 'MongoServerError') {
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            message = `${field} ya existe en el sistema`;
        } else {
            message = 'Error de base de datos';
            statusCode = 500;
        }
    }

    return new AppError(message, statusCode);
};

/**
 * Manejo de errores de JWT
 */
const handleJWTError = () => {
    return new AppError('Token inválido. Por favor, inicia sesión nuevamente.', 401);
};

const handleJWTExpiredError = () => {
    return new AppError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 401);
};

/**
 * Manejo de errores de Multer (archivos)
 */
const handleMulterError = (error) => {
    if (error.code === 'LIMIT_FILE_SIZE') {
        return new AppError('El archivo es demasiado grande. Máximo 10MB.', 400);
    } else if (error.code === 'LIMIT_FILE_COUNT') {
        return new AppError('Demasiados archivos. Máximo 1 archivo por petición.', 400);
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return new AppError('Campo de archivo inesperado.', 400);
    }
    return new AppError('Error al procesar el archivo.', 400);
};

/**
 * Función para enviar errores en desarrollo
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: err,
        message: err.message,
        stack: err.stack,
        status: err.status
    });
};

/**
 * Función para enviar errores en producción
 */
const sendErrorProd = (err, res) => {
    // Errores operacionales: enviar mensaje al cliente
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            status: err.status
        });
    } else {
        // Errores de programación: no enviar detalles
        console.error('ERROR 💥', err);
        
        res.status(500).json({
            success: false,
            message: 'Algo salió mal!',
            status: 'error'
        });
    }
};

/**
 * Middleware principal de manejo de errores
 */
const globalErrorHandler = (err, req, res, next) => {
    const logger = require('../services/winston-logger');
    
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log del error
    logger.error('Application Error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || null,
        statusCode: err.statusCode,
        isOperational: err.isOperational
    });

    // Manejar diferentes tipos de errores
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'ValidationError') error = handleMongooseError(error);
    if (err.name === 'CastError') error = handleMongooseError(error);
    if (err.code === 11000) error = handleMongooseError(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = handleMulterError(error);
    }

    // Enviar respuesta según el entorno
    if (config.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }
};

/**
 * Middleware para capturar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
    const err = new AppError(`No se encontró ${req.originalUrl} en este servidor!`, 404);
    next(err);
};

/**
 * Middleware para manejar errores de async/await
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

/**
 * Middleware para validar parámetros de ID
 */
const validateObjectId = (req, res, next) => {
    const { id } = req.params;
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return next(new AppError('ID inválido', 400));
    }
    
    next();
};

module.exports = {
    AppError,
    globalErrorHandler,
    notFoundHandler,
    catchAsync,
    validateObjectId
};
