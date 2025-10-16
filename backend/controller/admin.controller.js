/**
 * Controlador de Administración - SkillTrade
 * 
 * Maneja todas las operaciones del panel de administración:
 * - Estadísticas generales del sistema
 * - Gestión paginada de cursos, usuarios, ventas e intercambios
 * - Operaciones de eliminación con permisos de administrador
 * - Métricas y reportes para toma de decisiones
 * 
 * Funcionalidades principales:
 * - Dashboard con métricas clave del negocio
 * - CRUD completo para gestión de contenido
 * - Paginación optimizada para grandes volúmenes de datos
 * - Validaciones de seguridad y permisos
 */

const Curso = require('../model/curso.model');
const Usuario = require('../model/usuario.model');
const Venta = require('../model/venta.model');
const Exchange = require('../model/exchange.model');

/**
 * Obtener estadísticas generales del panel de administración
 * 
 * Calcula y retorna métricas clave del sistema:
 * - Conteos totales de entidades principales
 * - Ingresos totales mediante agregación de ventas
 * - Datos para dashboard administrativo
 * 
 * @param {Object} req - Request object de Express
 * @param {Object} res - Response object con estadísticas del sistema
 * @returns {Object} JSON con métricas generales o mensaje de error
 */
const obtenerEstadisticas = async (req, res) => {
    try {
        const totalCursos = await Curso.countDocuments();
        const totalUsuarios = await Usuario.countDocuments();
        const totalVentas = await Venta.countDocuments();
        const totalIntercambios = await Exchange.countDocuments();

        // Calcular ingresos totales mediante agregación MongoDB
        const ventasAgregadas = await Venta.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const ingresosTotales = ventasAgregadas.length > 0 ? ventasAgregadas[0].total : 0;

        res.json({
            success: true,
            estadisticas: {
                totalCursos,
                totalUsuarios,
                totalVentas,
                totalIntercambios,
                ingresosTotales
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Obtener cursos con paginación para panel de administración
 * 
 * Retorna lista paginada de cursos con información del propietario:
 * - Paginación fija de 5 cursos por página
 * - Ordenamiento por fecha de creación (más recientes primero)
 * - Población de datos del propietario (nombre y email)
 * - Metadatos de paginación para navegación
 * 
 * @param {Object} req - Request con parámetro page en query
 * @param {Object} res - Response con cursos paginados y metadatos
 * @returns {Object} JSON con cursos y información de paginación
 */
const obtenerCursosPaginados = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Límite fijo para consistencia en panel admin
        const skip = (page - 1) * limit;

        const totalCursos = await Curso.countDocuments();
        const totalPaginas = Math.ceil(totalCursos / limit);

        // Obtener cursos con información del propietario
        const cursos = await Curso.find()
            .populate('owner', 'nombre email')
            .sort({ fechaCreacion: -1 }) // Más recientes primero
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            cursos,
            paginacion: {
                paginaActual: page,
                totalPaginas,
                totalElementos: totalCursos,
                elementosPorPagina: limit
            }
        });
    } catch (error) {
        console.error('Error al obtener cursos paginados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener usuarios paginados
const obtenerUsuariosPaginados = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // 5 usuarios por página
        const skip = (page - 1) * limit;

        const totalUsuarios = await Usuario.countDocuments();
        const totalPaginas = Math.ceil(totalUsuarios / limit);

        const usuarios = await Usuario.find()
            .select('-password') // Excluir contraseña
            .sort({ fechaRegistro: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            usuarios,
            paginacion: {
                paginaActual: page,
                totalPaginas,
                totalElementos: totalUsuarios,
                elementosPorPagina: limit
            }
        });
    } catch (error) {
        console.error('Error al obtener usuarios paginados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener ventas paginadas
const obtenerVentasPaginadas = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const totalVentas = await Venta.countDocuments();
        const totalPaginas = Math.ceil(totalVentas / limit);

        const ventas = await Venta.find()
            .populate('usuario', 'nombre email')
            .populate('cursos.curso', 'titulo precio')
            .sort({ fechaVenta: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            ventas,
            paginacion: {
                paginaActual: page,
                totalPaginas,
                totalElementos: totalVentas,
                elementosPorPagina: limit
            }
        });
    } catch (error) {
        console.error('Error al obtener ventas paginadas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener intercambios paginados
const obtenerIntercambiosPaginados = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const totalIntercambios = await Exchange.countDocuments();
        const totalPaginas = Math.ceil(totalIntercambios / limit);

        const intercambios = await Exchange.find()
            .populate('usuarioSolicitante', 'nombre email')
            .populate('usuarioReceptor', 'nombre email')
            .populate('cursoSolicitante', 'titulo')
            .populate('cursoReceptor', 'titulo')
            .sort({ fechaSolicitud: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            intercambios,
            paginacion: {
                paginaActual: page,
                totalPaginas,
                totalElementos: totalIntercambios,
                elementosPorPagina: limit
            }
        });
    } catch (error) {
        console.error('Error al obtener intercambios paginados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Eliminar curso
const eliminarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        
        const curso = await Curso.findById(id);
        if (!curso) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            });
        }

        await Curso.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Curso eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar curso:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No permitir eliminar al administrador
        if (usuario.email === 'skilltrade_admin@gmail.com') {
            return res.status(403).json({
                success: false,
                message: 'No se puede eliminar al administrador'
            });
        }

        await Usuario.findByIdAndDelete(id);
        
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    obtenerEstadisticas,
    obtenerCursosPaginados,
    obtenerUsuariosPaginados,
    obtenerVentasPaginadas,
    obtenerIntercambiosPaginados,
    eliminarCurso,
    eliminarUsuario
};
