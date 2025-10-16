const Curso = require('../model/curso.model');
const Usuario = require('../model/usuario.model');
const Venta = require('../model/venta.model');
const Exchange = require('../model/exchange.model');
const Suscripcion = require('../model/suscripcion.model');
const Biblioteca = require('../model/biblioteca.model');

// RF-BIB-01: Cursos propios
const obtenerCursosPropios = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { page = 1, limit = 10, categoria, estado } = req.query;

        // Construir filtros
        const filtros = { owner: usuarioId };
        if (categoria) filtros.categoria = { $in: [categoria] };
        if (estado) filtros.estadoCurso = estado;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const cursos = await Curso.find(filtros)
            .populate('owner', 'nombre email')
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Curso.countDocuments(filtros);

        res.json({
            tipo: 'propios',
            cursos,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener cursos propios:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener cursos propios'
        });
    }
};

// RF-BIB-02: Cursos por suscripción
const obtenerCursosPorSuscripcion = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { page = 1, limit = 10, categoria, creador } = req.query;

        // Obtener suscripciones activas del usuario
        const suscripciones = await Suscripcion.find({
            suscriptor: usuarioId,
            estado: 'activa',
            fechaFin: { $gt: new Date() }
        });

        if (suscripciones.length === 0) {
            return res.json({
                tipo: 'suscripcion',
                cursos: [],
                paginacion: {
                    pagina: 1,
                    totalPaginas: 0,
                    totalElementos: 0,
                    elementosPorPagina: parseInt(limit)
                }
            });
        }

        // Obtener IDs de creadores de suscripciones activas
        const creadoresIds = suscripciones.map(s => s.creador);

        // Construir filtros
        const filtros = {
            owner: { $in: creadoresIds },
            visibilidad: { $in: ['publico', 'soloSuscriptores'] }
        };

        if (categoria) filtros.categoria = { $in: [categoria] };
        if (creador) filtros.owner = creador;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const cursos = await Curso.find(filtros)
            .populate('owner', 'nombre email')
            .sort({ fechaCreacion: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Curso.countDocuments(filtros);

        res.json({
            tipo: 'suscripcion',
            cursos,
            suscripciones: suscripciones.length,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener cursos por suscripción:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener cursos por suscripción'
        });
    }
};

// RF-BIB-03: Cursos por intercambio
const obtenerCursosPorIntercambio = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { page = 1, limit = 10, estado } = req.query;

        // Obtener intercambios activos del usuario
        const filtrosIntercambio = {
            $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
            estado: 'activo',
            fechaFin: { $gt: new Date() }
        };

        if (estado) filtrosIntercambio.estado = estado;

        const intercambios = await Exchange.find(filtrosIntercambio)
            .populate('cursoEmisor', 'titulo imagen categoria nivel')
            .populate('cursoReceptor', 'titulo imagen categoria nivel')
            .populate('emisor', 'nombre email')
            .populate('receptor', 'nombre email');

        // Preparar cursos de intercambio
        const cursos = [];
        intercambios.forEach(intercambio => {
            if (intercambio.emisor.toString() === usuarioId.toString()) {
                // El usuario es emisor, puede acceder al curso receptor
                if (intercambio.cursoReceptor) {
                    cursos.push({
                        ...intercambio.cursoReceptor.toObject(),
                        origen: 'intercambio',
                        intercambioId: intercambio._id,
                        tipo: 'receptor',
                        fechaInicio: intercambio.fechaInicio,
                        fechaFin: intercambio.fechaFin
                    });
                }
            } else {
                // El usuario es receptor, puede acceder al curso emisor
                if (intercambio.cursoEmisor) {
                    cursos.push({
                        ...intercambio.cursoEmisor.toObject(),
                        origen: 'intercambio',
                        intercambioId: intercambio._id,
                        tipo: 'emisor',
                        fechaInicio: intercambio.fechaInicio,
                        fechaFin: intercambio.fechaFin
                    });
                }
            }
        });

        // Aplicar paginación
        const total = cursos.length;
        const inicio = (parseInt(page) - 1) * parseInt(limit);
        const fin = inicio + parseInt(limit);
        const cursosPaginados = cursos.slice(inicio, fin);

        res.json({
            tipo: 'intercambio',
            cursos: cursosPaginados,
            total,
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener cursos por intercambio:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener cursos por intercambio'
        });
    }
};


