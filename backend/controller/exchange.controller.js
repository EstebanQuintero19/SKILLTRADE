const Exchange = require('../model/exchange.model');
const Curso = require('../model/curso.model');
const Usuario = require('../model/usuario.model');
const Notificacion = require('../model/notificacion.model');

// RF-INT-01: Solicitar intercambio (curso propio vs ajeno)
const crearExchange = async (req, res) => {
    try {
        const { cursoEmisor, cursoReceptor, duracion: durRaw, comentario } = req.body;

        // 0) Auth presente
        if (!req.usuario || !req.usuario.id) {
            return res.status(401).json({ error: 'Falta autenticación (x-api-key)' });
        }
        const emisorId = req.usuario.id;

        // 1) Validaciones básicas
        if (!cursoEmisor || !cursoReceptor || durRaw === undefined) {
            return res.status(400).json({ error: 'cursoEmisor, cursoReceptor y duracion son obligatorios' });
        }
        const duracion = Number(durRaw);
        if (!Number.isInteger(duracion) || duracion < 1 || duracion > 365) {
            return res.status(400).json({ error: 'La duración debe ser un número entero entre 1 y 365 días' });
        }
        if (String(cursoEmisor) === String(cursoReceptor)) {
            return res.status(400).json({ error: 'No puedes intercambiar un curso consigo mismo' });
        }

        // 2) Cargar solo owner de ambos cursos
        const [cursoEmisorDoc, cursoReceptorDoc] = await Promise.all([
            Curso.findById(cursoEmisor).select('owner'),
            Curso.findById(cursoReceptor).select('owner'),
        ]);

        if (!cursoEmisorDoc) return res.status(404).json({ error: 'Curso emisor no existe' });
        if (!cursoReceptorDoc) return res.status(404).json({ error: 'Curso receptor no existe' });

        if (!cursoEmisorDoc.owner) {
            return res.status(422).json({ error: 'El curso emisor no tiene owner asignado' });
        }
        if (!cursoReceptorDoc.owner) {
            return res.status(422).json({ error: 'El curso receptor no tiene owner asignado' });
        }

        // 3) Verificaciones de propiedad
        if (!cursoEmisorDoc.owner.equals(emisorId)) {
            return res.status(403).json({ error: 'Solo puedes intercambiar cursos que te pertenezcan' });
        }
        if (cursoEmisorDoc.owner.equals(cursoReceptorDoc.owner)) {
            return res.status(400).json({ error: 'No puedes intercambiar con tus propios cursos' });
        }

        // 4) Choques con intercambios activos (simétrico)
        const conflicto = await Exchange.findOne({
            estado: { $in: ['pendiente', 'aceptado', 'activo'] },
            $or: [
                { cursoEmisor },
                { cursoReceptor: cursoEmisor },
                { cursoEmisor: cursoReceptor },
                { cursoReceptor }
            ]
        });
        if (conflicto) {
            return res.status(400).json({ error: 'Uno de los cursos ya está en un intercambio activo' });
        }

        // 5) Crear intercambio
        const exchange = new Exchange({
            emisor: emisorId,
            receptor: cursoReceptorDoc.owner,
            cursoEmisor,
            cursoReceptor,
            duracion,
            comentarios: comentario ? [{ usuario: emisorId, contenido: comentario }] : []
        });

        await exchange.save();

        // Crear notificación para el receptor
        try {
            const notificacion = new Notificacion({
                usuario: cursoReceptorDoc.owner,
                tipo: 'intercambio',
                titulo: 'Nueva solicitud de intercambio',
                mensaje: `Tienes una nueva solicitud de intercambio de curso`,
                datos: {
                    exchangeId: exchange._id,
                    cursoEmisor: cursoEmisor,
                    cursoReceptor: cursoReceptor
                }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        return res.status(201).json({
            success: true,
            mensaje: 'Solicitud de intercambio creada exitosamente',
            data: { exchange }
        });

    } catch (error) {
        console.error('Error al crear intercambio:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor al crear intercambio'
        });
    }
};

// RF-INT-03: Aceptar intercambio
const aceptarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const { fechaInicio } = req.body;
        const receptorId = req.usuario.id;

        if (!fechaInicio) {
            return res.status(400).json({
                success: false,
                message: 'Fecha de inicio es requerida'
            });
        }

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Intercambio no encontrado'
            });
        }

        if (exchange.receptor.toString() !== receptorId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el receptor puede aceptar el intercambio'
            });
        }

        if (exchange.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden aceptar intercambios pendientes'
            });
        }

        // Calcular fecha de fin basada en la duración
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + exchange.duracion);

        exchange.estado = 'activo';
        exchange.fechaInicio = fechaInicio;
        exchange.fechaFin = fechaFin;
        await exchange.save();

        // Notificar al emisor
        try {
            const notificacion = new Notificacion({
                usuario: exchange.emisor,
                tipo: 'intercambio',
                titulo: 'Intercambio aceptado',
                mensaje: 'Tu solicitud de intercambio ha sido aceptada',
                datos: { exchangeId: exchange._id }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Intercambio aceptado exitosamente',
            data: { exchange }
        });

    } catch (error) {
        console.error('Error al aceptar intercambio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-INT-03: Rechazar intercambio
const rechazarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const receptorId = req.usuario.id;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Intercambio no encontrado'
            });
        }

        if (exchange.receptor.toString() !== receptorId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el receptor puede rechazar el intercambio'
            });
        }

        if (exchange.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden rechazar intercambios pendientes'
            });
        }

        exchange.estado = 'rechazado';
        if (motivo) {
            exchange.comentarios.push({
                usuario: receptorId,
                contenido: `Rechazado: ${motivo}`
            });
        }
        await exchange.save();

        // Notificar al emisor
        try {
            const notificacion = new Notificacion({
                usuario: exchange.emisor,
                tipo: 'intercambio',
                titulo: 'Intercambio rechazado',
                mensaje: 'Tu solicitud de intercambio ha sido rechazada',
                datos: { exchangeId: exchange._id, motivo }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Intercambio rechazado exitosamente',
            data: { exchange }
        });

    } catch (error) {
        console.error('Error al rechazar intercambio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-INT-09: Cancelar antes de aceptación
const cancelarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const emisorId = req.usuario.id;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Intercambio no encontrado'
            });
        }

        if (exchange.emisor.toString() !== emisorId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el emisor puede cancelar el intercambio'
            });
        }

        if (exchange.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden cancelar intercambios pendientes'
            });
        }

        exchange.estado = 'cancelado';
        await exchange.save();

        // Notificar al receptor
        try {
            const notificacion = new Notificacion({
                usuario: exchange.receptor,
                tipo: 'intercambio',
                titulo: 'Intercambio cancelado',
                mensaje: 'Una solicitud de intercambio ha sido cancelada',
                datos: { exchangeId: exchange._id }
            });
            await notificacion.save();
        } catch (notifError) {
            console.warn('Error al crear notificación:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Intercambio cancelado exitosamente',
            data: { exchange }
        });

    } catch (error) {
        console.error('Error al cancelar intercambio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-INT-04: Listar enviadas/recibidas
const obtenerExchanges = async (req, res) => {
    try {
        const { tipo } = req.query;
        const usuarioId = req.usuario.id;

        let filtro = {};
        if (tipo === 'enviadas') {
            filtro.emisor = usuarioId;
        } else if (tipo === 'recibidas') {
            filtro.receptor = usuarioId;
        } else {
            filtro.$or = [{ emisor: usuarioId }, { receptor: usuarioId }];
        }

        const exchanges = await Exchange.find(filtro)
            .populate('cursoEmisor', 'titulo categoria imagen')
            .populate('cursoReceptor', 'titulo categoria imagen')
            .populate('emisor', 'nombre')
            .populate('receptor', 'nombre')
            .sort({ fechaSolicitud: -1 });

        res.json({
            success: true,
            data: {
                exchanges,
                total: exchanges.length
            }
        });

    } catch (error) {
        console.error('Error al obtener exchanges:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-INT-08: Historial de intercambios
const obtenerHistorial = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const exchanges = await Exchange.find({
            $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
            estado: { $in: ['finalizado', 'cancelado', 'rechazado'] }
        })
            .populate('cursoEmisor', 'titulo categoria')
            .populate('cursoReceptor', 'titulo categoria')
            .populate('emisor', 'nombre')
            .populate('receptor', 'nombre')
            .sort({ fechaSolicitud: -1 });

        res.json({
            success: true,
            data: {
                exchanges,
                total: exchanges.length
            }
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Obtener intercambio por ID
const obtenerExchangePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;

        const exchange = await Exchange.findById(id)
            .populate('cursoEmisor', 'titulo categoria imagen descripcion')
            .populate('cursoReceptor', 'titulo categoria imagen descripcion')
            .populate('emisor', 'nombre email')
            .populate('receptor', 'nombre email');

        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Intercambio no encontrado'
            });
        }

        // Verificar que el usuario sea parte del intercambio
        if (exchange.emisor.toString() !== usuarioId && exchange.receptor.toString() !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este intercambio'
            });
        }

        res.json({
            success: true,
            data: { exchange }
        });

    } catch (error) {
        console.error('Error al obtener exchange:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Actualizar intercambio
const actualizarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const { comentario } = req.body;
        const usuarioId = req.usuario.id;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Intercambio no encontrado'
            });
        }

        // Solo el emisor puede actualizar comentarios en intercambios pendientes
        if (exchange.emisor.toString() !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el emisor puede actualizar el intercambio'
            });
        }

        if (exchange.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden actualizar intercambios pendientes'
            });
        }

        if (comentario) {
            exchange.comentarios.push({
                usuario: usuarioId,
                contenido: comentario
            });
        }

        await exchange.save();

        res.json({
            success: true,
            message: 'Intercambio actualizado exitosamente',
            data: { exchange }
        });

    } catch (error) {
        console.error('Error al actualizar exchange:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Eliminar intercambio (solo si está cancelado o rechazado)
const eliminarExchange = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Intercambio no encontrado'
            });
        }

        if (exchange.emisor.toString() !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: 'Solo el emisor puede eliminar el intercambio'
            });
        }

        if (!['cancelado', 'rechazado'].includes(exchange.estado)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden eliminar intercambios cancelados o rechazados'
            });
        }

        await Exchange.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Intercambio eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar exchange:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Agregar comentario al intercambio
const agregarComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido } = req.body;
        const usuarioId = req.usuario.id;

        if (!contenido || contenido.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'El comentario debe tener al menos 3 caracteres'
            });
        }

        const exchange = await Exchange.findById(id);
        if (!exchange) {
            return res.status(404).json({
                success: false,
                message: 'Intercambio no encontrado'
            });
        }

        // Verificar que el usuario sea parte del intercambio
        if (exchange.emisor.toString() !== usuarioId && exchange.receptor.toString() !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: 'No puedes comentar en este intercambio'
            });
        }

        exchange.comentarios.push({
            usuario: usuarioId,
            contenido: contenido.trim()
        });

        await exchange.save();

        res.json({
            success: true,
            message: 'Comentario agregado exitosamente',
            data: { exchange }
        });

    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
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
