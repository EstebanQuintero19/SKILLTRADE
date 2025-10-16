/**
 * Middleware de Administración - SkillTrade
 * 
 * Proporciona verificación de permisos de administrador para rutas protegidas.
 * Solo permite acceso al usuario administrador específico del sistema.
 * 
 * Características de seguridad:
 * - Verificación de API Key válida
 * - Validación de email específico de administrador
 * - Logging detallado para auditoría
 * - Manejo de errores robusto
 * 
 * Email de administrador autorizado: skilltrade_admin@gmail.com
 */

const Usuario = require('../model/usuario.model');

/**
 * Middleware de verificación de permisos de administrador
 * 
 * Valida que el usuario autenticado sea el administrador del sistema:
 * - Extrae API Key de headers múltiples (x-api-key, rh-api-key, authorization)
 * - Busca usuario correspondiente en base de datos
 * - Verifica email específico de administrador
 * - Adjunta usuario al request para uso posterior
 * 
 * @param {Object} req - Request object de Express
 * @param {Object} res - Response object de Express  
 * @param {Function} next - Función next para continuar middleware chain
 * @returns {Object} JSON con error si no es admin, o continúa al siguiente middleware
 */
const verificarAdmin = async (req, res, next) => {
    try {
        console.log('=== VERIFICAR ADMIN MIDDLEWARE ===');
        console.log('Headers recibidos:', req.headers);
        
        const apiKey = req.headers['x-api-key'] || req.headers['rh-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        console.log('API Key extraído:', apiKey);
        console.log('API Key length:', apiKey?.length);
        
        if (!apiKey) {
            console.log('No se encontró API Key');
            return res.status(401).json({ 
                success: false, 
                message: 'API Key de acceso requerido' 
            });
        }

        console.log('Buscando usuario por API Key...');
        const usuario = await Usuario.findOne({ apiKey: apiKey });
        console.log('Usuario encontrado:', usuario?.email);

        if (!usuario) {
            console.log('Usuario no encontrado con esa API Key');
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }

        // Verificar que el usuario sea el administrador específico
        if (usuario.email !== 'skilltrade_admin@gmail.com') {
            console.log('Usuario no es administrador:', usuario.email);
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. Solo administradores pueden acceder.' 
            });
        }

        console.log('Acceso de administrador autorizado');
        req.usuario = usuario;
        next();
    } catch (error) {
        console.error('Error en verificación de admin:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'API Key inválido' 
        });
    }
};

module.exports = { verificarAdmin };
