const Exchange = require('../model/exchange.model');
const Curso = require('../model/curso.model');
const Usuario = require('../model/usuario.model');
const Notificacion = require('../model/notificacion.model');

// RF-INT-01: Solicitar intercambio (curso propio vs ajeno)
const crearExchange = async (req, res) => {
    try {
        const { cursoEmisor, cursoReceptor, duracion, comentario } = req.body;
        const emisorId = req.usuario._id;

        // Validaciones básicas
        if (!cursoEmisor || !cursoReceptor || !duracion) {
            return res.status(400).json({
                error: 'cursoEmisor, cursoReceptor y duracion son obligatorios'
            });
        }

        // Validar duración
        if (!Number.isInteger(duracion) || duracion < 1 || duracion > 365) {
            return res.status(400).json({
                error: 'La duración debe ser un número entero entre 1 y 365 días'
            });
        }

        // Verificar que los cursos existen
        const [cursoEmisorDoc, cursoReceptorDoc] = await Promise.all([
            Curso.findById(cursoEmisor),
            Curso.findById(cursoReceptor)
        ]);

        if (!cursoEmisorDoc || !cursoReceptorDoc) {
            return res.status(404).json({
                error: 'Uno o ambos cursos no existen'
            });
        }

        // Verificar que el emisor es dueño del curso emisor
        if (cursoEmisorDoc.owner.toString() !== emisorId.toString()) {
            return res.status(403).json({
                error: 'Solo puedes intercambiar cursos que te pertenezcan'
            });
        }

        // Verificar que no es el mismo curso
        if (cursoEmisor === cursoReceptor) {
            return res.status(400).json({
                error: 'No puedes intercambiar un curso consigo mismo'
            });
        }

        // Verificar que no es el mismo propietario
        if (cursoEmisorDoc.owner.toString() === cursoReceptorDoc.owner.toString()) {
            return res.status(400).json({
                error: 'No puedes intercambiar con tus propios cursos'
            });
        }

        // Verificar que no hay intercambios activos con estos cursos
        const intercambiosActivos = await Exchange.findOne({
            $or: [
                { cursoEmisor, estado: { $in: ['pendiente', 'aceptado', 'activo'] } },
                { cursoReceptor, estado: { $in: ['pendiente', 'aceptado', 'activo'] } }
            ]
        });

        if (intercambiosActivos) {
            return res.status(400).json({
                error: 'Uno de los cursos ya está en un intercambio activo'
            });
        }

        // Crear el intercambio
        const exchange = new Exchange({
            emisor: emisorId,
            receptor: cursoReceptorDoc.owner,
            cursoEmisor,
            cursoReceptor,
            duracion,
            comentarios: comentario ? [{
                usuario: emisorId,
                contenido: comentario
            }] : []
        });

        await exchange.save();

        // Crear notificación para el receptor
        try {
            const notificacion = new Notificacion({
                usuario: cursoReceptorDoc.owner,
                tipo: 'intercambio',
                titulo: 'Nueva solicitud de intercambio',
                mensaje: `${req.usuario.nombre} quiere intercambiar un curso contigo`,
                accion: {
                    tipo: 'navegar',
                    url: `/exchanges/${exchange._id}`
                }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.status(201).json({
            mensaje: 'Solicitud de intercambio creada exitosamente',
            exchange
        });

    } catch (error) {
        console.error('Error al crear intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear intercambio'
        });
    }
};

// RF-INT-03: Aceptar/Rechazar intercambio
const aceptarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const receptorId = req.usuario._id;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                error: 'Intercambio no encontrado'
            });
        }

        // Verificar que el usuario es el receptor
        if (exchange.receptor.toString() !== receptorId.toString()) {
            return res.status(403).json({
                error: 'Solo el receptor puede aceptar el intercambio'
            });
        }

        // Verificar que el estado es pendiente
        if (exchange.estado !== 'pendiente') {
            return res.status(400).json({
                error: 'Solo se pueden aceptar intercambios pendientes'
            });
        }

        // Aceptar el intercambio
        await exchange.aceptar();

        // Crear notificación para el emisor
        try {
            const notificacion = new Notificacion({
                usuario: exchange.emisor,
                tipo: 'intercambio',
                titulo: 'Intercambio aceptado',
                mensaje: `${req.usuario.nombre} ha aceptado tu intercambio`,
                accion: {
                    tipo: 'navegar',
                    url: `/exchanges/${exchange._id}`
                }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.json({
            mensaje: 'Intercambio aceptado exitosamente',
            exchange
        });

    } catch (error) {
        console.error('Error al aceptar intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al aceptar intercambio'
        });
    }
};

const rechazarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const receptorId = req.usuario._id;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                error: 'Intercambio no encontrado'
            });
        }

        // Verificar que el usuario es el receptor
        if (exchange.receptor.toString() !== receptorId.toString()) {
            return res.status(403).json({
                error: 'Solo el receptor puede rechazar el intercambio'
            });
        }

        // Verificar que el estado es pendiente
        if (exchange.estado !== 'pendiente') {
            return res.status(400).json({
                error: 'Solo se pueden rechazar intercambios pendientes'
            });
        }

        // Rechazar el intercambio
        await exchange.rechazar();

        // Agregar comentario de rechazo si se proporciona motivo
        if (motivo) {
            exchange.comentarios.push({
                usuario: receptorId,
                contenido: `Rechazado: ${motivo}`,
                fecha: new Date()
            });
            await exchange.save();
        }

        // Crear notificación para el emisor
        try {
            const notificacion = new Notificacion({
                usuario: exchange.emisor,
                tipo: 'intercambio',
                titulo: 'Intercambio rechazado',
                mensaje: `${req.usuario.nombre} ha rechazado tu intercambio`,
                accion: {
                    tipo: 'navegar',
                    url: `/exchanges/${exchange._id}`
                }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.json({
            mensaje: 'Intercambio rechazado exitosamente',
            exchange
        });

    } catch (error) {
        console.error('Error al rechazar intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al rechazar intercambio'
        });
    }
};

// RF-INT-09: Cancelar antes de aceptación
const cancelarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const emisorId = req.usuario._id;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                error: 'Intercambio no encontrado'
            });
        }

        // Verificar que el usuario es el emisor
        if (exchange.emisor.toString() !== emisorId.toString()) {
            return res.status(403).json({
                error: 'Solo el emisor puede cancelar el intercambio'
            });
        }

        // Verificar que el estado es pendiente
        if (exchange.estado !== 'pendiente') {
            return res.status(400).json({
                error: 'Solo se pueden cancelar intercambios pendientes'
            });
        }

        // Cancelar el intercambio
        await exchange.cancelar();

        // Crear notificación para el receptor
        try {
            const notificacion = new Notificacion({
                usuario: exchange.receptor,
                tipo: 'intercambio',
                titulo: 'Intercambio cancelado',
                mensaje: `${req.usuario.nombre} ha cancelado el intercambio`,
                accion: {
                    tipo: 'navegar',
                    url: `/exchanges/${exchange._id}`
                }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.json({
            mensaje: 'Intercambio cancelado exitosamente',
            exchange
        });

    } catch (error) {
        console.error('Error al cancelar intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al cancelar intercambio'
        });
    }
};

// RF-INT-04: Listar enviadas/recibidas
const obtenerExchanges = async (req, res) => {
    try {
        const { tipo, estado, page = 1, limit = 10 } = req.query;
        const usuarioId = req.usuario._id;

        // Construir filtros
        let filtros = {};
        
        if (tipo === 'enviadas') {
            filtros.emisor = usuarioId;
        } else if (tipo === 'recibidas') {
            filtros.receptor = usuarioId;
        } else {
            // Si no se especifica tipo, mostrar todos los del usuario
            filtros.$or = [{ emisor: usuarioId }, { receptor: usuarioId }];
        }

        if (estado) {
            filtros.estado = estado;
        }

        // Paginación
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const exchanges = await Exchange.find(filtros)
            .populate('emisor', 'nombre email')
            .populate('receptor', 'nombre email')
            .populate('cursoEmisor', 'titulo imagen categoria')
            .populate('cursoReceptor', 'titulo imagen categoria')
            .sort({ fechaSolicitud: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Exchange.countDocuments(filtros);

        res.json({
            exchanges,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener intercambios:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener intercambios'
        });
    }
};

// RF-INT-08: Historial de intercambios
const obtenerHistorial = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const usuarioId = req.usuario._id;

        // Solo intercambios finalizados o cancelados
        const filtros = {
            $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
            estado: { $in: ['finalizado', 'cancelado', 'rechazado'] }
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const exchanges = await Exchange.find(filtros)
            .populate('emisor', 'nombre email')
            .populate('receptor', 'nombre email')
            .populate('cursoEmisor', 'titulo imagen categoria')
            .populate('cursoReceptor', 'titulo imagen categoria')
            .sort({ fechaSolicitud: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Exchange.countDocuments(filtros);

        res.json({
            historial: exchanges,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener historial'
        });
    }
};

// Obtener intercambio por ID
const obtenerExchangePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const exchange = await Exchange.findById(id)
            .populate('emisor', 'nombre email')
            .populate('receptor', 'nombre email')
            .populate('cursoEmisor', 'titulo imagen categoria descripcion')
            .populate('cursoReceptor', 'titulo imagen categoria descripcion')
            .populate('comentarios.usuario', 'nombre');

        if (!exchange) {
            return res.status(404).json({
                error: 'Intercambio no encontrado'
            });
        }

        // Verificar que el usuario tiene acceso a este intercambio
        if (exchange.emisor.toString() !== usuarioId.toString() && 
            exchange.receptor.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para ver este intercambio'
            });
        }

        res.json({
            exchange,
            mensaje: 'Intercambio obtenido exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener intercambio'
        });
    }
};

