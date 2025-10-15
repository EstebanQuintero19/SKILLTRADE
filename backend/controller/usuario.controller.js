const Usuario = require('../model/usuario.model');
const Biblioteca = require('../model/biblioteca.model');
const Suscripcion = require('../model/suscripcion.model');
const Exchange = require('../model/exchange.model');
const Venta = require('../model/venta.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validarCaptcha } = require('../middleware/captcha');

// Generar API Key única
const generarApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

// RF-USU-01: Registrar usuario (email, nombre, password hash)
const registrarUsuario = async (req, res) => {
    try {
        const { email, nombre, password, confirmPassword, biografia, telefono } = req.body;

        // Validar campos requeridos
        if (!email || !nombre || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, nombre y password son requeridos'
            });
        }

        // Validar confirmación de contraseña
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las contraseñas no coinciden'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Por favor ingresa un email válido'
            });
        }

        // Validar longitud del nombre
        if (nombre.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'El nombre debe tener al menos 2 caracteres'
            });
        }

        // Validar CAPTCHA
        const { captcha_respuesta } = req.body;
        const captchaHash = req.session?.captchaHash;
        
        if (!validarCaptcha(captcha_respuesta, captchaHash)) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA incorrecto. Por favor, resuelve la operación matemática correctamente.'
            });
        }

        // Limpiar CAPTCHA de la sesión después de validar
        if (req.session) {
            delete req.session.captchaHash;
        }

        // Verificar si el usuario ya existe y limpiar datos residuales
        const usuarioExistente = await Usuario.findOne({ email });
        if (usuarioExistente) {
            // Verificar si el usuario está realmente activo o es un registro residual
            try {
                // Intentar limpiar datos residuales relacionados
                await Biblioteca.deleteMany({ usuario: usuarioExistente._id });
                await Suscripcion.deleteMany({ usuario: usuarioExistente._id });
                await Exchange.deleteMany({ 
                    $or: [
                        { emisor: usuarioExistente._id }, 
                        { receptor: usuarioExistente._id }
                    ]
                });
                await Venta.deleteMany({ usuario: usuarioExistente._id });
                
                // Eliminar el usuario residual
                await Usuario.findByIdAndDelete(usuarioExistente._id);
                
                console.log(`Usuario residual eliminado: ${email}`);
            } catch (cleanupError) {
                console.error('Error limpiando datos residuales:', cleanupError);
                return res.status(400).json({
                    success: false,
                    message: 'Este email ya está registrado'
                });
            }
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generar API Key única
        const apiKey = generarApiKey();

        // Crear usuario
        const nuevoUsuario = new Usuario({
            email: email.toLowerCase().trim(),
            nombre: nombre.trim(),
            password: passwordHash,
            biografia: biografia ? biografia.trim() : '',
            telefono: telefono ? telefono.trim() : '',
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
        // Bypass temporal de login controlado por variable de entorno
        if (process.env.AUTH_DISABLED === 'true') {
            return res.json({
                success: true,
                message: 'Login exitoso (bypass habilitado)',
                data: {
                    apiKey: 'dev-api-key',
                    usuario: {
                        id: 'dev-user-id',
                        email: req.body?.email || 'dev@example.com',
                        nombre: 'Usuario Dev'
                    }
                }
            });
        }

        const { email, password, captcha_respuesta } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y password son requeridos'
            });
        }

        // Validar CAPTCHA
        const captchaHash = req.session?.captchaHash;
        
        if (!validarCaptcha(captcha_respuesta, captchaHash)) {
            return res.status(400).json({
                success: false,
                message: 'CAPTCHA incorrecto. Por favor, resuelve la operación matemática correctamente.'
            });
        }

        // Limpiar CAPTCHA de la sesión después de validar
        if (req.session) {
            delete req.session.captchaHash;
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
        console.log('obtenerPerfil - Usuario autenticado:', req.usuario ? req.usuario._id : 'No usuario');
        console.log('obtenerPerfil - req.usuario completo:', req.usuario);
        
        if (!req.usuario || !req.usuario.id) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }
        
        const usuario = await Usuario.findById(req.usuario.id).select('-password');
        console.log('obtenerPerfil - Usuario encontrado en DB:', usuario ? 'SÍ' : 'NO');
        
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
                    visibilidad: usuario.visibilidad,
                    fechaCreacion: usuario.fechaCreacion,
                    estadisticas: usuario.estadisticas,
                    preferencias: usuario.preferencias || {
                        notificaciones_email: true,
                        notificaciones_cursos: true
                    }
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
        console.log('=== BACKEND: editarPerfil ===');
        console.log('Method:', req.method);
        console.log('URL:', req.originalUrl);
        console.log('Params:', req.params);
        console.log('Body:', req.body);
        console.log('Headers X-API-Key:', req.headers['x-api-key'] ? 'PRESENTE' : 'AUSENTE');
        console.log('Usuario autenticado:', req.usuario);
        
        const { nombre, biografia, telefono, notificaciones_email, notificaciones_cursos, visibilidad } = req.body;
        const usuarioId = req.usuario.id;

        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            console.log('editarPerfil - Usuario no encontrado:', usuarioId);
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        console.log('editarPerfil - Usuario encontrado:', usuario.email);

        // Actualizar campos básicos
        if (nombre !== undefined && nombre.trim() !== '') {
            usuario.nombre = nombre.trim();
            console.log('editarPerfil - Actualizando nombre:', nombre);
        }
        if (biografia !== undefined) {
            usuario.biografia = biografia.trim();
            console.log('editarPerfil - Actualizando biografía');
        }
        if (telefono !== undefined) {
            usuario.telefono = telefono.trim();
            console.log('editarPerfil - Actualizando teléfono');
        }

        // Actualizar visibilidad del perfil
        if (visibilidad !== undefined && ['publico', 'privado'].includes(visibilidad)) {
            usuario.visibilidad = visibilidad;
            console.log('editarPerfil - Actualizando visibilidad:', visibilidad);
        }

        // Actualizar preferencias de notificaciones
        if (notificaciones_email !== undefined) {
            if (!usuario.preferencias) usuario.preferencias = {};
            usuario.preferencias.notificaciones_email = notificaciones_email;
            console.log('editarPerfil - Actualizando notificaciones email:', notificaciones_email);
        }
        if (notificaciones_cursos !== undefined) {
            if (!usuario.preferencias) usuario.preferencias = {};
            usuario.preferencias.notificaciones_cursos = notificaciones_cursos;
            console.log('editarPerfil - Actualizando notificaciones cursos:', notificaciones_cursos);
        }

        // Marcar el documento como modificado
        usuario.markModified('preferencias');
        
        await usuario.save();
        console.log('editarPerfil - Usuario guardado exitosamente');

        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                usuario: {
                    id: usuario._id,
                    nombre: usuario.nombre,
                    biografia: usuario.biografia,
                    telefono: usuario.telefono,
                    visibilidad: usuario.visibilidad,
                    preferencias: usuario.preferencias
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
        // Aceptar ambos formatos de nombres de campos
        const passwordActual = req.body.passwordActual || req.body.actual;
        const passwordNuevo = req.body.passwordNuevo || req.body.nueva;
        const usuarioId = req.usuario.id;

        console.log('Cambiar password - Usuario ID:', usuarioId);
        console.log('Cambiar password - Datos recibidos:', { passwordActual: !!passwordActual, passwordNuevo: !!passwordNuevo });

        if (!passwordActual || !passwordNuevo) {
            return res.status(400).json({
                success: false,
                message: 'Password actual y nuevo son requeridos'
            });
        }

        // Validar longitud de nueva contraseña
        if (passwordNuevo.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
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

        console.log('Password actualizado exitosamente para usuario:', usuarioId);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente',
            data: {
                fechaActualizacion: new Date().toISOString(),
                usuario: {
                    id: usuario._id,
                    email: usuario.email,
                    nombre: usuario.nombre
                }
            }
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

// Obtener estadísticas generales de la plataforma
const obtenerEstadisticasGenerales = async (req, res) => {
    try {
        const Curso = require('../model/curso.model');
        
        // Obtener conteo de usuarios
        const totalUsuarios = await Usuario.countDocuments();
        
        // Obtener conteo de cursos
        const totalCursos = await Curso.countDocuments();
        
        // Obtener conteo de cursos gratis
        const cursosGratis = await Curso.countDocuments({ precio: { $lte: 0 } });
        
        // Obtener conteo de cursos de pago
        const cursosPago = await Curso.countDocuments({ precio: { $gt: 0 } });
        
        res.json({
            success: true,
            data: {
                estadisticas: {
                    totalUsuarios,
                    totalCursos,
                    cursosGratis,
                    cursosPago,
                    calificacionPromedio: 4.9 // Valor fijo por ahora
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Limpiar usuario duplicado por email (función de utilidad)
const limpiarUsuarioDuplicado = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        // Buscar usuario por email
        const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Limpiar todos los datos relacionados
        const resultados = {
            bibliotecas: 0,
            suscripciones: 0,
            intercambios: 0,
            ventas: 0
        };

        // Eliminar bibliotecas
        const bibliotecasEliminadas = await Biblioteca.deleteMany({ usuario: usuario._id });
        resultados.bibliotecas = bibliotecasEliminadas.deletedCount;

        // Eliminar suscripciones
        const suscripcionesEliminadas = await Suscripcion.deleteMany({ usuario: usuario._id });
        resultados.suscripciones = suscripcionesEliminadas.deletedCount;

        // Eliminar intercambios
        const intercambiosEliminados = await Exchange.deleteMany({ 
            $or: [
                { emisor: usuario._id }, 
                { receptor: usuario._id }
            ]
        });
        resultados.intercambios = intercambiosEliminados.deletedCount;

        // Eliminar ventas
        const ventasEliminadas = await Venta.deleteMany({ usuario: usuario._id });
        resultados.ventas = ventasEliminadas.deletedCount;

        // Eliminar usuario
        await Usuario.findByIdAndDelete(usuario._id);

        console.log(`Usuario y datos relacionados eliminados para: ${email}`, resultados);

        res.json({
            success: true,
            message: 'Usuario y datos relacionados eliminados exitosamente',
            data: {
                email: email,
                datosEliminados: resultados
            }
        });

    } catch (error) {
        console.error('Error al limpiar usuario duplicado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// Función para buscar usuarios por nombre o email
const buscarUsuarios = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'La búsqueda debe tener al menos 2 caracteres'
            });
        }

        const busqueda = q.trim();
        const regex = new RegExp(busqueda, 'i');

        const usuarios = await Usuario.find({
            $or: [
                { nombre: regex },
                { email: regex }
            ],
            // Excluir al usuario actual de los resultados
            _id: { $ne: req.usuario.id }
        })
        .select('_id nombre email')
        .limit(10);

        res.json({
            success: true,
            data: usuarios
        });

    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al buscar usuarios'
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
    actualizarUsuario,
    obtenerEstadisticasGenerales,
    limpiarUsuarioDuplicado,
    buscarUsuarios
};