// RF-BIB-05: Clasificar por origen
const obtenerBibliotecaCompleta = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { tipo, page = 1, limit = 10 } = req.query;

        let resultado;

        switch (tipo) {
            case 'propios':
                resultado = await obtenerCursosPropios(req, res);
                return;
            case 'suscripcion':
                resultado = await obtenerCursosPorSuscripcion(req, res);
                return;
            case 'intercambio':
                resultado = await obtenerCursosPorIntercambio(req, res);
                return;
            case 'venta':
                resultado = await obtenerCursosComprados(req, res);
                return;
            default:
                // Obtener todos los tipos
                const [propios, suscripcion, intercambio, venta] = await Promise.all([
                    Curso.countDocuments({ owner: usuarioId }),
                    Suscripcion.countDocuments({ 
                        suscriptor: usuarioId, 
                        estado: 'activa',
                        fechaFin: { $gt: new Date() }
                    }),
                    Exchange.countDocuments({
                        $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
                        estado: 'activo',
                        fechaFin: { $gt: new Date() }
                    }),
                    Venta.countDocuments({
                        comprador: usuarioId,
                        estado: 'completada'
                    })
                ]);

                res.json({
                    resumen: {
                        propios,
                        suscripcion,
                        intercambio,
                        venta,
                        total: propios + suscripcion + intercambio + venta
                    },
                    mensaje: 'Resumen de biblioteca obtenido exitosamente'
                });
        }

    } catch (error) {
        console.error('Error al obtener biblioteca completa:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener biblioteca'
        });
    }
};

