const Notificacion = require('../model/notificacion.model');
const Usuario = require('../model/usuario.model');

// RF-NOT-01: Solicitudes de intercambio
const crearNotificacion = async (req, res) => {
    try {
        const { usuario, tipo, titulo, mensaje, accion, prioridad = 'media' } = req.body;

        // Validaciones básicas
        if (!usuario || !tipo || !titulo || !mensaje) {
            return res.status(400).json({
                error: 'usuario, tipo, titulo y mensaje son obligatorios'
            });
        }

        // Validar tipo de notificación
        if (!['intercambio', 'curso', 'suscripcion', 'sistema', 'venta'].includes(tipo)) {
            return res.status(400).json({
                error: 'Tipo de notificación no válido'
            });
        }

        // Validar prioridad
        if (!['baja', 'media', 'alta'].includes(prioridad)) {
            return res.status(400).json({
                error: 'Prioridad no válida'
            });
        }

        // Verificar que el usuario existe
        const usuarioDoc = await Usuario.findById(usuario);
        if (!usuarioDoc) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Crear notificación
        const notificacion = new Notificacion({
            usuario,
            tipo,
            titulo,
            mensaje,
            accion,
            prioridad
        });

        await notificacion.save();

        res.status(201).json({
            mensaje: 'Notificación creada exitosamente',
            notificacion
        });

    } catch (error) {
        console.error('Error al crear notificación:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear notificación'
        });
    }
};

// RF-NOT-02: Alertas de cursos (suscripciones)
const crearNotificacionCurso = async (req, res) => {
    try {
        const { cursoId, tipo, titulo, mensaje } = req.body;

        if (!cursoId || !tipo || !titulo || !mensaje) {
            return res.status(400).json({
                error: 'cursoId, tipo, titulo y mensaje son obligatorios'
            });
        }

        // Obtener suscriptores del curso
        const Suscripcion = require('../model/suscripcion.model');
        const suscripciones = await Suscripcion.find({
            creador: cursoId,
            estado: 'activa',
            fechaFin: { $gt: new Date() }
        });

        if (suscripciones.length === 0) {
            return res.json({
                mensaje: 'No hay suscriptores activos para notificar',
                notificacionesCreadas: 0
            });
        }

        // Crear notificaciones para cada suscriptor
        const notificaciones = [];
        for (const suscripcion of suscripciones) {
            const notificacion = new Notificacion({
                usuario: suscripcion.suscriptor,
                tipo: 'curso',
                titulo,
                mensaje,
                prioridad: 'media',
                accion: {
                    tipo: 'navegar',
                    url: `/cursos/${cursoId}`
                }
            });
            notificaciones.push(notificacion);
        }

        await Notificacion.insertMany(notificaciones);

        res.status(201).json({
            mensaje: 'Notificaciones de curso creadas exitosamente',
            notificacionesCreadas: notificaciones.length
        });

    } catch (error) {
        console.error('Error al crear notificaciones de curso:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear notificaciones'
        });
    }
};