// Actualizar intercambio
const actualizarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;
        const camposActualizados = req.body;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                error: 'Intercambio no encontrado'
            });
        }

        // Solo el emisor puede actualizar campos básicos
        if (exchange.emisor.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para actualizar este intercambio'
            });
        }

        // Solo permitir actualizar ciertos campos
        const camposPermitidos = ['comentarios', 'duracion'];
        const camposFiltrados = {};
        
        Object.keys(camposActualizados).forEach(key => {
            if (camposPermitidos.includes(key)) {
                camposFiltrados[key] = camposActualizados[key];
            }
        });

        if (camposFiltrados.duracion) {
            if (!Number.isInteger(camposFiltrados.duracion) || 
                camposFiltrados.duracion < 1 || 
                camposFiltrados.duracion > 365) {
                return res.status(400).json({
                    error: 'La duración debe ser un número entero entre 1 y 365 días'
                });
            }
        }

        const exchangeActualizado = await Exchange.findByIdAndUpdate(
            id,
            camposFiltrados,
            { new: true, runValidators: true }
        ).populate('emisor receptor cursoEmisor cursoReceptor');

        res.json({
            mensaje: 'Intercambio actualizado exitosamente',
            exchange: exchangeActualizado
        });

    } catch (error) {
        console.error('Error al actualizar intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar intercambio'
        });
    }
};

// Eliminar intercambio (solo si está cancelado o rechazado)
const eliminarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario._id;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                error: 'Intercambio no encontrado'
            });
        }

        // Solo el emisor puede eliminar
        if (exchange.emisor.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para eliminar este intercambio'
            });
        }

        // Solo permitir eliminar si está cancelado o rechazado
        if (!['cancelado', 'rechazado'].includes(exchange.estado)) {
            return res.status(400).json({
                error: 'Solo se pueden eliminar intercambios cancelados o rechazados'
            });
        }

        await Exchange.findByIdAndDelete(id);

        res.json({
            mensaje: 'Intercambio eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al eliminar intercambio'
        });
    }
};

// Agregar comentario al intercambio
const agregarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido } = req.body;
        const usuarioId = req.usuario._id;

        if (!contenido || contenido.trim().length < 3) {
            return res.status(400).json({
                error: 'El comentario debe tener al menos 3 caracteres'
            });
        }

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                error: 'Intercambio no encontrado'
            });
        }

        // Verificar que el usuario participa en el intercambio
        if (exchange.emisor.toString() !== usuarioId.toString() && 
            exchange.receptor.toString() !== usuarioId.toString()) {
            return res.status(403).json({
                error: 'No tienes permisos para comentar en este intercambio'
            });
        }

        exchange.comentarios.push({
            usuario: usuarioId,
            contenido: contenido.trim(),
            fecha: new Date()
        });

        await exchange.save();

        res.json({
            mensaje: 'Comentario agregado exitosamente',
            exchange
        });

    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({
            error: 'Error interno del servidor al agregar comentario'
        });
    }
};

module.exports = {
    crearExchange,
    aceptarExchange,
    rechazarExchange,
    cancelarExchange,
    obtenerExchanges,
    obtenerHistorial,
    obtenerExchangePorId,
    actualizarExchange,
    eliminarExchange,
    agregarComentario
};
