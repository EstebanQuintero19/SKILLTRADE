const Suscripcion = require('../model/suscripcion.model');
const Usuario = require('../model/usuario.model');
const Curso = require('../model/curso.model');
const Notificacion = require('../model/notificacion.model');

// RF-SUS-01: Suscribirse por pago
const crearSuscripcion = async (req, res) => {
    try {
        const { creador, tipo, precio, metodoPago } = req.body;
        const suscriptorId = req.usuario._id;

        // Validaciones básicas
        if (!creador || !tipo || !precio || !metodoPago) {
            return res.status(400).json({
                error: 'creador, tipo, precio y metodoPago son obligatorios'
            });
        }

        // Validar tipo de suscripción
        if (!['mensual', 'trimestral', 'anual'].includes(tipo)) {
            return res.status(400).json({
                error: 'El tipo debe ser mensual, trimestral o anual'
            });
        }

        // Validar precio
        if (!Number.isFinite(precio) || precio < 0) {
            return res.status(400).json({
                error: 'El precio debe ser un número válido no negativo'
            });
        }

        // Validar método de pago
        if (!['tarjeta', 'paypal', 'transferencia'].includes(metodoPago)) {
            return res.status(400).json({
                error: 'Método de pago no válido'
            });
        }

        // Verificar que el creador existe
        const creadorDoc = await Usuario.findById(creador);
        if (!creadorDoc) {
            return res.status(404).json({
                error: 'Creador no encontrado'
            });
        }

        // Verificar que no se suscribe a sí mismo
        if (creador === suscriptorId.toString()) {
            return res.status(400).json({
                error: 'No puedes suscribirte a ti mismo'
            });
        }

        // Verificar que no tiene una suscripción activa con este creador
        const suscripcionExistente = await Suscripcion.findOne({
            suscriptor: suscriptorId,
            creador,
            estado: 'activa'
        });

        if (suscripcionExistente) {
            return res.status(400).json({
                error: 'Ya tienes una suscripción activa con este creador'
            });
        }

        // Calcular fecha de fin según el tipo
        const fechaInicio = new Date();
        let fechaFin;
        switch (tipo) {
            case 'mensual':
                fechaFin = new Date(fechaInicio.getTime() + (30 * 24 * 60 * 60 * 1000));
                break;
            case 'trimestral':
                fechaFin = new Date(fechaInicio.getTime() + (90 * 24 * 60 * 60 * 1000));
                break;
            case 'anual':
                fechaFin = new Date(fechaInicio.getTime() + (365 * 24 * 60 * 60 * 1000));
                break;
        }

        // Crear suscripción
        const suscripcion = new Suscripcion({
            suscriptor: suscriptorId,
            creador,
            tipo,
            precio,
            fechaInicio,
            fechaFin,
            metodoPago: { tipo: metodoPago }
        });

        await suscripcion.save();

        // Crear notificación para el creador
        try {
            const notificacion = new Notificacion({
                usuario: creador,
                tipo: 'suscripcion',
                titulo: 'Nueva suscripción',
                mensaje: `${req.usuario.nombre} se ha suscrito a tu contenido`,
                accion: {
                    tipo: 'navegar',
                    url: `/suscripciones/${suscripcion._id}`
                }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.status(201).json({
            mensaje: 'Suscripción creada exitosamente',
            suscripcion
        });

    } catch (error) {
        console.error('Error al crear suscripción:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear suscripción'
        });
    }
};

// RF-SUS-02: Ver cursos por suscripción
const obtenerCursosPorSuscripcion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const suscripcion = await Suscripcion.findById(id);
        if (!suscripcion) {
            return res.status(404).json({
                error: 'Suscripción no encontrada'
            });
        }

        // Verificar que el usuario es el suscriptor o el creador
        if (suscripcion.suscriptor.toString() !== usuarioId.toString() && 
            suscripcion.creador.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para ver esta suscripción'
            });
        }

        // Verificar que la suscripción esté activa
        if (!suscripcion.estaActiva()) {
            return res.status(400).json({
                error: 'La suscripción no está activa'
            });
        }

        // Obtener cursos del creador
        const cursos = await Curso.find({
            owner: suscripcion.creador,
            visibilidad: { $in: ['publico', 'soloSuscriptores'] }
        }).populate('owner', 'nombre email');

        res.json({
            suscripcion,
            cursos,
            total: cursos.length
        });

    } catch (error) {
        console.error('Error al obtener cursos por suscripción:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener cursos'
        });
    }
};