// RF-BIB-06: Filtros (categoría, duración, estado)
const filtrarCursos = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { 
            tipo, 
            categoria, 
            duracion, 
            estado, 
            nivel,
            precioMin,
            precioMax,
            page = 1, 
            limit = 10 
        } = req.query;

        let cursos = [];

        // Obtener cursos según el tipo
        switch (tipo) {
            case 'propios':
                const cursosPropios = await Curso.find({ owner: usuarioId });
                cursos = cursosPropios.map(curso => ({
                    ...curso.toObject(),
                    origen: 'propio'
                }));
                break;

            case 'suscripcion':
                const suscripciones = await Suscripcion.find({
                    suscriptor: usuarioId,
                    estado: 'activa',
                    fechaFin: { $gt: new Date() }
                });
                const creadoresIds = suscripciones.map(s => s.creador);
                const cursosSuscripcion = await Curso.find({
                    owner: { $in: creadoresIds },
                    visibilidad: { $in: ['publico', 'soloSuscriptores'] }
                });
                cursos = cursosSuscripcion.map(curso => ({
                    ...curso.toObject(),
                    origen: 'suscripcion'
                }));
                break;

            case 'intercambio':
                const intercambios = await Exchange.find({
                    $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
                    estado: 'activo',
                    fechaFin: { $gt: new Date() }
                });
                intercambios.forEach(intercambio => {
                    if (intercambio.emisor.toString() === usuarioId.toString()) {
                        if (intercambio.cursoReceptor) {
                            cursos.push({
                                ...intercambio.cursoReceptor.toObject(),
                                origen: 'intercambio'
                            });
                        }
                    } else {
                        if (intercambio.cursoEmisor) {
                            cursos.push({
                                ...intercambio.cursoEmisor.toObject(),
                                origen: 'intercambio'
                            });
                        }
                    }
                });
                break;

            case 'venta':
                const ventas = await Venta.find({
                    comprador: usuarioId,
                    estado: 'completada'
                }).populate('items.curso');
                ventas.forEach(venta => {
                    venta.items.forEach(item => {
                        if (item.curso) {
                            cursos.push({
                                ...item.curso.toObject(),
                                origen: 'venta'
                            });
                        }
                    });
                });
                break;

            default:
                return res.status(400).json({
                    error: 'Tipo de curso requerido: propios, suscripcion, intercambio, o venta'
                });
        }

        // Aplicar filtros
        if (categoria) {
            cursos = cursos.filter(curso => 
                curso.categoria.includes(categoria)
            );
        }

        if (duracion) {
            const duracionNum = parseInt(duracion);
            cursos = cursos.filter(curso => {
                const duracionTotal = curso.lecciones.reduce((total, leccion) => 
                    total + (leccion.duracion || 0), 0
                );
                return duracionTotal <= duracionNum;
            });
        }

        if (estado) {
            cursos = cursos.filter(curso => curso.estadoCurso === estado);
        }

        if (nivel) {
            cursos = cursos.filter(curso => curso.nivel === nivel);
        }

        if (precioMin !== undefined) {
            const precioMinNum = parseFloat(precioMin);
            cursos = cursos.filter(curso => curso.precio >= precioMinNum);
        }

        if (precioMax !== undefined) {
            const precioMaxNum = parseFloat(precioMax);
            cursos = cursos.filter(curso => curso.precio <= precioMaxNum);
        }

        // Aplicar paginación
        const total = cursos.length;
        const inicio = (parseInt(page) - 1) * parseInt(limit);
        const fin = inicio + parseInt(limit);
        const cursosPaginados = cursos.slice(inicio, fin);

        res.json({
            tipo,
            cursos: cursosPaginados,
            filtros: { categoria, duracion, estado, nivel, precioMin, precioMax },
            paginacion: {
                pagina: parseInt(page),
                totalPaginas: Math.ceil(total / parseInt(limit)),
                totalElementos: total,
                elementosPorPagina: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al filtrar cursos:', error);
        res.status(500).json({
            error: 'Error interno del servidor al filtrar cursos'
        });
    }
};

// RF-BIB-07: Favoritos
const agregarFavorito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id || req.usuario._id;
        const { cursoId } = req.params; // Obtener del parámetro de la URL
        

        if (!cursoId) {
            return res.status(400).json({
                success: false,
                message: 'ID del curso es obligatorio'
            });
        }

        // Verificar que el curso existe
        const curso = await Curso.findById(cursoId);
        if (!curso) {
            return res.status(404).json({
                success: false,
                message: 'Curso no encontrado'
            });
        }

        // Obtener o crear biblioteca del usuario
        let biblioteca = await Biblioteca.findOne({ usuario: usuarioId });
        if (!biblioteca) {
            biblioteca = new Biblioteca({ 
                usuario: usuarioId,
                favoritos: []
            });
        }

        // Verificar si ya está en favoritos
        const yaFavorito = biblioteca.favoritos.some(fav => fav.toString() === cursoId);
        
        if (yaFavorito) {
            // Si ya está en favoritos, lo removemos (toggle)
            biblioteca.favoritos = biblioteca.favoritos.filter(fav => fav.toString() !== cursoId);
            await biblioteca.save();
            
            return res.json({
                success: true,
                action: 'removed',
                message: 'Curso removido de favoritos',
                total: biblioteca.favoritos.length
            });
        } else {
            // Si no está en favoritos, lo agregamos
            biblioteca.favoritos.push(cursoId);
            await biblioteca.save();
            
            return res.json({
                success: true,
                action: 'added',
                message: 'Curso agregado a favoritos',
                total: biblioteca.favoritos.length
            });
        }

    } catch (error) {
        console.error('Error al manejar favorito:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al manejar favorito',
            error: error.message
        });
    }
};

const removerFavorito = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { cursoId } = req.params;

        // Obtener biblioteca del usuario
        const biblioteca = await Biblioteca.findOne({ usuario: usuarioId });
        if (!biblioteca) {
            return res.status(404).json({
                error: 'Biblioteca no encontrada'
            });
        }

        // Verificar si está en favoritos
        const indice = biblioteca.favoritos.indexOf(cursoId);
        if (indice === -1) {
            return res.status(400).json({
                error: 'El curso no está en favoritos'
            });
        }

        // Remover de favoritos
        biblioteca.favoritos.splice(indice, 1);
        await biblioteca.save();

        res.json({
            mensaje: 'Curso removido de favoritos exitosamente',
            biblioteca: {
                favoritos: biblioteca.favoritos.length
            }
        });

    } catch (error) {
        console.error('Error al remover favorito:', error);
        res.status(500).json({
            error: 'Error interno del servidor al remover favorito'
        });
    }
};

