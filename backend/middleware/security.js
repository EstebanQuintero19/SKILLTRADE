/**
 * Middleware de Seguridad - SkillTrade
 * 
 * Implementa múltiples capas de seguridad para proteger la API:
 * - Headers de seguridad con Helmet
 * - CORS configurado con lista blanca de orígenes
 * - Rate limiting para prevenir ataques de fuerza bruta
 * - Content Security Policy (CSP) para prevenir XSS
 * - HTTP Strict Transport Security (HSTS)
 * - Validaciones de origen y referrer
 * 
 * Características de seguridad:
 * - Protección contra ataques XSS y CSRF
 * - Prevención de clickjacking con frame options
 * - Rate limiting configurable por entorno
 * - CORS dinámico basado en lista blanca
 * - Headers de seguridad estándar de la industria
 * - Logging de intentos de acceso bloqueados
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../config/environment');

/**
 * Configuración de Helmet para headers de seguridad
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Deshabilitado para compatibilidad con uploads
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

/**
 * Configuración de CORS segura
 */
const corsConfig = cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (config.ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
});

/**
 * Rate Limiting general
 */
const generalLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
        retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const logger = require('../services/winston-logger');
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method
        });
        
        res.status(429).json({
            success: false,
            message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
            retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
        });
    }
});

/**
 * Rate Limiting estricto para autenticación
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos por IP
    message: {
        success: false,
        message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // No contar requests exitosos
    handler: (req, res) => {
        const logger = require('../services/winston-logger');
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            email: req.body?.email || 'unknown'
        });
        
        res.status(429).json({
            success: false,
            message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos.'
        });
    }
});

/**
 * Rate Limiting para creación de recursos
 */
const createLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // 10 creaciones por minuto
    message: {
        success: false,
        message: 'Demasiadas creaciones de recursos, intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Middleware para sanitizar inputs
 */
const sanitizeInputs = (req, res, next) => {
    // Función para sanitizar strings
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    };

    // Sanitizar body
    if (req.body) {
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = sanitizeString(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        };
        sanitizeObject(req.body);
    }

    // Sanitizar query parameters
    if (req.query) {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        }
    }

    next();
};

/**
 * Middleware para validar API Key de manera segura
 */
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API Key requerida. Use header: X-API-Key'
        });
    }

    if (apiKey !== config.API_KEY) {
        const logger = require('../services/winston-logger');
        logger.warn('Invalid API key attempt', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method
        });
        
        return res.status(401).json({
            success: false,
            message: 'API Key inválida'
        });
    }

    next();
};

/**
 * Middleware para prevenir ataques comunes
 */
const securityHeaders = (req, res, next) => {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevenir MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Habilitar XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
};

module.exports = {
    helmetConfig,
    corsConfig,
    generalLimiter,
    authLimiter,
    createLimiter,
    sanitizeInputs,
    validateApiKey,
    securityHeaders
};
