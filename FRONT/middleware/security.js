/**
 * Middleware de seguridad para el frontend
 * Implementa CSP, sanitización y validaciones
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Content Security Policy para el frontend
 */
const cspConfig = helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "https://cdn.jsdelivr.net",
            "https://fonts.googleapis.com"
        ],
        scriptSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
            "'self'", 
            "data:", 
            "https:",
            "http://localhost:9090/uploads"
        ],
        connectSrc: [
            "'self'", 
            "http://localhost:9090/api",
            "ws://localhost:9090"
        ],
        fontSrc: [
            "'self'", 
            "https://fonts.gstatic.com",
            "https://cdn.jsdelivr.net"
        ],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: []
    }
});

/**
 * Rate limiting para el frontend
 */
const frontendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
        error: 'Demasiadas peticiones desde esta IP',
        message: 'Intenta de nuevo más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Sanitización de inputs del usuario
 */
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '')
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
 * Validación de sesión segura
 */
const validateSession = (req, res, next) => {
    // Verificar que la sesión sea válida
    if (req.session && req.session.user) {
        // Verificar que el usuario tenga los campos necesarios
        if (!req.session.user._id || !req.session.user.email) {
            req.session.destroy();
            return res.redirect('/auth/login');
        }
    }
    next();
};

/**
 * Headers de seguridad adicionales
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
    cspConfig,
    frontendLimiter,
    sanitizeInput,
    validateSession,
    securityHeaders
};