const obtenerFavoritos = async (req, res) => {
    try {
        const usuarioId = req.usuario.id || req.usuario._id;

        // Obtener o crear biblioteca del usuario
        let biblioteca = await Biblioteca.findOne({ usuario: usuarioId })
            .populate({
                path: 'favoritos',
                populate: {
                    path: 'owner',
                    select: 'nombre email'
                }
            });

        // Si no existe biblioteca, crear una vacía
        if (!biblioteca) {
            biblioteca = new Biblioteca({
                usuario: usuarioId,
                favoritos: []
            });
            await biblioteca.save();
        }

        // Obtener favoritos
        const favoritos = biblioteca.favoritos || [];

        res.json({
            success: true,
            data: favoritos,
            total: favoritos.length
        });

    } catch (error) {
        console.error('Error al obtener favoritos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener favoritos',
            error: error.message
        });
    }
};

// RF-BIB-08: Acceder al contenido desde biblioteca
const verificarAccesoCurso = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { cursoId } = req.params;

        // Verificar que el curso existe
        const curso = await Curso.findById(cursoId);
        if (!curso) {
            return res.status(404).json({
                error: 'Curso no encontrado'
            });
        }

        // Verificar acceso según el origen
        let tieneAcceso = false;
        let origen = '';

        // Verificar si es propietario
        if (curso.owner.toString() === usuarioId.toString()) {
            tieneAcceso = true;
            origen = 'propio';
        }

        // Verificar acceso por suscripción
        if (!tieneAcceso) {
            const suscripcion = await Suscripcion.findOne({
                suscriptor: usuarioId,
                creador: curso.owner,
                estado: 'activa',
                fechaFin: { $gt: new Date() }
            });
            if (suscripcion) {
                tieneAcceso = true;
                origen = 'suscripcion';
            }
        }

        // Verificar acceso por intercambio
        if (!tieneAcceso) {
            const intercambio = await Exchange.findOne({
                $or: [
                    { emisor: usuarioId, cursoReceptor: cursoId, estado: 'activo' },
                    { receptor: usuarioId, cursoEmisor: cursoId, estado: 'activo' }
                ],
                fechaFin: { $gt: new Date() }
            });
            if (intercambio) {
                tieneAcceso = true;
                origen = 'intercambio';
            }
        }

        // Verificar acceso por compra
        if (!tieneAcceso) {
            const venta = await Venta.findOne({
                comprador: usuarioId,
                'items.curso': cursoId,
                estado: 'completada'
            });
            if (venta) {
                tieneAcceso = true;
                origen = 'venta';
            }
        }

        if (!tieneAcceso) {
            return res.status(403).json({
                error: 'No tienes acceso a este curso',
                curso: {
                    _id: curso._id,
                    titulo: curso.titulo,
                    precio: curso.precio
                }
            });
        }

        res.json({
            tieneAcceso: true,
            origen,
            curso: {
                _id: curso._id,
                titulo: curso.titulo,
                descripcion: curso.descripcion,
                lecciones: curso.lecciones,
                archivos: curso.archivos
            },
            mensaje: 'Acceso verificado exitosamente'
        });

    } catch (error) {
        console.error('Error al verificar acceso:', error);
        res.status(500).json({
            error: 'Error interno del servidor al verificar acceso'
        });
    }
};

const mongoose = require('mongoose');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}

