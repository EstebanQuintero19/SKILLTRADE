const Owner = require('../model/owner.model');
const Usuario = require('../model/usuario.model');
const Curso = require('../model/curso.model');
const Suscripcion = require('../model/suscripcion.model');

// Crear owner (propietario de cursos)
const crearOwner = async (req, res) => {
    try {
        const { usuario, valorSuscripcion } = req.body;

        // Validaciones básicas
        if (!usuario || valorSuscripcion === undefined) {
            return res.status(400).json({
                error: 'usuario y valorSuscripcion son obligatorios'
            });
        }

        // Validar valor de suscripción
        if (!Number.isFinite(valorSuscripcion) || valorSuscripcion < 0) {
            return res.status(400).json({
                error: 'El valor de suscripción debe ser un número válido no negativo'
            });
        }

        // Verificar que el usuario existe
        const usuarioDoc = await Usuario.findById(usuario);
        if (!usuarioDoc) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Verificar que no sea ya un owner
        const ownerExistente = await Owner.findOne({ usuario });
        if (ownerExistente) {
            return res.status(400).json({
                error: 'Este usuario ya es un owner'
            });
        }

        // Crear owner
        const owner = new Owner({
            usuario,
            valorSuscripcion
        });

        await owner.save();

        res.status(201).json({
            mensaje: 'Owner creado exitosamente',
            owner
        });

    } catch (error) {
        console.error('Error al crear owner:', error);
        res.status(500).json({
            error: 'Error interno del servidor al crear owner'
        });
    }
};

// Obtener todos los owners
const obtenerOwners = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = 'rating', order = 'desc' } = req.query;

        // Construir ordenamiento
        const ordenamiento = {};
        ordenamiento[sort] = order === 'desc' ? -1 : 1;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const owners = await Owner.find()
            .populate('usuario', 'nombre email biografia foto')
            .sort(ordenamiento)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Owner.countDocuments();

        res.json({
            owners,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener owners:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener owners'
        });
    }
};

// Obtener owner por ID
const obtenerOwnerPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const owner = await Owner.findById(id)
            .populate('usuario', 'nombre email biografia foto fechaRegistro')
            .populate('cursosCreados', 'titulo imagen categoria nivel precio estadisticas');

        if (!owner) {
            return res.status(404).json({
                error: 'Owner no encontrado'
            });
        }

        // Calcular estadísticas adicionales
        const estadisticas = {
            totalCursos: owner.cursosCreados.length,
            suscriptores: owner.suscriptores,
            rating: owner.rating,
            valorSuscripcion: owner.valorSuscripcion,
            fechaRegistro: owner.createdAt
        };

        res.json({
            owner,
            estadisticas,
            mensaje: 'Owner obtenido exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener owner:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener owner'
        });
    }
};

// Actualizar owner
const actualizarOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { valorSuscripcion } = req.body;

        // Validar valor de suscripción
        if (valorSuscripcion !== undefined && (!Number.isFinite(valorSuscripcion) || valorSuscripcion < 0)) {
            return res.status(400).json({
                error: 'El valor de suscripción debe ser un número válido no negativo'
            });
        }

        const owner = await Owner.findByIdAndUpdate(
            id,
            { valorSuscripcion },
            { new: true, runValidators: true }
        ).populate('usuario', 'nombre email');

        if (!owner) {
            return res.status(404).json({
                error: 'Owner no encontrado'
            });
        }

        res.json({
            mensaje: 'Owner actualizado exitosamente',
            owner
        });

    } catch (error) {
        console.error('Error al actualizar owner:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar owner'
        });
    }
};

// Eliminar owner
const eliminarOwner = async (req, res) => {
    try {
        const { id } = req.params;

        const owner = await Owner.findById(id);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner no encontrado'
            });
        }

        // Verificar que no tenga cursos activos
        const cursosActivos = await Curso.find({
            owner: owner.usuario,
            estadoCurso: 'activo'
        });

        if (cursosActivos.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar un owner con cursos activos'
            });
        }

        // Verificar que no tenga suscripciones activas
        const suscripcionesActivas = await Suscripcion.find({
            creador: owner.usuario,
            estado: 'activa'
        });

        if (suscripcionesActivas.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar un owner con suscripciones activas'
            });
        }

        await Owner.findByIdAndDelete(id);

        res.json({
            mensaje: 'Owner eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar owner:', error);
        res.status(500).json({
            error: 'Error interno del servidor al eliminar owner'
        });
    }
};

