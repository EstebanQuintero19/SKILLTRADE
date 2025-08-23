const Usuario = require('../model/usuario.model');
const Biblioteca = require('../model/biblioteca.model');
const { crearNotificacion } = require('../model/notificacion.model');

// RF-USU-01: Registrar usuario en la plataforma
const registrarUsuario = async (req, res) => {
    try {
        console.log('Backend recibió petición de registro:', req.body);
        const { email, nombre, password } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            console.log('Usuario ya existe:', email);
            return res.status(400).json({
                error: 'El email ya está registrado'
            });
        }

        console.log('Usuario no existe, creando nuevo usuario...');

        // Crear nuevo usuario
        const usuario = new Usuario({
            email,
            nombre,
            password
        });

        console.log('Guardando usuario en la base de datos...');
        await usuario.save();
        console.log('Usuario guardado exitosamente');

        // Crear biblioteca para el usuario (OPCIONAL - comentado temporalmente)
        try {
            console.log('Creando biblioteca para el usuario...');
            const biblioteca = new Biblioteca({
                usuario: usuario._id
            });
            await biblioteca.save();
            console.log('Biblioteca creada exitosamente');
        } catch (bibliotecaError) {
            console.warn('Error al crear biblioteca (continuando sin ella):', bibliotecaError.message);
        }

        // Generar token JWT
        console.log('Generando token JWT...');
        const token = usuario.generarToken();
        console.log('Token generado exitosamente');

        // Respuesta exitosa
        console.log('Registro completado exitosamente');
        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                fechaRegistro: usuario.fechaRegistro
            },
            token
        });

    } catch (error) {
        console.error('Error completo al registrar usuario:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor al registrar usuario',
            detalles: error.message
        });
    }
};

// RF-USU-02: Editar perfil usuario
const editarPerfil = async (req, res) => {
    try {
        const { nombre, biografia, datosContacto, visibilidadPerfil } = req.body;
        const usuarioId = req.usuario._id;

        // Actualizar campos del perfil
        const camposActualizados = {};
        if (nombre) camposActualizados.nombre = nombre;
        if (biografia !== undefined) camposActualizados.biografia = biografia;
        if (datosContacto) camposActualizados.datosContacto = datosContacto;
        if (visibilidadPerfil) camposActualizados.visibilidadPerfil = visibilidadPerfil;

        const usuario = await Usuario.findByIdAndUpdate(
            usuarioId,
            camposActualizados,
            { new: true, runValidators: true }
        ).select('-password');

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            mensaje: 'Perfil actualizado exitosamente',
            usuario
        });

    } catch (error) {
        console.error('Error al editar perfil:', error);
        res.status(500).json({
            error: 'Error interno del servidor al editar perfil'
        });
    }
};

// RF-USU-03: Ver perfil propio y de otros usuarios
const obtenerPerfil = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioAutenticado = req.usuario;

        let usuarioId = id;
        
        // Si no se proporciona ID, mostrar perfil propio
        if (!usuarioId) {
            usuarioId = usuarioAutenticado._id;
        }

        const usuario = await Usuario.findById(usuarioId)
            .select('-password -tokens')
            .populate('estadisticas');

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Si es perfil propio, mostrar toda la información
        if (usuarioId.toString() === usuarioAutenticado._id.toString()) {
            return res.json({
                usuario,
                esPropio: true
            });
        }

        // Si es perfil de otro usuario, verificar visibilidad
        if (usuario.visibilidadPerfil === 'privado') {
            return res.status(403).json({
                error: 'Este perfil es privado'
            });
        }

        // Mostrar información pública del perfil
        const perfilPublico = {
            _id: usuario._id,
            nombre: usuario.nombre,
            biografia: usuario.biografia,
            fechaRegistro: usuario.fechaRegistro,
            estadisticas: {
                cursosCreados: usuario.estadisticas.cursosCreados,
                cursosCompartidos: usuario.estadisticas.cursosCompartidos
            }
        };

        res.json({
            usuario: perfilPublico,
            esPropio: false
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener perfil'
        });
    }
};

// RF-USU-04: Eliminar cuenta del sistema
const eliminarCuenta = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { confirmacion } = req.body;

        if (!confirmacion) {
            return res.status(400).json({
                error: 'Debe confirmar la eliminación de la cuenta'
            });
        }

        // Verificar que no tenga intercambios activos
        const Exchange = require('../model/exchange.model');
        const intercambiosActivos = await Exchange.find({
            $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
            estado: { $in: ['pendiente', 'aceptado', 'activo'] }
        });

        if (intercambiosActivos.length > 0) {
            return res.status(400).json({
                error: 'No puede eliminar la cuenta mientras tenga intercambios activos'
            });
        }

        // Verificar que no tenga suscripciones activas
        const Suscripcion = require('../model/suscripcion.model');
        const suscripcionesActivas = await Suscripcion.find({
            suscriptor: usuarioId,
            estado: 'activa'
        });

        if (suscripcionesActivas.length > 0) {
            return res.status(400).json({
                error: 'No puede eliminar la cuenta mientras tenga suscripciones activas'
            });
        }

        // Eliminar usuario (soft delete)
        const usuario = await Usuario.findByIdAndUpdate(
            usuarioId,
            { activo: false },
            { new: true }
        );

        res.json({
            mensaje: 'Cuenta eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({
            error: 'Error interno del servidor al eliminar cuenta'
        });
    }
};

