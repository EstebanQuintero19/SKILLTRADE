const Notificacion = require('../model/notificacion.model');
const Usuario = require('../model/usuario.model');
const logger = require('../logger');


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

        logger.info('Notificación creada exitosamente', { 
            notificacionId: notificacion._id,
            tipo: notificacion.tipo,
            usuario: notificacion.usuario
        });

        res.status(201).json({
            mensaje: 'Notificación creada exitosamente',
            notificacion
        });

    } catch (error) {
        logger.error('Error al crear notificación', { 
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({
            error: 'Error interno del servidor al crear notificación'
        });
    }
};

// RF-NOT-02: Alertas de cursos (suscripciones)
/**
 * Crea una notificación relacionada con un curso
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const crearNotificacionCurso = async (req, res) => {
    try {
        const { cursoId, tipo = 'curso', titulo, mensaje, usuarios = [] } = req.body;
        
        // Validaciones básicas
        if (!cursoId || !titulo || !mensaje) {
            logger.warn('Faltan campos obligatorios en la solicitud', { 
                body: req.body 
            });
            return res.status(400).json({
                error: 'cursoId, titulo y mensaje son obligatorios'
            });
        }
        
        logger.debug('Iniciando creación de notificación de curso', {
            cursoId,
            tipo,
            titulo,
            totalUsuarios: usuarios.length
        });

        if (!cursoId || !tipo || !titulo || !mensaje) {
            return res.status(400).json({
                error: 'cursoId, tipo, titulo y mensaje son obligatorios'
            });
        }

        // Obtener usuarios suscritos al curso si no se especifican usuarios
        const usuariosANotificar = usuarios.length > 0 
            ? await Usuario.find({ _id: { $in: usuarios } })
            : await Usuario.find({ 'cursos.curso': cursoId });

        if (usuariosANotificar.length === 0) {
            logger.warn('No se encontraron usuarios para notificar', { cursoId });
            return res.status(404).json({
                error: 'No se encontraron usuarios para notificar'
            });
        }

        // Crear notificación para cada usuario
        const notificaciones = usuariosANotificar.map(usuario => ({
            usuario: usuario._id,
            tipo,
            titulo,
            mensaje,
            accion: `/cursos/${cursoId}`,
            prioridad: 'media',
            metadata: { cursoId }
        }));

        await Notificacion.insertMany(notificaciones);
        
        logger.info('Notificaciones de curso creadas exitosamente', {
            cursoId,
            totalNotificaciones: notificaciones.length,
            tipoNotificacion: tipo
        });

        res.status(201).json({
            mensaje: 'Notificaciones de curso creadas exitosamente',
            total: notificaciones.length
        });

    } catch (error) {
        logger.error('Error al crear notificaciones de curso', {
            error: error.message,
            stack: error.stack,
            cursoId: req.body.cursoId,
            tipo: req.body.tipo
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al crear notificaciones de curso',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// RF-NOT-03: Vencimientos (intercambios/suscripciones)
/**
 * Crea notificaciones de vencimiento para intercambios o suscripciones
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const crearNotificacionVencimiento = async (req, res) => {
    try {
        const { tipo, diasAntes = 7 } = req.body;

        // Validar tipo de vencimiento
        if (!tipo || !['intercambio', 'suscripcion'].includes(tipo)) {
            logger.warn('Tipo de vencimiento no válido', { 
                tipo,
                body: req.body 
            });
            return res.status(400).json({
                error: 'Tipo debe ser intercambio o suscripcion'
            });
        }
        
        logger.info(`Iniciando creación de notificaciones de vencimiento para ${tipo}`, {
            diasAntes,
            fechaActual: new Date()
        });

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
            logger.info('Notificaciones de vencimiento creadas', {
                tipo,
                cantidad: notificaciones.length,
                fecha: new Date()
            });
        } else {
            logger.info('No se encontraron elementos próximos a vencer', { tipo });
        }

        res.json({
            mensaje: 'Notificaciones de vencimiento creadas exitosamente',
            notificacionesCreadas: notificaciones.length,
            tipo,
            fechaProceso: new Date()
        });

    } catch (error) {
        logger.error('Error al crear notificaciones de vencimiento', {
            error: error.message,
            stack: error.stack,
            tipo: req.body.tipo,
            fechaError: new Date()
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al crear notificaciones de vencimiento',
            detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Obtiene las notificaciones del usuario con filtros y paginación
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const obtenerNotificaciones = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { 
            tipo, 
            leida, 
            prioridad,
            page = 1, 
            limit = 20,
            desde,
            hasta
        } = req.query;

        // Validar parámetros de paginación
        const pagina = Math.max(1, parseInt(page) || 1);
        const porPagina = Math.min(50, Math.max(1, parseInt(limit) || 20));
        const skip = (pagina - 1) * porPagina;

        // Construir filtros
        const filtros = { usuario: usuarioId };
        
        if (tipo) {
            const tiposPermitidos = ['intercambio', 'curso', 'suscripcion', 'sistema', 'venta'];
            if (tiposPermitidos.includes(tipo)) {
                filtros.tipo = tipo;
            } else {
                logger.warn('Tipo de notificación no válido', { tipo, usuarioId });
                return res.status(400).json({
                    error: `Tipo de notificación no válido. Tipos permitidos: ${tiposPermitidos.join(', ')}`
                });
            }
        }
        
        if (leida !== undefined) {
            filtros.leida = leida === 'true';
        }
        
        if (prioridad && ['baja', 'media', 'alta'].includes(prioridad)) {
            filtros.prioridad = prioridad;
        }

        // Filtro por rango de fechas
        if (desde || hasta) {
            filtros.fechaCreacion = {};
            if (desde) {
                const fechaDesde = new Date(desde);
                if (!isNaN(fechaDesde.getTime())) {
                    filtros.fechaCreacion.$gte = fechaDesde;
                }
            }
            if (hasta) {
                const fechaHasta = new Date(hasta);
                if (!isNaN(fechaHasta.getTime())) {
                    filtros.fechaCreacion.$lte = fechaHasta;
                }
            }
        }

        logger.debug('Obteniendo notificaciones', { 
            usuarioId,
            filtros,
            pagina,
            porPagina
        });

        // Obtener notificaciones con paginación
        const [notificaciones, total, noLeidas] = await Promise.all([
            Notificacion.find(filtros)
                .sort({ fechaCreacion: -1 })
                .skip(skip)
                .limit(porPagina)
                .lean(),
            Notificacion.countDocuments(filtros),
            Notificacion.countDocuments({ 
                usuario: usuarioId, 
                leida: false 
            })
        ]);

        const totalPaginas = Math.ceil(total / porPagina);

        // Log de métricas (sin datos sensibles)
        logger.info('Notificaciones obtenidas', {
            total,
            paginaActual: pagina,
            totalPaginas,
            porPagina,
            noLeidas,
            usuarioId: usuarioId.toString()
        });

        // Configurar headers de paginación
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        const links = {
            first: `${baseUrl}?page=1&limit=${porPagina}`,
            last: `${baseUrl}?page=${totalPaginas}&limit=${porPagina}`,
        };
        
        if (pagina > 1) {
            links.prev = `${baseUrl}?page=${pagina - 1}&limit=${porPagina}`;
        }
        
        if (pagina < totalPaginas) {
            links.next = `${baseUrl}?page=${pagina + 1}&limit=${porPagina}`;
        }

        res.set({
            'X-Total-Count': total,
            'X-Total-Pages': totalPaginas,
            'X-Current-Page': pagina,
            'X-Per-Page': porPagina,
            'X-Unread-Count': noLeidas,
            'Link': Object.entries(links)
                .map(([rel, url]) => `<${url}>; rel="${rel}"`)
                .join(', ')
        });

        res.json({
            data: notificaciones,
            meta: {
                pagination: {
                    currentPage: pagina,
                    totalPages: totalPaginas,
                    totalItems: total,
                    itemsPerPage: porPagina,
                    unreadCount: noLeidas
                },
                links
            }
        });

    } catch (error) {
        logger.error('Error al obtener notificaciones', {
            error: error.message,
            stack: error.stack,
            usuarioId: req.usuario?._id,
            query: req.query
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al obtener notificaciones',
            ...(process.env.NODE_ENV === 'development' && { 
                detalle: error.message,
                stack: error.stack 
            })
        });
    }
};

/**
 * Marca una notificación como leída
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const marcarComoLeida = async (req, res) => {
    const session = await Notificacion.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;
        
        // Validar ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('ID de notificación no válido', { 
                id, 
                usuarioId: usuarioId.toString() 
            });
            return res.status(400).json({
                error: 'ID de notificación no válido'
            });
        }

        logger.debug('Intentando marcar notificación como leída', {
            notificacionId: id,
            usuarioId: usuarioId.toString()
        });

        // Buscar y actualizar en una sola operación atómica
        const notificacion = await Notificacion.findOneAndUpdate(
            { 
                _id: id,
                usuario: usuarioId,
                leida: false // Solo marcar como leída si no lo está ya
            },
            { 
                $set: { 
                    leida: true, 
                    fechaLectura: new Date(),
                    ultimaActualizacion: new Date()
                } 
            },
            { 
                new: true,
                session 
            }
        );

        if (!notificacion) {
            // Verificar si la notificación existe pero ya está marcada como leída
            const notificacionExistente = await Notificacion.findOne({
                _id: id,
                usuario: usuarioId
            }).session(session);

            if (!notificacionExistente) {
                logger.warn('Intento de marcar notificación inexistente o no autorizada', { 
                    notificacionId: id,
                    usuarioId: usuarioId.toString()
                });
                return res.status(404).json({
                    error: 'Notificación no encontrada o no tienes permisos para modificarla'
                });
            }

            logger.info('Notificación ya estaba marcada como leída', {
                notificacionId: id,
                usuarioId: usuarioId.toString()
            });

            await session.commitTransaction();
            return res.json({
                mensaje: 'La notificación ya estaba marcada como leída',
                notificacion: notificacionExistente,
                yaEstabaLeida: true
            });
        }

        // Actualizar contador de no leídas en el usuario (si es necesario)
        await Usuario.findByIdAndUpdate(
            usuarioId,
            { 
                $inc: { 'contadores.notificacionesNoLeidas': -1 },
                $set: { ultimaActualizacion: new Date() }
            },
            { session }
        );

        await session.commitTransaction();
        
        logger.info('Notificación marcada como leída exitosamente', {
            notificacionId: notificacion._id,
            tipo: notificacion.tipo,
            usuarioId: usuarioId.toString()
        });

        // Emitir evento de notificación leída (si se usa WebSocket)
        // this.emit('notificacion:leida', { notificacionId: notificacion._id, usuarioId });

        res.json({
            mensaje: 'Notificación marcada como leída exitosamente',
            notificacion,
            yaEstabaLeida: false
        });

    } catch (error) {
        await session.abortTransaction();
        
        logger.error('Error al marcar notificación como leída', {
            error: error.message,
            stack: error.stack,
            notificacionId: req.params.id,
            usuarioId: req.usuario?._id?.toString()
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al marcar notificación como leída',
            ...(process.env.NODE_ENV === 'development' && { 
                detalle: error.message
            })
        });
    } finally {
        session.endSession();
    }
};

/**
 * Marca una notificación como no leída
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const marcarComoNoLeida = async (req, res) => {
    const session = await Notificacion.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;
        
        // Validar ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('ID de notificación no válido', { 
                id, 
                usuarioId: usuarioId.toString() 
            });
            return res.status(400).json({
                error: 'ID de notificación no válido'
            });
        }

        logger.debug('Intentando marcar notificación como no leída', {
            notificacionId: id,
            usuarioId: usuarioId.toString()
        });

        // Buscar y actualizar en una sola operación atómica
        const notificacion = await Notificacion.findOneAndUpdate(
            { 
                _id: id,
                usuario: usuarioId,
                leida: true // Solo marcar como no leída si estaba leída
            },
            { 
                $set: { 
                    leida: false, 
                    fechaLectura: null,
                    ultimaActualizacion: new Date()
                } 
            },
            { 
                new: true,
                session 
            }
        );

        if (!notificacion) {
            // Verificar si la notificación existe pero ya estaba como no leída
            const notificacionExistente = await Notificacion.findOne({
                _id: id,
                usuario: usuarioId
            }).session(session);

            if (!notificacionExistente) {
                logger.warn('Intento de marcar notificación inexistente o no autorizada', { 
                    notificacionId: id,
                    usuarioId: usuarioId.toString()
                });
                return res.status(404).json({
                    error: 'Notificación no encontrada o no tienes permisos para modificarla'
                });
            }

            logger.info('Notificación ya estaba marcada como no leída', {
                notificacionId: id,
                usuarioId: usuarioId.toString()
            });

            await session.commitTransaction();
            return res.json({
                mensaje: 'La notificación ya estaba marcada como no leída',
                notificacion: notificacionExistente,
                yaEstabaNoLeida: true
            });
        }

        // Actualizar contador de no leídas en el usuario
        await Usuario.findByIdAndUpdate(
            usuarioId,
            { 
                $inc: { 'contadores.notificacionesNoLeidas': 1 },
                $set: { ultimaActualizacion: new Date() }
            },
            { session }
        );

        await session.commitTransaction();
        
        logger.info('Notificación marcada como no leída exitosamente', {
            notificacionId: notificacion._id,
            tipo: notificacion.tipo,
            usuarioId: usuarioId.toString()
        });

        res.json({
            mensaje: 'Notificación marcada como no leída exitosamente',
            notificacion,
            yaEstabaNoLeida: false
        });

    } catch (error) {
        await session.abortTransaction();
        
        logger.error('Error al marcar notificación como no leída', {
            error: error.message,
            stack: error.stack,
            notificacionId: req.params.id,
            usuarioId: req.usuario?._id?.toString()
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al marcar notificación como no leída',
            ...(process.env.NODE_ENV === 'development' && { 
                detalle: error.message
            })
        });
    } finally {
        session.endSession();
    }
};

/**
 * Elimina una notificación
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const eliminarNotificacion = async (req, res) => {
    const session = await Notificacion.startSession();
    session.startTransaction();
    
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;
        const esAdmin = req.usuario.rol === 'admin';
        
        // Validar ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('ID de notificación no válido', { 
                id, 
                usuarioId: usuarioId.toString(),
                esAdmin
            });
            return res.status(400).json({
                error: 'ID de notificación no válido'
            });
        }

        logger.debug('Iniciando eliminación de notificación', {
            notificacionId: id,
            usuarioId: usuarioId.toString(),
            esAdmin
        });

        // Buscar la notificación con bloqueo para evitar condiciones de carrera
        const notificacion = await Notificacion.findOne({
            _id: id
        }).session(session);

        // Verificar si la notificación existe
        if (!notificacion) {
            logger.warn('Intento de eliminar notificación inexistente', { 
                notificacionId: id,
                usuarioId: usuarioId.toString()
            });
            await session.abortTransaction();
            return res.status(404).json({
                error: 'Notificación no encontrada'
            });
        }

        // Verificar permisos (solo el dueño o un admin pueden eliminar)
        const esPropietario = notificacion.usuario.toString() === usuarioId.toString();
        if (!esPropietario && !esAdmin) {
            logger.warn('Intento de eliminar notificación no autorizado', { 
                notificacionId: id,
                usuarioSolicitante: usuarioId.toString(),
                duenoNotificacion: notificacion.usuario.toString()
            });
            await session.abortTransaction();
            return res.status(403).json({
                error: 'No tienes permisos para eliminar esta notificación'
            });
        }

        // Actualizar contador de no leídas si es necesario
        if (!notificacion.leida) {
            await Usuario.findByIdAndUpdate(
                notificacion.usuario,
                { 
                    $inc: { 'contadores.notificacionesNoLeidas': -1 },
                    $set: { ultimaActualizacion: new Date() }
                },
                { session }
            );
        }

        // Eliminar la notificación
        await Notificacion.deleteOne({ _id: id }).session(session);
        
        await session.commitTransaction();
        
        logger.info('Notificación eliminada exitosamente', {
            notificacionId: id,
            tipo: notificacion.tipo,
            usuarioId: notificacion.usuario.toString(),
            eliminadoPorAdmin: esAdmin && !esPropietario,
            timestamp: new Date()
        });

        res.json({
            mensaje: 'Notificación eliminada exitosamente',
            notificacionId: id,
            eliminado: true,
            timestamp: new Date()
        });

    } catch (error) {
        await session.abortTransaction();
        
        logger.error('Error al eliminar notificación', {
            error: error.message,
            stack: error.stack,
            notificacionId: req.params.id,
            usuarioId: req.usuario?._id?.toString(),
            esAdmin: req.usuario?.rol === 'admin'
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al eliminar notificación',
            ...(process.env.NODE_ENV === 'development' && { 
                detalle: error.message
            })
        });
    } finally {
        session.endSession();
    }
};

/**
 * Actualiza las preferencias de notificación del usuario
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const actualizarPreferenciasNotificacion = async (req, res) => {
    const session = await Usuario.startSession();
    session.startTransaction();
    
    try {
        const usuarioId = req.usuario._id;
        const { email, inapp, push, canales } = req.body;
        
        // Validar que al menos se proporcione un campo para actualizar
        if (email === undefined && inapp === undefined && push === undefined && !canales) {
            logger.warn('Intento de actualizar preferencias sin campos', {
                usuarioId: usuarioId.toString(),
                body: req.body
            });
            return res.status(400).json({
                error: 'Debe proporcionar al menos un campo para actualizar (email, inapp, push o canales)'
            });
        }

        logger.debug('Iniciando actualización de preferencias de notificación', {
            usuarioId: usuarioId.toString(),
            camposSolicitados: {
                email: email !== undefined,
                inapp: inapp !== undefined,
                push: push !== undefined,
                canales: !!canales
            }
        });

        // Verificar si el usuario existe
        const usuario = await Usuario.findById(usuarioId).session(session);
        if (!usuario) {
            logger.warn('Usuario no encontrado al actualizar preferencias', {
                usuarioId: usuarioId.toString()
            });
            await session.abortTransaction();
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Preparar objeto de actualización
        const actualizacion = { 
            ultimaActualizacion: new Date() 
        };
        
        // Actualizar preferencias individuales si se proporcionan
        if (email !== undefined || inapp !== undefined || push !== undefined) {
            actualizacion.preferenciasNotificacion = {
                ...usuario.preferenciasNotificacion.toObject(),
                ...(email !== undefined && { email }),
                ...(inapp !== undefined && { inapp }),
                ...(push !== undefined && { push })
            };
        }
        
        // Actualizar canales específicos si se proporcionan
        if (canales && typeof canales === 'object') {
            actualizacion.preferenciasNotificacion = {
                ...(usuario.preferenciasNotificacion?.toObject() || {}),
                canales: {
                    ...(usuario.preferenciasNotificacion?.canales || {}),
                    ...canales
                }
            };
            
            // Validar estructura de canales
            if (actualizacion.preferenciasNotificacion.canales) {
                for (const [canal, config] of Object.entries(actualizacion.preferenciasNotificacion.canales)) {
                    if (config && typeof config === 'object' && 'activo' in config) {
                        // Validar que 'activo' sea booleano
                        if (typeof config.activo !== 'boolean') {
                            logger.warn('Configuración de canal inválida', {
                                canal,
                                config,
                                usuarioId: usuarioId.toString()
                            });
                            await session.abortTransaction();
                            return res.status(400).json({
                                error: `La propiedad 'activo' del canal '${canal}' debe ser un valor booleano`
                            });
                        }
                    } else {
                        // Si no tiene la estructura esperada, convertir a booleano si es posible
                        actualizacion.preferenciasNotificacion.canales[canal] = {
                            activo: Boolean(config)
                        };
                    }
                }
            }
        }

        // Aplicar actualización
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            usuarioId,
            { $set: actualizacion },
            { 
                new: true, 
                runValidators: true,
                session,
                // Solo devolver los campos necesarios
                projection: { 
                    preferenciasNotificacion: 1,
                    ultimaActualizacion: 1 
                }
            }
        );

        await session.commitTransaction();
        
        logger.info('Preferencias de notificación actualizadas exitosamente', {
            usuarioId: usuarioId.toString(),
            preferenciasActualizadas: Object.keys(usuarioActualizado.preferenciasNotificacion.toObject())
        });

        res.json({
            mensaje: 'Preferencias de notificación actualizadas exitosamente',
            preferencias: usuarioActualizado.preferenciasNotificacion,
            actualizado: new Date()
        });

    } catch (error) {
        await session.abortTransaction();
        
        logger.error('Error al actualizar preferencias de notificación', {
            error: error.message,
            stack: error.stack,
            usuarioId: req.usuario?._id?.toString(),
            body: req.body
        });
        
        // Manejar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => ({
                campo: err.path,
                mensaje: err.message
            }));
            
            return res.status(400).json({
                error: 'Error de validación',
                errores
            });
        }
        
        res.status(500).json({
            error: 'Error interno del servidor al actualizar preferencias',
            ...(process.env.NODE_ENV === 'development' && { 
                detalle: error.message
            })
        });
    } finally {
        session.endSession();
    }
};

/**
 * Marca todas las notificaciones no leídas de un usuario como leídas
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const marcarTodasComoLeidas = async (req, res) => {
    const session = await Notificacion.startSession();
    session.startTransaction();
    
    try {
        const usuarioId = req.usuario._id;
        const ahora = new Date();
        
        logger.debug('Iniciando marcado masivo de notificaciones como leídas', {
            usuarioId: usuarioId.toString(),
            timestamp: ahora
        });

        // 1. Obtener el conteo actual de notificaciones no leídas
        const conteoNoLeidas = await Notificacion.countDocuments({
            usuario: usuarioId,
            leida: false
        }).session(session);

        // Si no hay notificaciones no leídas, retornar inmediatamente
        if (conteoNoLeidas === 0) {
            await session.commitTransaction();
            logger.info('No se encontraron notificaciones por marcar como leídas', {
                usuarioId: usuarioId.toString()
            });
            
            return res.json({
                mensaje: 'No hay notificaciones pendientes por marcar como leídas',
                notificacionesActualizadas: 0,
                yaEstabanLeidas: true
            });
        }

        // 2. Actualizar todas las notificaciones no leídas
        const resultado = await Notificacion.updateMany(
            { 
                usuario: usuarioId, 
                leida: false 
            },
            { 
                $set: { 
                    leida: true, 
                    fechaLectura: ahora,
                    ultimaActualizacion: ahora
                } 
            },
            { session }
        );

        // 3. Actualizar el contador de notificaciones no leídas del usuario
        await Usuario.findByIdAndUpdate(
            usuarioId,
            { 
                $set: { 
                    'contadores.notificacionesNoLeidas': 0,
                    ultimaActualizacion: ahora
                }
            },
            { session }
        );

        await session.commitTransaction();
        
        logger.info('Todas las notificaciones marcadas como leídas exitosamente', {
            usuarioId: usuarioId.toString(),
            notificacionesActualizadas: resultado.modifiedCount,
            timestamp: ahora
        });

        // Emitir evento de notificaciones leídas (si se usa WebSocket)
        // this.emit('notificaciones:leidas', { 
        //     usuarioId, 
        //     cantidad: resultado.modifiedCount 
        // });

        res.json({
            mensaje: 'Todas las notificaciones han sido marcadas como leídas',
            notificacionesActualizadas: resultado.modifiedCount,
            timestamp: ahora,
            yaEstabanLeidas: false
        });

    } catch (error) {
        await session.abortTransaction();
        
        logger.error('Error al marcar todas las notificaciones como leídas', {
            error: error.message,
            stack: error.stack,
            usuarioId: req.usuario?._id?.toString()
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al marcar notificaciones como leídas',
            ...(process.env.NODE_ENV === 'development' && { 
                detalle: error.message
            })
        });
    } finally {
        session.endSession();
    }
};

/**
 * Obtiene notificaciones filtradas por tipo con paginación
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const obtenerNotificacionesPorTipo = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { tipo } = req.params;
        const { 
            page = 1, 
            limit = 20, 
            leida,
            prioridad,
            desde,
            hasta,
            sortBy = 'fechaCreacion',
            sortOrder = 'desc'
        } = req.query;

        // Validar tipo de notificación
        const tiposPermitidos = ['intercambio', 'curso', 'suscripcion', 'sistema', 'venta'];
        if (!tiposPermitidos.includes(tipo)) {
            logger.warn('Tipo de notificación no válido', { 
                tipoSolicitado: tipo,
                tiposPermitidos,
                usuarioId: usuarioId.toString()
            });
            return res.status(400).json({
                error: `Tipo de notificación no válido. Tipos permitidos: ${tiposPermitidos.join(', ')}`
            });
        }

        // Validar y parsear parámetros de paginación
        const pagina = Math.max(1, parseInt(page) || 1);
        const porPagina = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const saltar = (pagina - 1) * porPagina;
        
        // Validar ordenamiento
        const camposOrdenables = ['fechaCreacion', 'prioridad', 'leida'];
        const ordenValido = ['asc', 'desc'].includes(sortOrder.toLowerCase());
        const campoOrden = camposOrdenables.includes(sortBy) ? sortBy : 'fechaCreacion';
        const orden = ordenValido ? sortOrder.toLowerCase() : 'desc';

        // Construir objeto de ordenamiento
        const ordenamiento = { [campoOrden]: orden === 'asc' ? 1 : -1 };
        
        // Construir filtros
        const filtros = { 
            usuario: usuarioId,
            tipo
        };

        // Filtros opcionales
        if (leida !== undefined) {
            filtros.leida = leida === 'true';
        }
        
        if (prioridad && ['baja', 'media', 'alta'].includes(prioridad)) {
            filtros.prioridad = prioridad;
        }

        // Filtrar por rango de fechas
        if (desde || hasta) {
            filtros.fechaCreacion = {};
            if (desde) {
                const fechaDesde = new Date(desde);
                if (!isNaN(fechaDesde.getTime())) {
                    filtros.fechaCreacion.$gte = fechaDesde;
                }
            }
            if (hasta) {
                const fechaHasta = new Date(hasta);
                if (!isNaN(fechaHasta.getTime())) {
                    filtros.fechaCreacion.$lte = fechaHasta;
                }
            }
        }

        logger.debug('Buscando notificaciones por tipo', {
            tipo,
            filtros,
            pagina,
            porPagina,
            ordenamiento
        });

        // Ejecutar consultas en paralelo para mejor rendimiento
        const [notificaciones, total, noLeidas] = await Promise.all([
            Notificacion.find(filtros)
                .sort(ordenamiento)
                .skip(saltar)
                .limit(porPagina)
                .lean(),
            Notificacion.countDocuments(filtros),
            Notificacion.countDocuments({ 
                usuario: usuarioId, 
                leida: false,
                tipo
            })
        ]);

        const totalPaginas = Math.ceil(total / porPagina);

        // Configurar enlaces de paginación (HATEOAS)
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
        const queryParams = new URLSearchParams({
            ...(leida !== undefined && { leida }),
            ...(prioridad && { prioridad }),
            ...(desde && { desde }),
            ...(hasta && { hasta }),
            sortBy,
            sortOrder: orden,
            limit: porPagina
        }).toString();

        const links = {
            first: `${baseUrl}?page=1&${queryParams}`,
            last: `${baseUrl}?page=${totalPaginas}&${queryParams}`,
            self: `${baseUrl}?page=${pagina}&${queryParams}`
        };
        
        if (pagina > 1) {
            links.prev = `${baseUrl}?page=${pagina - 1}&${queryParams}`;
        }
        
        if (pagina < totalPaginas) {
            links.next = `${baseUrl}?page=${pagina + 1}&${queryParams}`;
        }

        // Configurar headers de respuesta
        res.set({
            'X-Total-Count': total,
            'X-Total-Pages': totalPaginas,
            'X-Current-Page': pagina,
            'X-Per-Page': porPagina,
            'X-Unread-Count': noLeidas,
            'Link': Object.entries(links)
                .map(([rel, url]) => `<${url}>; rel="${rel}"`)
                .join(', ')
        });

        logger.info('Notificaciones por tipo obtenidas exitosamente', {
            tipo,
            total,
            paginaActual: pagina,
            totalPaginas,
            porPagina,
            noLeidas,
            usuarioId: usuarioId.toString()
        });

        // Respuesta estructurada
        res.json({
            tipo,
            data: notificaciones,
            meta: {
                pagination: {
                    currentPage: pagina,
                    totalPages: totalPaginas,
                    totalItems: total,
                    itemsPerPage: porPagina,
                    unreadCount: noLeidas
                },
                filter: {
                    leida: leida !== undefined ? leida === 'true' : 'all',
                    prioridad: prioridad || 'all',
                    dateRange: {
                        desde: desde || null,
                        hasta: hasta || null
                    }
                },
                sort: {
                    by: campoOrden,
                    order: orden
                },
                links
            }
        });

    } catch (error) {
        logger.error('Error al obtener notificaciones por tipo', {
            error: error.message,
            stack: error.stack,
            tipo: req.params.tipo,
            query: req.query,
            usuarioId: req.usuario?._id?.toString()
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al obtener notificaciones',
            ...(process.env.NODE_ENV === 'development' && { 
                detalle: error.message
            })
        });
    }
};

/**
 * Obtiene una notificación específica por su ID
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 */
const obtenerNotificacionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;
        const esAdmin = req.usuario.rol === 'admin';
        
        // Validar ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            logger.warn('ID de notificación no válido', { 
                id, 
                usuarioId: usuarioId.toString(),
                esAdmin
            });
            return res.status(400).json({
                error: 'ID de notificación no válido'
            });
        }

        logger.debug('Buscando notificación por ID', {
            notificacionId: id,
            usuarioId: usuarioId.toString(),
            esAdmin
        });

        // Buscar notificación con proyección para optimizar
        const notificacion = await Notificacion.findById(id)
            .select('usuario tipo titulo mensaje leida prioridad fechaCreacion fechaLectura metadata')
            .lean();

        // Verificar si la notificación existe
        if (!notificacion) {
            logger.warn('Notificación no encontrada', { 
                notificacionId: id,
                usuarioId: usuarioId.toString()
            });
            return res.status(404).json({
                error: 'Notificación no encontrada',
                notificacionId: id
            });
        }

        // Verificar permisos (solo el dueño o un admin pueden ver)
        const esPropietario = notificacion.usuario.toString() === usuarioId.toString();
        if (!esPropietario && !esAdmin) {
            logger.warn('Intento de acceso no autorizado a notificación', { 
                notificacionId: id,
                usuarioSolicitante: usuarioId.toString(),
                duenoNotificacion: notificacion.usuario.toString()
            });
            return res.status(403).json({
                error: 'No tienes permisos para ver esta notificación',
                notificacionId: id
            });
        }

        // Si la notificación no está leída, marcarla como leída
        if (!notificacion.leida && esPropietario) {
            try {
                await Notificacion.findByIdAndUpdate(id, { 
                    $set: { 
                        leida: true, 
                        fechaLectura: new Date(),
                        ultimaActualizacion: new Date()
                    } 
                });
                
                // Actualizar contador de no leídas
                await Usuario.findByIdAndUpdate(
                    usuarioId,
                    { $inc: { 'contadores.notificacionesNoLeidas': -1 } }
                );
                
                // Actualizar el estado en la respuesta
                notificacion.leida = true;
                notificacion.fechaLectura = new Date();
                
                logger.debug('Notificación marcada como leída al consultarla', {
                    notificacionId: id,
                    usuarioId: usuarioId.toString()
                });
            } catch (updateError) {
                logger.error('Error al marcar notificación como leída', {
                    error: updateError.message,
                    notificacionId: id,
                    usuarioId: usuarioId.toString()
                });
                // No fallar la petición por este error
            }
        }

        // Registrar acceso exitoso
        logger.info('Notificación obtenida exitosamente', {
            notificacionId: id,
            tipo: notificacion.tipo,
            usuarioId: usuarioId.toString(),
            esAdmin,
            fueMarcadaComoLeida: !notificacion.leida && esPropietario
        });

        // Configurar headers de caché
        const unMinuto = 60; // segundos
        const unaHora = unMinuto * 60;
        
        res.set({
            'Cache-Control': `public, max-age=${unaHora}, s-maxage=${unaHora}`,
            'ETag': `"${notificacion._id.toString()}-${notificacion.ultimaActualizacion?.getTime() || '0'}"`,
            'Last-Modified': notificacion.ultimaActualizacion?.toUTCString() || new Date().toUTCString()
        });

        // Si el cliente ya tiene la versión más reciente, devolver 304
        if (req.fresh) {
            return res.status(304).end();
        }

        // Respuesta exitosa
        res.json({
            data: notificacion,
            meta: {
                id: notificacion._id,
                tipo: notificacion.tipo,
                leida: notificacion.leida,
                prioridad: notificacion.prioridad,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error al obtener notificación por ID', {
            error: error.message,
            stack: error.stack,
            notificacionId: req.params.id,
            usuarioId: req.usuario?._id?.toString(),
            esAdmin: req.usuario?.rol === 'admin'
        });
        
        res.status(500).json({
            error: 'Error interno del servidor al obtener la notificación',
            notificacionId: req.params.id,
            ...(process.env.NODE_ENV === 'development' && { 
                detalle: error.message
            })
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
