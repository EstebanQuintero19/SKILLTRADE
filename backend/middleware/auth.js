const jwt = require('jsonwebtoken');
const Usuario = require('../model/usuario.model');

// Middleware para verificar token JWT
const verificarToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.cookies?.token ||
                     req.query.token;

        if (!token) {
            return res.status(401).json({
                error: 'Acceso denegado. Token no proporcionado.'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        
        // Buscar usuario
        const usuario = await Usuario.findById(decoded._id).select('-password');
        
        if (!usuario) {
            return res.status(401).json({
                error: 'Token inválido. Usuario no encontrado.'
            });
        }

        if (!usuario.activo) {
            return res.status(401).json({
                error: 'Usuario inactivo. Contacte al administrador.'
            });
        }

        // Agregar usuario a la request
        req.usuario = usuario;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado. Inicie sesión nuevamente.'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido.'
            });
        }

        console.error('Error en verificación de token:', error);
        res.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};

// Middleware para verificar rol específico
const verificarRol = (roles) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'Usuario no autenticado.'
            });
        }

        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({
                error: 'Acceso denegado. Permisos insuficientes.'
            });
        }

        next();
    };
};

// Middleware para verificar si es propietario del recurso
const verificarPropietario = (campoId = '_id') => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'Usuario no autenticado.'
            });
        }

        const recursoId = req.params[campoId];
        
        if (!recursoId) {
            return res.status(400).json({
                error: 'ID del recurso no proporcionado.'
            });
        }

        // Permitir acceso si es admin o si es el propietario
        if (req.usuario.rol === 'admin') {
            return next();
        }

        // Verificar si es el propietario (esto se implementará en cada controlador específico)
        req.esPropietario = true;
        next();
    };
};

// Middleware para verificar si es propietario del curso
const verificarPropietarioCurso = async (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'Usuario no autenticado.'
            });
        }

        const cursoId = req.params.id || req.params.cursoId;
        
        if (!cursoId) {
            return res.status(400).json({
                error: 'ID del curso no proporcionado.'
            });
        }

        // Permitir acceso si es admin
        if (req.usuario.rol === 'admin') {
            return next();
        }

        // Buscar el curso y verificar si es el propietario
        const Curso = require('../model/curso.model');
        const curso = await Curso.findById(cursoId);
        
        if (!curso) {
            return res.status(404).json({
                error: 'Curso no encontrado.'
            });
        }

        if (curso.owner.toString() !== req.usuario._id.toString()) {
            return res.status(403).json({
                error: 'Acceso denegado. Solo el propietario puede modificar este curso.'
            });
        }

        req.curso = curso;
        next();
    } catch (error) {
        console.error('Error en verificación de propietario del curso:', error);
        res.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};

// Middleware para verificar si es propietario del intercambio
const verificarPropietarioExchange = async (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'Usuario no autenticado.'
            });
        }

        const exchangeId = req.params.id || req.params.exchangeId;
        
        if (!exchangeId) {
            return res.status(400).json({
                error: 'ID del intercambio no proporcionado.'
            });
        }

        // Permitir acceso si es admin
        if (req.usuario.rol === 'admin') {
            return next();
        }

        // Buscar el intercambio y verificar si es el emisor o receptor
        const Exchange = require('../model/exchange.model');
        const exchange = await Exchange.findById(exchangeId);
        
        if (!exchange) {
            return res.status(404).json({
                error: 'Intercambio no encontrado.'
            });
        }

        const esEmisor = exchange.emisor.toString() === req.usuario._id.toString();
        const esReceptor = exchange.receptor.toString() === req.usuario._id.toString();
        
        if (!esEmisor && !esReceptor) {
            return res.status(403).json({
                error: 'Acceso denegado. Solo los participantes del intercambio pueden acceder.'
            });
        }

        req.exchange = exchange;
        req.esEmisor = esEmisor;
        req.esReceptor = esReceptor;
        next();
    } catch (error) {
        console.error('Error en verificación de propietario del intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};

// Middleware para verificar si tiene acceso al curso
const verificarAccesoCurso = async (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                error: 'Usuario no autenticado.'
            });
        }

        const cursoId = req.params.id || req.params.cursoId;
        
        if (!cursoId) {
            return res.status(400).json({
                error: 'ID del curso no proporcionado.'
            });
        }

        // Permitir acceso si es admin
        if (req.usuario.rol === 'admin') {
            return next();
        }

        // Buscar el curso
        const Curso = require('../model/curso.model');
        const curso = await Curso.findById(cursoId);
        
        if (!curso) {
            return res.status(404).json({
                error: 'Curso no encontrado.'
            });
        }

        // Verificar si es el propietario
        if (curso.owner.toString() === req.usuario._id.toString()) {
            req.tieneAcceso = true;
            return next();
        }

        // Verificar si tiene acceso por suscripción
        const Suscripcion = require('../model/suscripcion.model');
        const suscripcion = await Suscripcion.findOne({
            suscriptor: req.usuario._id,
            creador: curso.owner,
            estado: 'activa'
        });

        if (suscripcion && suscripcion.estaActiva()) {
            req.tieneAcceso = true;
            return next();
        }

        // Verificar si tiene acceso por intercambio activo
        const Exchange = require('../model/exchange.model');
        const exchange = await Exchange.findOne({
            $or: [
                { emisor: req.usuario._id },
                { receptor: req.usuario._id }
            ],
            $or: [
                { cursoEmisor: cursoId },
                { cursoReceptor: cursoId }
            ],
            estado: 'activo'
        });

        if (exchange && exchange.estaActivo()) {
            req.tieneAcceso = true;
            return next();
        }

        // Verificar si compró el curso
        const Venta = require('../model/venta.model');
        const venta = await Venta.findOne({
            comprador: req.usuario._id,
            curso: cursoId,
            estado: 'completada'
        });

        if (venta) {
            req.tieneAcceso = true;
            return next();
        }

        // Si no tiene acceso
        return res.status(403).json({
            error: 'Acceso denegado. No tiene permisos para acceder a este curso.'
        });

    } catch (error) {
        console.error('Error en verificación de acceso al curso:', error);
        res.status(500).json({
            error: 'Error interno del servidor.'
        });
    }
};

module.exports = {
    verificarToken,
    verificarRol,
    verificarPropietario,
    verificarPropietarioCurso,
    verificarPropietarioExchange,
    verificarAccesoCurso
};