// RF-NOT-03: Vencimientos (intercambios/suscripciones)
const crearNotificacionVencimiento = async (req, res) => {
    try {
        const { tipo, diasAntes = 7 } = req.body;

        if (!tipo || !['intercambio', 'suscripcion'].includes(tipo)) {
            return res.status(400).json({
                error: 'Tipo debe ser intercambio o suscripcion'
            });
        }

        let notificaciones = [];

        if (tipo === 'intercambio') {
            // Notificar intercambios que vencen pronto
            const Exchange = require('../model/exchange.model');
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() + diasAntes);

            const intercambios = await Exchange.find({
                estado: 'activo',
                fechaFin: { $lte: fechaLimite, $gt: new Date() }
            }).populate('emisor receptor');

            for (const intercambio of intercambios) {
                // Notificar al emisor
                const notifEmisor = new Notificacion({
                    usuario: intercambio.emisor._id,
                    tipo: 'intercambio',
                    titulo: 'Intercambio próximo a vencer',
                    mensaje: `Tu intercambio vence en ${diasAntes} días`,
                    prioridad: 'alta',
                    accion: {
                        tipo: 'navegar',
                        url: `/exchanges/${intercambio._id}`
                    }
                });
                notificaciones.push(notifEmisor);

                // Notificar al receptor
                const notifReceptor = new Notificacion({
                    usuario: intercambio.receptor._id,
                    tipo: 'intercambio',
                    titulo: 'Intercambio próximo a vencer',
                    mensaje: `Tu intercambio vence en ${diasAntes} días`,
                    prioridad: 'alta',
                    accion: {
                        tipo: 'navegar',
                        url: `/exchanges/${intercambio._id}`
                    }
                });
                notificaciones.push(notifReceptor);
            }
        } else if (tipo === 'suscripcion') {
            // Notificar suscripciones que vencen pronto
            const Suscripcion = require('../model/suscripcion.model');
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() + diasAntes);

            const suscripciones = await Suscripcion.find({
                estado: 'activa',
                fechaFin: { $lte: fechaLimite, $gt: new Date() }
            }).populate('suscriptor creador');

            for (const suscripcion of suscripciones) {
                const notif = new Notificacion({
                    usuario: suscripcion.suscriptor._id,
                    tipo: 'suscripcion',
                    titulo: 'Suscripción próxima a vencer',
                    mensaje: `Tu suscripción a ${suscripcion.creador.nombre} vence en ${diasAntes} días`,
                    prioridad: 'alta',
                    accion: {
                        tipo: 'navegar',
                        url: `/suscripciones/${suscripcion._id}`
                    }
                });
                notificaciones.push(notif);
            }
        }

        if (notificaciones.length > 0) {
            await Notificacion.insertMany(notificaciones);
        }

        res.json({
            mensaje: 'Notificaciones de vencimiento creadas exitosamente',
            notificacionesCreadas: notificaciones.length,
            tipo
        });

    } catch (error) {
        console.error('Error al crear notificaciones de vencimiento:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear notificaciones'
        });
    }
};

// RF-NOT-04: Historial
const obtenerNotificaciones = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { 
            tipo, 
            leida, 
            prioridad,
            page = 1, 
            limit = 20 
        } = req.query;

        // Construir filtros
        const filtros = { usuario: usuarioId };
        if (tipo) filtros.tipo = tipo;
        if (leida !== undefined) filtros.leida = leida === 'true';
        if (prioridad) filtros.prioridad = prioridad;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notificaciones = await Notificacion.find(filtros)
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notificacion.countDocuments(filtros);

        // Contar notificaciones no leídas
        const noLeidas = await Notificacion.countDocuments({
            usuario: usuarioId,
            leida: false
        });

        res.json({
            notificaciones,
            noLeidas,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener notificaciones'
        });
    }
};

// RF-NOT-05: Marcar leída/eliminar
const marcarComoLeida = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const notificacion = await Notificacion.findById(id);
        if (!notificacion) {
            return res.status(404).json({
                error: 'Notificación no encontrada'
            });
        }

        // Verificar que la notificación pertenece al usuario
        if (notificacion.usuario.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para modificar esta notificación'
            });
        }

        notificacion.leida = true;
        notificacion.fechaLectura = new Date();
        await notificacion.save();

        res.json({
            mensaje: 'Notificación marcada como leída',
            notificacion
        });

    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

