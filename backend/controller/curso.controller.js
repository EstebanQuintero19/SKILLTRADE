const Curso = require('../model/curso.model');
const Owner = require('../model/owner.model');
const Usuario = require('../model/usuario.model');
const Exchange = require('../model/exchange.model');
const Venta = require('../model/venta.model');

// RF-CUR-01: Crear curso (titulo, descripcion, categoria, imagen, adjuntos)
const crearCurso = async (req, res) => {
    try {
        const { titulo, descripcion, categoria, precio, nivel, visibilidad, etiquetas, videoIntroductorio } = req.body;
        const ownerId = req.usuario._id;

        // Validaciones básicas
        if (!titulo) {
            return res.status(400).json({ error: 'Título requerido' });
        }
        
        if (!descripcion) {
            return res.status(400).json({ error: 'Descripción requerida' });
        }
        
        if (!categoria) {
            return res.status(400).json({ error: 'Categoría requerida' });
        }

        // Validar precio
        const precioNumerico = precio ? parseFloat(precio) : 0;

        /* Validar nivel - permitir cualquier valor
         if (nivel && !['basico', 'intermedio', 'avanzado', 'Principiante', 'Intermedio', 'Avanzado'].includes(nivel)) {
             return res.status(400).json({
                 error: 'El nivel debe ser básico, intermedio o avanzado'
             });
         }

         Validar visibilidad - permitir cualquier valor
         if (visibilidad && !['publico', 'privado', 'soloSuscriptores'].includes(visibilidad)) {
             return res.status(400).json({
                 error: 'La visibilidad debe ser público, privado o solo suscriptores'
             });
         }

         Validar etiquetas - permitir cualquier cantidad
         if (etiquetas && etiquetas.length > 10) {
             return res.status(400).json({
                 error: 'No puede tener más de 10 etiquetas'
             });
         }*/

        const cursoData = {
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            categoria: Array.isArray(categoria) ? categoria : [categoria],
            precio: precioNumerico,
            nivel: nivel || 'basico',
            visibilidad: visibilidad || 'publico',
            owner: ownerId,
            imagen: req.file ? `/uploads/${req.file.filename}` : '/images/placeholder-course.jpg',
            etiquetas: etiquetas || [],
            videoIntroductorio: videoIntroductorio || null
        };

        const curso = new Curso(cursoData);
        await curso.save();

        // Actualizar estadísticas del owner
        await Owner.findOneAndUpdate(
            { usuario: ownerId },
            { $push: { cursosCreados: curso._id } },
            { upsert: true }
        );

        // Actualizar estadísticas del usuario
        await Usuario.findByIdAndUpdate(ownerId, {
            $inc: { 'estadisticas.cursosCreados': 1 }
        });

        res.status(201).json({
            success: true,
            mensaje: 'Curso creado exitosamente',
            data: curso
        });

    } catch (error) {
        console.error('Error creando curso:', error);
        console.error('Stack trace:', error.stack);
        
        // Si es un error de validación de Mongoose
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                error: 'Error de validación',
                detalles: validationErrors
            });
        }
        
        res.status(500).json({ 
            error: 'Error interno del servidor al crear curso',
            detalles: error.message 
        });
    }
};

// RF-CUR-02: Editar curso propio
const actualizarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.usuario._id;
        const camposActualizados = req.body;

        // Verificar que el curso existe y pertenece al usuario
        const curso = await Curso.findById(id);
        if (!curso) {
            return res.status(404).json({ 
                error: 'Curso no encontrado' 
            });
        }

        if (curso.owner.toString() !== ownerId.toString()) {
            return res.status(403).json({ 
                error: 'No tienes permisos para editar este curso' 
            });
        }

        // Validar campos específicos
        if (camposActualizados.precio !== undefined) {
            const precio = parseFloat(camposActualizados.precio);
            if (isNaN(precio) || precio < 0) {
                return res.status(400).json({
                    error: 'El precio debe ser un número válido no negativo'
                });
            }
        }

        if (camposActualizados.nivel && !['basico', 'intermedio', 'avanzado'].includes(camposActualizados.nivel)) {
            return res.status(400).json({
                error: 'El nivel debe ser básico, intermedio o avanzado'
            });
        }

        if (camposActualizados.visibilidad && !['publico', 'privado', 'soloSuscriptores'].includes(camposActualizados.visibilidad)) {
            return res.status(400).json({
                error: 'La visibilidad debe ser público, privado o solo suscriptores'
            });
        }

        // Actualizar curso
        const cursoActualizado = await Curso.findByIdAndUpdate(
            id, 
            camposActualizados, 
            { new: true, runValidators: true }
        ).populate('owner', 'nombre email');

        res.json({
            mensaje: 'Curso actualizado exitosamente',
            curso: cursoActualizado
        });

    } catch (error) {
        console.error('Error al actualizar curso:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al actualizar curso' 
        });
    }
};

