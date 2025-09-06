const Usuario = require('../model/usuario.model');

// Middleware de autenticación con API Key (TTL: 24 horas)
const autenticarApiKey = async (req, res, next) => {
    try {
        // Obtener API Key del header
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                message: 'API Key requerida. Use header: X-API-Key'
            });
        }

        // Buscar usuario por API Key
        const usuario = await Usuario.findOne({ apiKey }).select('-password');
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'API Key inválida'
            });
        }

        // Verificar que el usuario esté activo
        if (usuario.activo === false) {
            return res.status(403).json({
                success: false,
                message: 'Cuenta desactivada'
            });
        }
        
        const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
        const referencia = usuario.updatedAt || usuario.fechaCreacion || new Date(0);
        const expiraEn = new Date(referencia.getTime() + TTL_MS);
        if (Date.now() > expiraEn.getTime()) {
            return res.status(401).json({
                success: false,
                message: 'API Key expirada'
            });
        }

        // Agregar usuario al request
        req.usuario = {
            _id: usuario._id,
            id: usuario._id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol || 'usuario'
        };

        next();

    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Middleware para roles específicos
const requerirRol = (roles) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Roles permitidos: ${roles.join(', ')}`
            });
        }

        next();
    };
};

// Middleware para verificar propiedad del recurso
const verificarPropietario = (campoId = 'id') => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        const recursoId = req.params[campoId];
        
        if (req.usuario.rol === 'admin') {
            return next(); // Los admins pueden acceder a todo
        }

        if (req.usuario.id === recursoId) {
            return next(); // El propietario puede acceder
        }

        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo puedes acceder a tus propios recursos.'
        });
    };
};

// Middleware para verificar acceso a curso
const verificarAccesoCurso = async (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }

        const { cursoId } = req.params;
        const usuarioId = req.usuario.id;

        // Aquí implementarías la lógica para verificar acceso al curso
        // Por ejemplo: si es propietario, si tiene suscripción, si lo compró, etc.
        
        // Por ahora, permitimos acceso a todos los usuarios autenticados
        next();

    } catch (error) {
        console.error('Error al verificar acceso al curso:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    autenticarApiKey,
    requerirRol,
    verificarPropietario,
    verificarAccesoCurso
};