const marcarComoNoLeida = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const notificacion = await Notificacion.findById(id);
        if (!notificacion) {
            return res.status(404).json({
                error: 'Notificación no encontrada'
            });
        }

        // Verificar que la notificación pertenece al usuario
        if (notificacion.usuario.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para modificar esta notificación'
            });
        }

        notificacion.leida = false;
        notificacion.fechaLectura = undefined;
        await notificacion.save();

        res.json({
            mensaje: 'Notificación marcada como no leída',
            notificacion
        });

    } catch (error) {
        console.error('Error al marcar notificación como no leída:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

const eliminarNotificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const notificacion = await Notificacion.findById(id);
        if (!notificacion) {
            return res.status(404).json({
                error: 'Notificación no encontrada'
            });
        }

        // Verificar que la notificación pertenece al usuario
        if (notificacion.usuario.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para eliminar esta notificación'
            });
        }

        await Notificacion.findByIdAndDelete(id);

        res.json({
            mensaje: 'Notificación eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// RF-NOT-06: Preferencias por canal
const actualizarPreferenciasNotificacion = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { email, inapp, push } = req.body;

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Actualizar preferencias de notificación
        const preferenciasActualizadas = {};
        if (email !== undefined) preferenciasActualizadas.email = email;
        if (inapp !== undefined) preferenciasActualizadas.inapp = inapp;
        if (push !== undefined) preferenciasActualizadas.push = push;

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            usuarioId,
            { preferenciasNotificacion: preferenciasActualizadas },
            { new: true, runValidators: true }
        );

        res.json({
            mensaje: 'Preferencias de notificación actualizadas exitosamente',
            preferencias: usuarioActualizado.preferenciasNotificacion
        });

    } catch (error) {
        console.error('Error al actualizar preferencias de notificación:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Marcar todas como leídas
const marcarTodasComoLeidas = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;

        const resultado = await Notificacion.updateMany(
            { usuario: usuarioId, leida: false },
            { 
                leida: true, 
                fechaLectura: new Date() 
            }
        );

        res.json({
            mensaje: 'Todas las notificaciones marcadas como leídas',
            notificacionesActualizadas: resultado.modifiedCount
        });

    } catch (error) {
        console.error('Error al marcar todas como leídas:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener notificaciones por tipo
const obtenerNotificacionesPorTipo = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { tipo } = req.params;
        const { page = 1, limit = 20 } = req.query;

        if (!['intercambio', 'curso', 'suscripcion', 'sistema', 'venta'].includes(tipo)) {
            return res.status(400).json({
                error: 'Tipo de notificación no válido'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notificaciones = await Notificacion.find({
            usuario: usuarioId,
            tipo
        })
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await Notificacion.countDocuments({
            usuario: usuarioId,
            tipo
        });

        res.json({
            tipo,
            notificaciones,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener notificaciones por tipo:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener notificación por ID
const obtenerNotificacionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const notificacion = await Notificacion.findById(id);
        if (!notificacion) {
            return res.status(404).json({
                error: 'Notificación no encontrada'
            });
        }

        // Verificar que la notificación pertenece al usuario
        if (notificacion.usuario.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para ver esta notificación'
            });
        }

        res.json({
            notificacion,
            mensaje: 'Notificación obtenida exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener notificación:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

// Obtener todas las notificaciones (solo admin)
const obtenerTodasNotificaciones = async (req, res) => {
    try {
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                error: 'Acceso denegado. Solo administradores'
            });
        }

        const { page = 1, limit = 50, tipo, usuario } = req.query;

        const filtros = {};
        if (tipo) filtros.tipo = tipo;
        if (usuario) filtros.usuario = usuario;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notificaciones = await Notificacion.find(filtros)
            .populate('usuario', 'nombre email')
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notificacion.countDocuments(filtros);

        res.json({
            notificaciones,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener todas las notificaciones:', error);
        res.status(500).json({
            error: 'Error interno del servidor'
        });
    }
};

module.exports = {
    crearNotificacion,
    crearNotificacionCurso,
    crearNotificacionVencimiento,
    obtenerNotificaciones,
    marcarComoLeida,
    marcarComoNoLeida,
    eliminarNotificacion,
    actualizarPreferenciasNotificacion,
    marcarTodasComoLeidas,
    obtenerNotificacionesPorTipo,
    obtenerNotificacionPorId,
    obtenerTodasNotificaciones
};