// RF-CUR-04: Asignar precio individual
const actualizarPrecio = async (req, res) => {
    try {
        const { id } = req.params;
        const { precio } = req.body;
        const ownerId = req.usuario._id;

        if (precio === undefined || precio < 0) {
            return res.status(400).json({
                error: 'El precio debe ser un número válido no negativo'
            });
        }

        // Verificar que el curso existe y pertenece al usuario
        const curso = await Curso.findById(id);
        if (!curso) {
            return res.status(404).json({ 
                error: 'Curso no encontrado' 
            });
        }

        if (curso.owner.toString() !== ownerId.toString()) {
            return res.status(403).json({ 
                error: 'No tienes permisos para modificar este curso' 
            });
        }

        curso.precio = precio;
        await curso.save();

        res.json({
            mensaje: 'Precio actualizado exitosamente',
            curso: {
                _id: curso._id,
                titulo: curso.titulo,
                precio: curso.precio
            }
        });

    } catch (error) {
        console.error('Error al actualizar precio:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al actualizar precio' 
        });
    }
};

// RF-CUR-03: Eliminar si no está en intercambio/venta activa
const eliminarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.usuario._id;

        // Verificar que el curso existe y pertenece al usuario
        const curso = await Curso.findById(id);
        if (!curso) {
            return res.status(404).json({ 
                error: 'Curso no encontrado' 
            });
        }

        if (curso.owner.toString() !== ownerId.toString()) {
            return res.status(403).json({ 
                error: 'No tienes permisos para eliminar este curso' 
            });
        }

        // Verificar que no esté en intercambios activos
        const intercambiosActivos = await Exchange.findOne({
            $or: [
                { cursoEmisor: id, estado: { $in: ['pendiente', 'aceptado', 'activo'] } },
                { cursoReceptor: id, estado: { $in: ['pendiente', 'aceptado', 'activo'] } }
            ]
        });

        if (intercambiosActivos) {
            return res.status(400).json({
                error: 'No puedes eliminar este curso mientras esté en intercambios activos'
            });
        }

        // Verificar que no esté en ventas activas
        const ventasActivas = await Venta.findOne({
            'items.curso': id,
            estado: { $in: ['pendiente', 'completada'] }
        });

        if (ventasActivas) {
            return res.status(400).json({
                error: 'No puedes eliminar este curso mientras tenga ventas activas'
            });
        }

        // Eliminar curso
        await Curso.findByIdAndDelete(id);

        // Actualizar estadísticas del owner
        await Owner.findOneAndUpdate(
            { usuario: ownerId },
            { $inc: { cursosCreados: -1 } }
        );

        // Actualizar estadísticas del usuario
        await Usuario.findByIdAndUpdate(ownerId, {
            $inc: { 'estadisticas.cursosCreados': -1 }
        });

        res.json({ 
            mensaje: 'Curso eliminado exitosamente' 
        });

    } catch (error) {
        console.error('Error al eliminar curso:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al eliminar curso' 
        });
    }
};

// RF-CUR-09: Estadísticas de visualización/interacción
const obtenerEstadisticas = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.usuario._id;

        const curso = await Curso.findById(id);
        if (!curso) {
            return res.status(404).json({ 
                error: 'Curso no encontrado' 
            });
        }

        // Solo el owner puede ver estadísticas detalladas
        if (curso.owner.toString() !== ownerId.toString()) {
            return res.status(403).json({ 
                error: 'No tienes permisos para ver las estadísticas de este curso' 
            });
        }

        // Calcular estadísticas adicionales
        const totalCalificaciones = curso.calificaciones.length;
        const calificacionPromedio = totalCalificaciones > 0 
            ? curso.estadisticas.calificacionPromedio 
            : 0;

        const estadisticas = {
            visualizaciones: curso.estadisticas.visualizaciones,
            calificacionPromedio,
            totalCalificaciones,
            ventasRealizadas: curso.estadisticas.ventasRealizadas,
            comentarios: curso.comentarios.length,
            lecciones: curso.lecciones.length,
            fechaCreacion: curso.fechaCreacion,
            estado: curso.estadoCurso
        };

        res.json({
            curso: curso.titulo,
            estadisticas
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al obtener estadísticas' 
        });
    }
};

// RF-CUR-10: Ratings y comentarios de usuarios con acceso
const agregarCalificacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { puntuacion, comentario } = req.body;
        const usuarioId = req.usuario._id;

        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            return res.status(400).json({
                error: 'La puntuación debe ser un número entre 1 y 5'
            });
        }

        const curso = await Curso.findById(id);
        if (!curso) {
            return res.status(404).json({ 
                error: 'Curso no encontrado' 
            });
        }

        // Verificar que el usuario tenga acceso al curso
        const tieneAcceso = await verificarAccesoCurso(usuarioId, id);
        if (!tieneAcceso) {
            return res.status(403).json({
                error: 'No tienes acceso a este curso para calificarlo'
            });
        }

        // Verificar que no haya calificado antes
        const yaCalificado = curso.calificaciones.find(
            cal => cal.usuario.toString() === usuarioId.toString()
        );

        if (yaCalificado) {
            return res.status(400).json({
                error: 'Ya has calificado este curso'
            });
        }

        // Agregar calificación
        await curso.agregarCalificacion(usuarioId, puntuacion, comentario);

        res.json({
            mensaje: 'Calificación agregada exitosamente',
            curso: {
                _id: curso._id,
                titulo: curso.titulo,
                estadisticas: curso.estadisticas
            }
        });

    } catch (error) {
        console.error('Error al agregar calificación:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al agregar calificación' 
        });
    }
};

