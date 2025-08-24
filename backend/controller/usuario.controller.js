const Usuario = require('../model/usuario.model');
const Biblioteca = require('../model/biblioteca.model');
const Suscripcion = require('../model/suscripcion.model');
const Exchange = require('../model/exchange.model');
const Venta = require('../model/venta.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generar API Key única
const generarApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

// RF-USU-01: Registrar usuario (email, nombre, password hash)
const registrarUsuario = async (req, res) => {
    try {
        const { email, nombre, password, biografia, telefono } = req.body;

        // Validar campos requeridos
        if (!email || !nombre || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, nombre y password son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generar API Key única
        const apiKey = generarApiKey();

        // Crear usuario
        const nuevoUsuario = new Usuario({
            email,
            nombre,
            password: passwordHash,
            biografia: biografia || '',
            telefono: telefono || '',
            apiKey,
            fechaCreacion: new Date()
        });

        await nuevoUsuario.save();

        // Crear biblioteca para el usuario
        const nuevaBiblioteca = new Biblioteca({
            usuario: nuevoUsuario._id,
            cursos: [],
            favoritos: [],
            logros: [],
            ultimaActividad: new Date()
        });
        await nuevaBiblioteca.save();

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                usuario: {
                    id: nuevoUsuario._id,
                    email: nuevoUsuario.email,
                    nombre: nuevoUsuario.nombre,
                    apiKey: nuevoUsuario.apiKey
                }
            }
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-02: Login de usuario con API Key
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son requeridos'
            });
        }

        // Buscar usuario por email
        const usuario = await Usuario.findOne({ email }).select('+password');
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar nueva API Key si no tiene una
        if (!usuario.apiKey) {
            usuario.apiKey = generarApiKey();
            await usuario.save();
        }

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                apiKey: usuario.apiKey,
                usuario: {
                    id: usuario._id,
                    email: usuario.email,
                    nombre: usuario.nombre
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-03: Ver perfil propio
const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id).select('-password');
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                usuario: {
                    id: usuario._id,
                    email: usuario.email,
                    nombre: usuario.nombre,
                    biografia: usuario.biografia,
                    telefono: usuario.telefono,
                    fechaCreacion: usuario.fechaCreacion,
                    estadisticas: usuario.estadisticas
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-03: Ver perfil de otro usuario
const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findById(id).select('-password -apiKey');
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Solo mostrar información pública si el perfil es privado
        if (usuario.visibilidad === 'privado' && req.usuario.id !== id) {
            return res.status(403).json({
                success: false,
                message: 'Perfil privado'
            });
        }

        res.json({
            success: true,
            data: {
                usuario: {
                    id: usuario._id,
                    nombre: usuario.nombre,
                    biografia: usuario.biografia,
                    fechaCreacion: usuario.fechaCreacion,
                    estadisticas: {
                        cursosCreados: usuario.estadisticas.cursosCreados,
                        cursosCompartidos: usuario.estadisticas.cursosCompartidos,
                        intercambiosRealizados: usuario.estadisticas.intercambiosRealizados
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-02: Editar perfil (foto, bio, contacto)
const editarPerfil = async (req, res) => {
    try {
        const { nombre, biografia, telefono } = req.body;
        const usuarioId = req.usuario.id;

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Actualizar campos
        if (nombre) usuario.nombre = nombre;
        if (biografia !== undefined) usuario.biografia = biografia;
        if (telefono !== undefined) usuario.telefono = telefono;

        await usuario.save();

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                usuario: {
                    id: usuario._id,
                    nombre: usuario.nombre,
                    biografia: usuario.biografia,
                    telefono: usuario.telefono
                }
            }
        });

    } catch (error) {
        console.error('Error al editar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-07: Cambiar contraseña autenticado
const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNuevo } = req.body;
        const usuarioId = req.usuario.id;

        if (!passwordActual || !passwordNuevo) {
            return res.status(400).json({
                success: false,
                message: 'Password actual y nuevo son requeridos'
            });
        }

        const usuario = await Usuario.findById(usuarioId).select('+password');
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar password actual
        const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({
                success: false,
                message: 'Password actual incorrecto'
            });
        }

        // Hash del nuevo password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(passwordNuevo, saltRounds);
        usuario.password = passwordHash;

        await usuario.save();

        res.json({
            success: true,
            message: 'Password actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar password:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-05: Historial de suscripciones
const obtenerSuscripciones = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const suscripciones = await Suscripcion.find({ usuario: usuarioId })
            .populate('owner', 'nombre categoria')
            .sort({ fechaCreacion: -1 });

        res.json({
            success: true,
            data: {
                suscripciones,
                total: suscripciones.length
            }
        });

    } catch (error) {
        console.error('Error al obtener suscripciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-06: Historial de intercambios
const obtenerIntercambios = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const intercambios = await Exchange.find({
            $or: [
                { emisor: usuarioId },
                { receptor: usuarioId }
            ]
        })
        .populate('cursoEmisor', 'titulo categoria')
        .populate('cursoReceptor', 'titulo categoria')
        .populate('emisor', 'nombre')
        .populate('receptor', 'nombre')
        .sort({ fechaSolicitud: -1 });

        res.json({
            success: true,
            data: {
                intercambios,
                total: intercambios.length
            }
        });

    } catch (error) {
        console.error('Error al obtener intercambios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-10: Estadísticas personales
const obtenerEstadisticas = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                estadisticas: usuario.estadisticas
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-04: Eliminar cuenta con confirmación
const eliminarUsuario = async (req, res) => {
    try {
        const { confirmacion } = req.body;
        const usuarioId = req.usuario.id;

        if (confirmacion !== 'ELIMINAR_CUENTA') {
            return res.status(400).json({
                success: false,
                message: 'Confirmación requerida: ELIMINAR_CUENTA'
            });
        }

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar que no tenga intercambios o suscripciones activas
        const intercambiosActivos = await Exchange.findOne({
            $or: [{ emisor: usuarioId }, { receptor: usuarioId }],
            estado: { $in: ['pendiente', 'activo'] }
        });

        if (intercambiosActivos) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu cuenta mientras tengas intercambios activos'
            });
        }

        const suscripcionesActivas = await Suscripcion.findOne({
            usuario: usuarioId,
            estado: 'activa'
        });

        if (suscripcionesActivas) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu cuenta mientras tengas suscripciones activas'
            });
        }

        // Eliminar usuario y biblioteca
        await Usuario.findByIdAndDelete(usuarioId);
        await Biblioteca.findOneAndDelete({ usuario: usuarioId });

        res.json({
            success: true,
            message: 'Cuenta eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// RF-USU-08: Cerrar sesión (regenerar API Key)
const cerrarSesion = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Regenerar API Key para invalidar la sesión actual
        const nuevaApiKey = generarApiKey();
        usuario.apiKey = nuevaApiKey;
        await usuario.save();

        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente. Nueva API Key generada.',
            data: {
                nuevaApiKey: usuario.apiKey
            }
        });

    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Obtener todos los usuarios (solo admin)
const obtenerUsuarios = async (req, res) => {
    try {
        /* Verificar si es admin (puedes implementar tu lógica de roles aquí)
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores.'
            });
        }
        */

        const usuarios = await Usuario.find().select('-password -apiKey');
        
        res.json({
            success: true,
            data: {
                usuarios,
                total: usuarios.length
            }
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Crear usuario (solo admin)
const crearUsuario = async (req, res) => {
    try {
        // Verificar si es admin
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores.'
            });
        }

        const { email, nombre, password, rol } = req.body;

        if (!email || !nombre || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, nombre y password son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generar API Key
        const apiKey = generarApiKey();

        // Crear usuario
        const nuevoUsuario = new Usuario({
            email,
            nombre,
            password: passwordHash,
            rol: rol || 'usuario',
            apiKey,
            fechaCreacion: new Date()
        });

        await nuevoUsuario.save();

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                usuario: {
                    id: nuevoUsuario._id,
                    email: nuevoUsuario.email,
                    nombre: nuevoUsuario.nombre,
                    rol: nuevoUsuario.rol,
                    apiKey: nuevoUsuario.apiKey
                }
            }
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Actualizar usuario (solo admin)
const actualizarUsuario = async (req, res) => {
    try {
        /*
        // Verificar si es admin
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores.'
            });
        }
        */
        const { id } = req.params;
        const { nombre, email, rol, activo } = req.body;

        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Actualizar campos
        if (nombre) usuario.nombre = nombre;
        if (email) usuario.email = email;
        if (rol) usuario.rol = rol;
        if (activo !== undefined) usuario.activo = activo;

        await usuario.save();

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                usuario: {
                    id: usuario._id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol,
                    activo: usuario.activo
                }
            }
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

module.exports = {
    registrarUsuario,
    loginUsuario,
    obtenerPerfil,
    obtenerUsuarioPorId,
    editarPerfil,
    cambiarPassword,
    obtenerSuscripciones,
    obtenerIntercambios,
    obtenerEstadisticas,
    eliminarUsuario,
    cerrarSesion,
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario
};