// RF-SUS-03: Cancelar suscripción
const cancelarSuscripcion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const suscripcion = await Suscripcion.findById(id);
        if (!suscripcion) {
            return res.status(404).json({
                error: 'Suscripción no encontrada'
            });
        }

        // Verificar que el usuario es el suscriptor
        if (suscripcion.suscriptor.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para cancelar esta suscripción'
            });
        }

        // Verificar que la suscripción esté activa
        if (!suscripcion.estaActiva()) {
            return res.status(400).json({
                error: 'La suscripción no está activa'
            });
        }

        // Cancelar suscripción
        await suscripcion.cancelar();

        // Crear notificación para el creador
        try {
            const notificacion = new Notificacion({
                usuario: suscripcion.creador,
                tipo: 'suscripcion',
                titulo: 'Suscripción cancelada',
                mensaje: `${req.usuario.nombre} ha cancelado su suscripción`,
                accion: {
                    tipo: 'navegar',
                    url: `/suscripciones/${suscripcion._id}`
                }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.json({
            mensaje: 'Suscripción cancelada exitosamente',
            suscripcion
        });

    } catch (error) {
        console.error('Error al cancelar suscripción:', error);
        res.status(500).json({
            error: 'Error interno del servidor al cancelar suscripción'
        });
    }
};

// RF-SUS-04: Renovación automática ON/OFF
const toggleRenovacionAutomatica = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const suscripcion = await Suscripcion.findById(id);
        if (!suscripcion) {
            return res.status(404).json({
                error: 'Suscripción no encontrada'
            });
        }

        // Verificar que el usuario es el suscriptor
        if (suscripcion.suscriptor.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para modificar esta suscripción'
            });
        }

        // Cambiar estado de renovación automática
        suscripcion.renovacionAutomatica = !suscripcion.renovacionAutomatica;
        await suscripcion.save();

        res.json({
            mensaje: `Renovación automática ${suscripcion.renovacionAutomatica ? 'activada' : 'desactivada'}`,
            suscripcion
        });

    } catch (error) {
        console.error('Error al cambiar renovación automática:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// RF-SUS-05: Historial de suscripciones
const obtenerHistorialSuscripciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Verificar que el usuario solicita sus propias suscripciones
        if (req.usuario._id.toString() !== id && req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'No tienes permisos para ver estas suscripciones'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const suscripciones = await Suscripcion.find({ suscriptor: id })
            .populate('creador', 'nombre email')
            .sort({ fechaInicio: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Suscripcion.countDocuments({ suscriptor: id });

        res.json({
            suscripciones,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener historial de suscripciones:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// RF-SUS-08: Calificar experiencia con usuario suscrito
const calificarSuscripcion = async (req, res) => {
    try {
        const { id } = req.params;
        const { puntuacion, comentario } = req.body;
        const usuarioId = req.usuario._id;

        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({
                error: 'La puntuación debe ser un número entre 1 y 5'
            });
        }

        const suscripcion = await Suscripcion.findById(id);
        if (!suscripcion) {
            return res.status(404).json({
                error: 'Suscripción no encontrada'
            });
        }

        // Verificar que el usuario es el creador
        if (suscripcion.creador.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'Solo el creador puede calificar la suscripción'
            });
        }

        // Verificar que la suscripción esté activa o finalizada
        if (!['activa', 'vencida'].includes(suscripcion.estado)) {
            return res.status(400).json({
                error: 'Solo se pueden calificar suscripciones activas o vencidas'
            });
        }

        // Agregar calificación
        suscripcion.calificacionCreador = {
            puntuacion,
            comentario: comentario || '',
            fecha: new Date()
        };

        await suscripcion.save();

        res.json({
            mensaje: 'Calificación agregada exitosamente',
            suscripcion
        });

    } catch (error) {
        console.error('Error al calificar suscripción:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// RF-SUS-10: Ver beneficios exclusivos
const obtenerBeneficios = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const suscripcion = await Suscripcion.findById(id);
        if (!suscripcion) {
            return res.status(404).json({
                error: 'Suscripción no encontrada'
            });
        }

        // Verificar que el usuario es el suscriptor
        if (suscripcion.suscriptor.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para ver estos beneficios'
            });
        }

        // Verificar que la suscripción esté activa
        if (!suscripcion.estaActiva()) {
            return res.status(400).json({
                error: 'La suscripción no está activa'
            });
        }

        // Obtener beneficios según el tipo de suscripción
        const beneficios = {
            tipo: suscripcion.tipo,
            accesoCursos: 'Acceso completo a todos los cursos del creador',
            contenidoExclusivo: 'Contenido exclusivo para suscriptores',
            soportePrioritario: 'Soporte prioritario del creador',
            descuentos: 'Descuentos en cursos premium',
            comunidad: 'Acceso a comunidad privada'
        };

        // Beneficios específicos por tipo
        if (suscripcion.tipo === 'anual') {
            beneficios.bonus = '2 meses gratis + curso premium incluido';
        } else if (suscripcion.tipo === 'trimestral') {
            beneficios.bonus = '1 mes gratis';
        }

        res.json({
            suscripcion: {
                _id: suscripcion._id,
                tipo: suscripcion.tipo,
                fechaInicio: suscripcion.fechaInicio,
                fechaFin: suscripcion.fechaFin
            },
            beneficios
        });

    } catch (error) {
        console.error('Error al obtener beneficios:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener todas las suscripciones (solo admin)
const obtenerSuscripciones = async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado. Solo administradores'
            });
        }

        const { page = 1, limit = 20, estado } = req.query;

        const filtros = {};
        if (estado) filtros.estado = estado;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const suscripciones = await Suscripcion.find(filtros)
            .populate('suscriptor', 'nombre email')
            .populate('creador', 'nombre email')
            .sort({ fechaInicio: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Suscripcion.countDocuments(filtros);

        res.json({
            suscripciones,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener suscripciones:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener suscripción por ID
const obtenerSuscripcionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const suscripcion = await Suscripcion.findById(id)
            .populate('suscriptor', 'nombre email')
            .populate('creador', 'nombre email');

        if (!suscripcion) {
            return res.status(404).json({
                error: 'Suscripción no encontrada'
            });
        }

        // Verificar permisos
        if (suscripcion.suscriptor.toString() !== usuarioId.toString() && 
            suscripcion.creador.toString() !== usuarioId.toString() && 
            req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'No tienes permisos para ver esta suscripción'
            });
        }

        res.json({
            suscripcion,
            mensaje: 'Suscripción obtenida exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener suscripción:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Actualizar suscripción (solo admin)
const actualizarSuscripcion = async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado. Solo administradores'
            });
        }

        const { id } = req.params;
        const camposActualizados = req.body;

        const suscripcion = await Suscripcion.findByIdAndUpdate(
            id,
            camposActualizados,
            { new: true, runValidators: true }
        ).populate('suscriptor', 'nombre email')
         .populate('creador', 'nombre email');

        if (!suscripcion) {
            return res.status(404).json({
                error: 'Suscripción no encontrada'
            });
        }

        res.json({
            mensaje: 'Suscripción actualizada exitosamente',
            suscripcion
        });

    } catch (error) {
        console.error('Error al actualizar suscripción:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Eliminar suscripción (solo admin)
const eliminarSuscripcion = async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado. Solo administradores'
            });
        }

        const { id } = req.params;

        const suscripcion = await Suscripcion.findByIdAndDelete(id);
        if (!suscripcion) {
            return res.status(404).json({
                error: 'Suscripción no encontrada'
            });
        }

        res.json({
            mensaje: 'Suscripción eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar suscripción:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

module.exports = {
    crearSuscripcion,
    obtenerCursosPorSuscripcion,
    cancelarSuscripcion,
    toggleRenovacionAutomatica,
    obtenerHistorialSuscripciones,
    calificarSuscripcion,
    obtenerBeneficios,
    obtenerSuscripciones,
    obtenerSuscripcionPorId,
    actualizarSuscripcion,
    eliminarSuscripcion
};