const obtenerBiblioteca = async(req, res) => {
    try {
        const{usuarioId} = req.params;

        if(!isValidObjectId(usuarioId)){
            return res.status(400).json([
                {
                    success: false,
                    message: 'ID de usuario inválido'
                }
            ]);
        }

        let biblioteca = await Biblioteca.findOne({usuario: usuarioId})
            .populate({
                path: 'cursos.curso',
                select: 'titulo descripcion precio categoria instructor categoria nivel'
            })
            .populate({
                path: 'colecciones.cursos',
                select: 'titulo precio categoria'
            });

        if (!biblioteca) {
            return res.status(404).json({
                success: false,
                message: 'Biblioteca no encontrada para este usuario'
            });
        }

        res.status(200).json({
            success: true,
            data: biblioteca
        });

    } catch (error) {
        console.error('Error al obtener biblioteca:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// RF-BIB-09: Editar curso desde biblioteca
const editarCursoDesdeLibreria = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { cursoId } = req.params;
        const { titulo, descripcion, categoria, precio, nivel, visibilidad } = req.body;

        // Verificar que el curso existe y pertenece al usuario
        const curso = await Curso.findById(cursoId);
        if (!curso) {
            return res.status(404).json({
                error: 'Curso no encontrado'
            });
        }

        // Verificar permisos: propietario del curso O administrador
        const esAdmin = req.usuario.email === 'skilltrade_admin@gmail.com';
        const esPropietario = curso.owner.toString() === usuarioId.toString();
        
        if (!esPropietario && !esAdmin) {
            return res.status(403).json({
                error: 'No tienes permisos para editar este curso'
            });
        }

        // Validaciones básicas
        if (!titulo || titulo.trim() === '') {
            return res.status(400).json({
                error: 'El título es obligatorio'
            });
        }

        if (!descripcion || descripcion.trim() === '') {
            return res.status(400).json({
                error: 'La descripción es obligatoria'
            });
        }

        // Actualizar curso
        const datosActualizados = {
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            fechaActualizacion: new Date()
        };

        if (categoria) {
            datosActualizados.categoria = Array.isArray(categoria) ? categoria : [categoria];
        }

        if (precio !== undefined) {
            const precioNumerico = parseFloat(precio);
            if (precioNumerico >= 0 && precioNumerico <= 100000) {
                datosActualizados.precio = precioNumerico;
            }
        }

        if (nivel && ['Principiante', 'intermedio', 'avanzado'].includes(nivel)) {
            datosActualizados.nivel = nivel;
        }

        if (visibilidad && ['publico', 'privado', 'soloSuscriptores'].includes(visibilidad)) {
            datosActualizados.visibilidad = visibilidad;
        }

        const cursoActualizado = await Curso.findByIdAndUpdate(
            cursoId,
            datosActualizados,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            mensaje: 'Curso actualizado exitosamente',
            data: cursoActualizado
        });

    } catch (error) {
        console.error('Error al editar curso desde biblioteca:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Error de validación',
                detalles: validationErrors
            });
        }

        res.status(500).json({
            error: 'Error interno del servidor al editar curso'
        });
    }
};

// RF-BIB-10: Eliminar curso desde biblioteca
const eliminarCursoDesdeLibreria = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { cursoId } = req.params;

        // Verificar que el curso existe y pertenece al usuario
        const curso = await Curso.findById(cursoId);
        if (!curso) {
            return res.status(404).json({
                error: 'Curso no encontrado'
            });
        }

        // Verificar permisos: propietario del curso O administrador
        const esAdmin = req.usuario.email === 'skilltrade_admin@gmail.com';
        const esPropietario = curso.owner.toString() === usuarioId.toString();
        
        if (!esPropietario && !esAdmin) {
            return res.status(403).json({
                error: 'No tienes permisos para eliminar este curso'
            });
        }

        // Verificar si el curso tiene ventas activas
        const ventasActivas = await Venta.findOne({
            'items.curso': cursoId,
            estado: 'completada'
        });

        if (ventasActivas) {
            return res.status(400).json({
                error: 'No se puede eliminar un curso que ya ha sido vendido'
            });
        }

        // Verificar si el curso tiene intercambios activos
        const intercambiosActivos = await Exchange.findOne({
            $or: [
                { cursoEmisor: cursoId },
                { cursoReceptor: cursoId }
            ],
            estado: 'activo'
        });

        if (intercambiosActivos) {
            return res.status(400).json({
                error: 'No se puede eliminar un curso que tiene intercambios activos'
            });
        }

        // Eliminar el curso
        await Curso.findByIdAndDelete(cursoId);

        // Actualizar estadísticas del owner
        await Owner.findOneAndUpdate(
            { usuario: usuarioId },
            { $pull: { cursosCreados: cursoId } }
        );

        // Actualizar estadísticas del usuario
        await Usuario.findByIdAndUpdate(usuarioId, {
            $inc: { 'estadisticas.cursosCreados': -1 }
        });

        // Remover de bibliotecas donde esté como favorito
        await Biblioteca.updateMany(
            { favoritos: cursoId },
            { $pull: { favoritos: cursoId } }
        );

        res.json({
            success: true,
            mensaje: 'Curso eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar curso desde biblioteca:', error);
        res.status(500).json({
            error: 'Error interno del servidor al eliminar curso'
        });
    }
};