// RF-USU-05: Ver historial de suscripciones
const obtenerHistorialSuscripciones = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { pagina = 1, limite = 10 } = req.query;

        const Suscripcion = require('../model/suscripcion.model');
        
        const opciones = {
            page: parseInt(pagina),
            limit: parseInt(limite),
            sort: { fechaInicio: -1 }
        };

        const suscripciones = await Suscripcion.paginate(
            { suscriptor: usuarioId },
            {
                ...opciones,
                populate: [
                    { path: 'creador', select: 'nombre email' }
                ]
            }
        );

        res.json({
            suscripciones: suscripciones.docs,
            paginacion: {
                pagina: suscripciones.page,
                totalPaginas: suscripciones.totalPages,
                totalElementos: suscripciones.totalDocs,
                elementosPorPagina: suscripciones.limit
            }
        });

    } catch (error) {
        console.error('Error al obtener historial de suscripciones:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener suscripciones'
        });
    }
};

// RF-USU-06: Ver el historial de intercambios
const obtenerHistorialIntercambios = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { pagina = 1, limite = 10, estado } = req.query;

        const Exchange = require('../model/exchange.model');
        
        const filtro = {
            $or: [{ emisor: usuarioId }, { receptor: usuarioId }]
        };

        if (estado) {
            filtro.estado = estado;
        }

        const opciones = {
            page: parseInt(pagina),
            limit: parseInt(limite),
            sort: { fechaSolicitud: -1 }
        };

        const intercambios = await Exchange.paginate(
            filtro,
            {
                ...opciones,
                populate: [
                    { path: 'emisor', select: 'nombre email' },
                    { path: 'receptor', select: 'nombre email' },
                    { path: 'cursoEmisor', select: 'titulo imagen categoria' },
                    { path: 'cursoReceptor', select: 'titulo imagen categoria' }
                ]
            }
        );

        res.json({
            intercambios: intercambios.docs,
            paginacion: {
                pagina: intercambios.page,
                totalPaginas: intercambios.totalPages,
                totalElementos: intercambios.totalDocs,
                elementosPorPagina: intercambios.limit
            }
        });

    } catch (error) {
        console.error('Error al obtener historial de intercambios:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener intercambios'
        });
    }
};

// RF-USU-07: Cambiar la contraseña
const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const usuarioId = req.usuario._id;

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const passwordValida = await usuario.verificarPassword(passwordActual);
        if (!passwordValida) {
            return res.status(400).json({
                error: 'La contraseña actual es incorrecta'
            });
        }

        // Actualizar contraseña
        usuario.password = passwordNueva;
        await usuario.save();

        res.json({
            mensaje: 'Contraseña cambiada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            error: 'Error interno del servidor al cambiar contraseña'
        });
    }
};

// RF-USU-08: Cerrar sesión desde cualquier dispositivo
const cerrarSesion = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;
        const { dispositivo } = req.body;

        if (dispositivo) {
            // Cerrar sesión de un dispositivo específico
            await Usuario.findByIdAndUpdate(
                usuarioId,
                { $pull: { tokens: { dispositivo } } }
            );
        } else {
            // Cerrar todas las sesiones
            await Usuario.findByIdAndUpdate(
                usuarioId,
                { $set: { tokens: [] } }
            );
        }

        res.json({
            mensaje: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({
            error: 'Error interno del servidor al cerrar sesión'
        });
    }
};

// RF-USU-09: Configurar visibilidad del perfil
const configurarVisibilidadPerfil = async (req, res) => {
    try {
        const { visibilidadPerfil } = req.body;
        const usuarioId = req.usuario._id;

        if (!['publico', 'privado'].includes(visibilidadPerfil)) {
            return res.status(400).json({
                error: 'La visibilidad debe ser público o privado'
            });
        }

        const usuario = await Usuario.findByIdAndUpdate(
            usuarioId,
            { visibilidadPerfil },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            mensaje: 'Visibilidad del perfil configurada exitosamente',
            usuario
        });

    } catch (error) {
        console.error('Error al configurar visibilidad del perfil:', error);
        res.status(500).json({
            error: 'Error interno del servidor al configurar visibilidad'
        });
    }
};