// RF-CUR-10: Agregar comentario
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

        const curso = await Curso.findById(id);
        if (!curso) {
            return res.status(404).json({ 
                error: 'Curso no encontrado' 
            });
        }

        // Verificar que el usuario tenga acceso al curso
        const tieneAcceso = await verificarAccesoCurso(usuarioId, id);
        if (!tieneAcceso) {
            return res.status(403).json({
                error: 'No tienes acceso a este curso para comentar'
            });
        }

        // Agregar comentario
        await curso.agregarComentario(usuarioId, contenido);

        res.json({
            mensaje: 'Comentario agregado exitosamente'
        });

    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al agregar comentario' 
        });
    }
};

// Obtener todos los cursos
const obtenerCursos = async (req, res) => {
    try {
        const { 
            categoria, 
            nivel, 
            precioMin, 
            precioMax, 
            visibilidad,
            sort = 'fechaCreacion',
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        // Construir filtros
        const filtros = {};
        if (categoria) filtros.categoria = { $in: [categoria] };
        if (nivel) filtros.nivel = nivel;
        if (visibilidad) filtros.visibilidad = visibilidad;
        if (precioMin !== undefined || precioMax !== undefined) {
            filtros.precio = {};
            if (precioMin !== undefined) filtros.precio.$gte = parseFloat(precioMin);
            if (precioMax !== undefined) filtros.precio.$lte = parseFloat(precioMax);
        }

        // Construir ordenamiento
        const ordenamiento = {};
        ordenamiento[sort] = order === 'desc' ? -1 : 1;

        // Paginación
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const cursos = await Curso.find(filtros)
            .populate('owner', 'nombre email')
            .sort(ordenamiento)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Curso.countDocuments(filtros);

        res.json({
            cursos,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al obtener cursos' 
        });
    }
};

// RF-CUR-05: Obtener curso por ID
const obtenerCursoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const curso = await Curso.findById(id)
            .populate('owner', 'nombre email')
            .populate('calificaciones.usuario', 'nombre')
            .populate('comentarios.usuario', 'nombre');
        
        if (!curso) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        
        res.json(curso);
    } catch (error) {
        console.error('Error al obtener curso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// RF-CUR-06: Obtener mis cursos
const obtenerMisCursos = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        
        const cursos = await Curso.find({ owner: usuarioId })
            .populate('owner', 'nombre email')
            .sort({ fechaCreacion: -1 });
        
        res.json({
            success: true,
            data: cursos
        });
    } catch (error) {
        console.error('Error al obtener mis cursos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Función auxiliar para verificar acceso al curso
const verificarAccesoCurso = async (usuarioId, cursoId) => {
    try {
        // Verificar si es el owner
        const curso = await Curso.findById(cursoId);
        if (curso.owner.toString() === usuarioId.toString()) {
            return true;
        }

        // Verificar si tiene acceso por suscripción
        const Suscripcion = require('../model/suscripcion.model');
        const suscripcionActiva = await Suscripcion.findOne({
            suscriptor: usuarioId,
            creador: curso.owner,
            estado: 'activa',
            fechaFin: { $gt: new Date() }
        });

        if (suscripcionActiva) {
            return true;
        }

        // Verificar si tiene acceso por intercambio activo
        const intercambioActivo = await Exchange.findOne({
            $or: [
                { emisor: usuarioId, cursoReceptor: cursoId, estado: 'activo' },
                { receptor: usuarioId, cursoEmisor: cursoId, estado: 'activo' }
            ],
            fechaFin: { $gt: new Date() }
        });

        if (intercambioActivo) {
            return true;
        }

        // Verificar si lo compró
        const ventaCompletada = await Venta.findOne({
            comprador: usuarioId,
            'items.curso': cursoId,
            estado: 'completada'
        });

        if (ventaCompletada) {
            return true;
        }

        return false;

    } catch (error) {
        console.error('Error al verificar acceso:', error);
        return false;
    }
};

module.exports = {
    crearCurso,
    actualizarCurso,
    actualizarPrecio,
    eliminarCurso,
    obtenerEstadisticas,
    agregarCalificacion,
    agregarComentario,
    obtenerCursos,
    obtenerCursoPorId,
    obtenerMisCursos
};