// Función para obtener cursos de un usuario específico (para intercambios)
const obtenerCursosDeUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        
        if (!usuarioId) {
            return res.status(400).json({
                success: false,
                message: 'ID de usuario es requerido'
            });
        }

        
        // Obtener cursos del usuario especificado (incluyendo borradores y activos)
        const cursos = await Curso.find({ 
            owner: usuarioId,
            estadoCurso: { $in: ['activo', 'borrador', 'publicado'] } // Incluir diferentes estados
        })
        .select('_id titulo categoria imagen precio nivel estadoCurso')
        .populate('owner', 'nombre email')
        .sort({ fechaCreacion: -1 });


        res.json({
            success: true,
            data: cursos,
            total: cursos.length
        });

    } catch (error) {
        console.error('Error al obtener cursos de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener cursos'
        });
    }
};

// Función para obtener cursos disponibles por intercambios activos
const obtenerCursosPorIntercambioActivo = async (req, res) => {
    try {
        const usuarioId = req.usuario.id || req.usuario._id;

        // Buscar intercambios activos donde el usuario es receptor
        const intercambiosActivos = await Exchange.find({
            receptor: usuarioId,
            estado: 'activo',
            fechaFin: { $gte: new Date() } // Solo intercambios que no han expirado
        })
        .populate({
            path: 'cursoEmisor',
            populate: {
                path: 'owner',
                select: 'nombre email'
            }
        })
        .populate('emisor', 'nombre email')
        .sort({ fechaInicio: -1 });


        // Extraer los cursos de los intercambios (el usuario receptor accede al curso del emisor)
        const cursosIntercambio = intercambiosActivos
            .filter(intercambio => intercambio.cursoEmisor) // Filtrar intercambios con curso válido
            .map(intercambio => ({
                ...intercambio.cursoEmisor.toObject(),
                intercambio: {
                    id: intercambio._id,
                    fechaInicio: intercambio.fechaInicio,
                    fechaFin: intercambio.fechaFin,
                    duracion: intercambio.duracion,
                    solicitante: intercambio.emisor
                }
            }));


        res.json({
            success: true,
            data: cursosIntercambio,
            total: cursosIntercambio.length
        });

    } catch (error) {
        console.error('Error al obtener cursos por intercambio:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener cursos por intercambio',
            error: error.message
        });
    }
};

// Función para obtener cursos comprados
const obtenerCursosComprados = async (req, res) => {
    try {
        const usuarioId = req.usuario.id || req.usuario._id;

        // Buscar ventas completadas del usuario
        const ventas = await Venta.find({
            comprador: usuarioId,
            estado: 'completada'
        })
        .populate({
            path: 'items.curso',
            populate: {
                path: 'owner',
                select: 'nombre email'
            }
        })
        .sort({ fechaCompra: -1 });


        // Extraer cursos de las ventas
        const cursosComprados = [];
        ventas.forEach(venta => {
            venta.items.forEach(item => {
                if (item.curso) {
                    cursosComprados.push({
                        ...item.curso.toObject(),
                        compra: {
                            ventaId: venta._id,
                            fechaCompra: venta.fechaCompra,
                            precio: item.precio,
                            metodoPago: venta.metodoPago
                        }
                    });
                }
            });
        });


        res.json({
            success: true,
            data: cursosComprados,
            total: cursosComprados.length
        });

    } catch (error) {
        console.error('Error al obtener cursos comprados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener cursos comprados',
            error: error.message
        });
    }
};

module.exports = {
    obtenerCursosPropios,
    obtenerCursosPorSuscripcion,
    obtenerCursosPorIntercambio,
    obtenerCursosComprados,
    obtenerBibliotecaCompleta,
    filtrarCursos,
    agregarFavorito,
    removerFavorito,
    obtenerFavoritos,
    verificarAccesoCurso,
    obtenerBiblioteca,
    editarCursoDesdeLibreria,
    eliminarCursoDesdeLibreria,
    obtenerCursosDeUsuario,
    obtenerCursosPorIntercambioActivo
};