// RF-USU-10: Ver estadísticas personales
const obtenerEstadisticasPersonales = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;

        // Obtener estadísticas del usuario
        const usuario = await Usuario.findById(usuarioId)
            .select('estadisticas')
            .populate('estadisticas');

        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Obtener estadísticas adicionales
        const Exchange = require('../model/exchange.model');
        const Suscripcion = require('../model/suscripcion.model');
        const Venta = require('../model/venta.model');

        const [
            intercambiosActivos,
            suscripcionesActivas,
            ventasRealizadas
        ] = await Promise.all([
            Exchange.countDocuments({
                $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
                estado: 'activo'
            }),
            Suscripcion.countDocuments({
                suscriptor: usuarioId,
                estado: 'activa'
            }),
            Venta.countDocuments({
                vendedor: usuarioId,
                estado: 'completada'
            })
        ]);

        const estadisticas = {
            ...usuario.estadisticas.toObject(),
            intercambiosActivos,
            suscripcionesActivas,
            ventasRealizadas
        };

        res.json({
            estadisticas
        });

    } catch (error) {
        console.error('Error al obtener estadísticas personales:', error);
        res.status(500).json({
            error: 'Error interno del servidor al obtener estadísticas'
        });
    }
};

// Función auxiliar para login
const loginUsuario = async (req, res) => {
    try {
        console.log('Backend recibió petición de login:', req.body);
        const { email, password, dispositivo } = req.body;

        // Buscar usuario por email
        console.log('Buscando usuario con email:', email);
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            console.log('Usuario no encontrado:', email);
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }
        console.log('Usuario encontrado:', usuario.nombre);
        
        if (!password) {
            console.log('Password no proporcionado');
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }
        
        if (!usuario.password) {
            console.log('Usuario no tiene password hasheado en BD');
            return res.status(500).json({
                error: 'Error en datos del usuario'
            });
        }
        
        const passwordValida = await usuario.verificarPassword(password);
        if (!passwordValida) {
            console.log('Contraseña inválida para usuario:', email);
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }
        console.log('Contraseña válida');

        // Verificar si el usuario está activo
        if (!usuario.activo) {
            console.log('Usuario inactivo:', email);
            return res.status(401).json({
                error: 'Usuario inactivo. Contacte al administrador.'
            });
        }
        console.log('Usuario activo');

        // Generar token JWT
        console.log('Generando token JWT...');
        const token = usuario.generarToken();
        console.log('Token generado exitosamente');

        // Agregar token al usuario si se especifica dispositivo (OPCIONAL)
        try {
            if (dispositivo) {
                console.log('Agregando token al dispositivo:', dispositivo);
                usuario.tokens.push({
                    token,
                    dispositivo,
                    fechaCreacion: new Date()
                });
                await usuario.save();
                console.log('Token agregado al dispositivo');
            }
        } catch (tokenError) {
            console.warn('Error al agregar token al dispositivo (continuando):', tokenError.message);
        }

        // Actualizar último acceso (OPCIONAL)
        try {
            console.log('Actualizando último acceso...');
            usuario.ultimoAcceso = new Date();
            await usuario.save();
            console.log('Último acceso actualizado');
        } catch (accessError) {
            console.warn('Error al actualizar último acceso (continuando):', accessError.message);
        }

        console.log('Login completado exitosamente');
        res.json({
            mensaje: 'Login exitoso',
            usuario: {
                _id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                foto: usuario.foto,
                ultimoAcceso: usuario.ultimoAcceso
            },
            token
        });

    } catch (error) {
        console.error('Error completo en login:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({
            error: 'Error interno del servidor en login',
            detalles: error.message
        });
    }
};

// Función auxiliar para subir foto de perfil
const subirFotoPerfil = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No se ha subido ninguna imagen'
            });
        }

        const usuarioId = req.usuario._id;
        const rutaImagen = req.file.path;

        const usuario = await Usuario.findByIdAndUpdate(
            usuarioId,
            { foto: rutaImagen },
            { new: true }
        ).select('-password');

        res.json({
            mensaje: 'Foto de perfil actualizada exitosamente',
            usuario
        });

    } catch (error) {
        console.error('Error al subir foto de perfil:', error);
        res.status(500).json({
            error: 'Error interno del servidor al subir foto'
        });
    }
};

// Funciones adicionales que faltan en routes.js
exports.obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select('-password');
        console.log('Usuarios obtenidos:', usuarios);
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-password');
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.crearUsuario = async (req, res) => {
    return registrarUsuario(req, res);
};

exports.actualizarUsuario = async (req, res) => {
    return editarPerfil(req, res);
};

exports.eliminarUsuario = async (req, res) => {
    return eliminarCuenta(req, res);
};

// Exportaciones principales
exports.registrarUsuario = registrarUsuario;
exports.loginUsuario = loginUsuario;
exports.editarPerfil = editarPerfil;
exports.obtenerPerfil = obtenerPerfil;
exports.eliminarCuenta = eliminarCuenta;
exports.obtenerHistorialSuscripciones = obtenerHistorialSuscripciones;
exports.obtenerHistorialIntercambios = obtenerHistorialIntercambios;
exports.cambiarPassword = cambiarPassword;
exports.cerrarSesion = cerrarSesion;
exports.configurarVisibilidadPerfil = configurarVisibilidadPerfil;
exports.obtenerEstadisticasPersonales = obtenerEstadisticasPersonales;
exports.subirFotoPerfil = subirFotoPerfil;
