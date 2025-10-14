const Usuario = require('../model/usuario.model');

// Middleware de autenticación con API Key (TTL: 24 horas)
const autenticarApiKey = async (req, res, next) => {
    try {
        console.log(`autenticarApiKey - ${req.method} ${req.path}`);
        
        // Bypass temporal de autenticación controlado por variable de entorno
        // Si AUTH_DISABLED === 'true', se asigna un usuario mock y se continúa
        if (process.env.AUTH_DISABLED === 'true') {
            req.usuario = {
                id: 'dev-user-id',
                email: 'dev@example.com',
                nombre: 'Usuario Dev',
                rol: 'admin'
            };
            return next();
        }

        // Obtener API Key del header
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        console.log('autenticarApiKey - API Key presente:', apiKey ? 'SÍ' : 'NO');
        console.log('autenticarApiKey - API Key length:', apiKey ? apiKey.length : 0);

        if (!apiKey) {
            console.log('autenticarApiKey - No API Key encontrada');
            return res.status(401).json({
                success: false,
                message: 'API Key requerida. Use header: X-API-Key'
            });
        }

        // Buscar usuario por API Key
        const usuario = await Usuario.findOne({ apiKey }).select('-password');
        console.log('autenticarApiKey - Usuario encontrado:', usuario ? usuario.email : 'NO');
        
        if (!usuario) {
            console.log('autenticarApiKey - API Key inválida');
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
        
        // Nota: TTL removido - las API Keys son persistentes hasta logout explícito
        // Esto evita que los usuarios sean deslogueados automáticamente

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