// Obtener estadísticas del owner
const obtenerEstadisticasOwner = async (req, res) => {
    try {
        const { id } = req.params;

        const owner = await Owner.findById(id);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner no encontrado'
            });
        }

        // Obtener estadísticas detalladas
        const [cursos, suscripciones] = await Promise.all([
            Curso.find({ owner: owner.usuario }),
            Suscripcion.find({ creador: owner.usuario })
        ]);

        // Calcular estadísticas
        const estadisticas = {
            totalCursos: cursos.length,
            cursosActivos: cursos.filter(c => c.estadoCurso === 'activo').length,
            cursosBorrador: cursos.filter(c => c.estadoCurso === 'borrador').length,
            totalSuscripciones: suscripciones.length,
            suscripcionesActivas: suscripciones.filter(s => s.estado === 'activa').length,
            suscripcionesVencidas: suscripciones.filter(s => s.estado === 'vencida').length,
            ingresosTotales: suscripciones.reduce((total, s) => total + s.precio, 0),
            rating: owner.rating,
            suscriptores: owner.suscriptores,
            valorSuscripcion: owner.valorSuscripcion
        };

        // Estadísticas por categoría
        const categorias = {};
        cursos.forEach(curso => {
            curso.categoria.forEach(cat => {
                if (!categorias[cat]) {
                    categorias[cat] = { total: 0, activos: 0 };
                }
                categorias[cat].total++;
                if (curso.estadoCurso === 'activo') {
                    categorias[cat].activos++;
                }
            });
        });

        estadisticas.categorias = categorias;

        res.json({
            owner: {
                _id: owner._id,
                usuario: owner.usuario
            },
            estadisticas,
            mensaje: 'Estadísticas obtenidas exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener estadísticas del owner:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener estadísticas'
        });
    }
};

// Obtener cursos del owner
const obtenerCursosOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, categoria, page = 1, limit = 10 } = req.query;

        const owner = await Owner.findById(id);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner no encontrado'
            });
        }

        // Construir filtros
        const filtros = { owner: owner.usuario };
        if (estado) filtros.estadoCurso = estado;
        if (categoria) filtros.categoria = { $in: [categoria] };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const cursos = await Curso.find(filtros)
            .populate('owner', 'nombre email')
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Curso.countDocuments(filtros);

        res.json({
            owner: {
                _id: owner._id,
                usuario: owner.usuario
            },
            cursos,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener cursos del owner:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener cursos'
        });
    }
};

// Obtener suscriptores del owner
const obtenerSuscriptoresOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, page = 1, limit = 10 } = req.query;

        const owner = await Owner.findById(id);
        if (!owner) {
            return res.status(404).json({
                error: 'Owner no encontrado'
            });
        }

        // Construir filtros
        const filtros = { creador: owner.usuario };
        if (estado) filtros.estado = estado;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const suscripciones = await Suscripcion.find(filtros)
            .populate('suscriptor', 'nombre email')
            .sort({ fechaInicio: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Suscripcion.countDocuments(filtros);

        res.json({
            owner: {
                _id: owner._id,
                usuario: owner.usuario
            },
            suscripciones,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener suscriptores del owner:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener suscriptores'
        });
    }
};

// Actualizar rating del owner
const actualizarRatingOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;

        // Validar rating
        if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
            return res.status(400).json({
                error: 'El rating debe ser un número entre 0 y 5'
            });
        }

        const owner = await Owner.findByIdAndUpdate(
            id,
            { rating },
            { new: true, runValidators: true }
        ).populate('usuario', 'nombre email');

        if (!owner) {
            return res.status(404).json({
                error: 'Owner no encontrado'
            });
        }

        res.json({
            mensaje: 'Rating actualizado exitosamente',
            owner
        });

    } catch (error) {
        console.error('Error al actualizar rating del owner:', error);
        res.status(500).json({
            error: 'Error interno del servidor al actualizar rating'
        });
    }
};

// Obtener owners destacados
const obtenerOwnersDestacados = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const owners = await Owner.find()
            .populate('usuario', 'nombre email biografia foto')
            .sort({ rating: -1, suscriptores: -1 })
            .limit(parseInt(limit));

        res.json({
            owners,
            total: owners.length,
            mensaje: 'Owners destacados obtenidos exitosamente'
        });

    } catch (error) {
        console.error('Error al obtener owners destacados:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener owners destacados'
        });
    }
};

module.exports = {
    crearOwner,
    obtenerOwners,
    obtenerOwnerPorId,
    actualizarOwner,
    eliminarOwner,
    obtenerEstadisticasOwner,
    obtenerCursosOwner,
    obtenerSuscriptoresOwner,
    actualizarRatingOwner,
    obtenerOwnersDestacados
};
