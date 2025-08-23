const express = require('express');
const router = express.Router();

const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['rh-api-key'];
    console.log('API Key recibida:', apiKey);
    const validApiKey = 'skilltrade-api-key-2025';
    

    if (!apiKey) {
        return res.status(401).json({
            error: 'API Key inválida',
            mensaje: 'La API Key proporcionada no es válida'
        });
    }

    if (apiKey !== validApiKey) {
        return res.status(401).json({
            error: 'API Key inválida',
            mensaje: 'La API Key proporcionada no es válida'
        });
    }

    next();
}

// Import controllers
const usuarioController = require('./controller/usuario.controller');
const cursoController = require('./controller/curso.controller');
const exchangeController = require('./controller/exchange.controller');
const ownerController = require('./controller/owner.controller');
const suscripcionController = require('./controller/suscripcion.controller');
const bibliotecaController = require('./controller/biblioteca.controller');
const ventaController = require('./controller/venta.controller');
const notificacionController = require('./controller/notificacion.controller');

// Import middleware
const { autenticarApiKey, requerirRol, verificarPropietario } = require('./middleware/auth');

// ===== RUTAS DE AUTENTICACIÓN =====
router.post('/usuarios', usuarioController.registrarUsuario);
router.post('/usuarios/login', usuarioController.loginUsuario);
router.post('/auth/logout', autenticarApiKey, usuarioController.cerrarSesion);

// ===== RUTAS DE USUARIOS =====
router.get('/usuarios', autenticarApiKey, requerirRol(['admin']), usuarioController.obtenerUsuarios);
router.get('/usuarios/:id', autenticarApiKey, usuarioController.obtenerUsuarioPorId);
router.post('/usuarios/admin', autenticarApiKey, requerirRol(['admin']), usuarioController.crearUsuario);
router.put('/usuarios/:id', autenticarApiKey, requerirRol(['admin']), usuarioController.actualizarUsuario);
router.delete('/usuarios/:id', autenticarApiKey, usuarioController.eliminarUsuario);

// ===== RUTAS DE PERFIL =====
router.get('/usuarios/perfil', autenticarApiKey, usuarioController.obtenerPerfil);
router.put('/usuarios/:id', autenticarApiKey, verificarPropietario, usuarioController.editarPerfil);
router.post('/usuarios/:id/password', autenticarApiKey, verificarPropietario, usuarioController.cambiarPassword);
router.get('/usuarios/:id/stats', autenticarApiKey, verificarPropietario, usuarioController.obtenerEstadisticas);

// ===== RUTAS DE SUSCRIPCIONES =====
router.get('/usuarios/:id/suscripciones', autenticarApiKey, usuarioController.obtenerSuscripciones);
router.get('/usuarios/:id/intercambios', autenticarApiKey, usuarioController.obtenerIntercambios);

// ===== RUTAS DE CURSOS =====
router.get('/cursos', validateApiKey, cursoController.obtenerCursos);
router.get('/cursos/:id', cursoController.obtenerCursoPorId);
router.post('/cursos', autenticarApiKey, cursoController.crearCurso);
router.put('/cursos/:id', autenticarApiKey, cursoController.actualizarCurso);
router.delete('/cursos/:id', autenticarApiKey, cursoController.eliminarCurso);
router.patch('/cursos/:id/precio', autenticarApiKey, cursoController.actualizarPrecio);
router.get('/cursos/:id/stats', autenticarApiKey, cursoController.obtenerEstadisticas);
router.post('/cursos/:id/calificacion', autenticarApiKey, cursoController.agregarCalificacion);
router.post('/cursos/:id/comentario', autenticarApiKey, cursoController.agregarComentario);

// ===== RUTAS DE EXCHANGES =====
router.get('/exchanges', autenticarApiKey, exchangeController.obtenerExchanges);
router.get('/exchanges/:id', autenticarApiKey, exchangeController.obtenerExchangePorId);
router.post('/exchanges', autenticarApiKey, exchangeController.crearExchange);
router.put('/exchanges/:id', autenticarApiKey, exchangeController.actualizarExchange);
router.delete('/exchanges/:id', autenticarApiKey, exchangeController.eliminarExchange);
router.post('/exchanges/:id/aceptar', autenticarApiKey, exchangeController.aceptarExchange);
router.post('/exchanges/:id/rechazar', autenticarApiKey, exchangeController.rechazarExchange);
router.post('/exchanges/:id/cancelar', autenticarApiKey, exchangeController.cancelarExchange);
router.get('/exchanges/historial', autenticarApiKey, exchangeController.obtenerHistorial);
router.post('/exchanges/:id/comentario', autenticarApiKey, exchangeController.agregarComentario);

// ===== RUTAS DE SUSCRIPCIONES =====
router.get('/suscripciones', autenticarApiKey, requerirRol(['admin']), suscripcionController.obtenerSuscripciones);
router.get('/suscripciones/:id', autenticarApiKey, requerirRol(['admin']), suscripcionController.obtenerSuscripcionPorId);
router.post('/suscripciones', autenticarApiKey, suscripcionController.crearSuscripcion);
router.put('/suscripciones/:id', autenticarApiKey, requerirRol(['admin']), suscripcionController.actualizarSuscripcion);
router.delete('/suscripciones/:id', autenticarApiKey, requerirRol(['admin']), suscripcionController.eliminarSuscripcion);
router.get('/suscripciones/:id/cursos', autenticarApiKey, suscripcionController.obtenerCursosPorSuscripcion);
router.post('/suscripciones/:id/cancelar', autenticarApiKey, suscripcionController.cancelarSuscripcion);
router.patch('/suscripciones/:id/renovacion', autenticarApiKey, suscripcionController.toggleRenovacionAutomatica);
router.get('/suscripciones/historial', autenticarApiKey, suscripcionController.obtenerHistorialSuscripciones);
router.post('/suscripciones/:id/calificacion', autenticarApiKey, suscripcionController.calificarSuscripcion);
router.get('/suscripciones/:id/beneficios', autenticarApiKey, suscripcionController.obtenerBeneficios);

// ===== RUTAS DE OWNERS =====
router.get('/owners', ownerController.obtenerOwners);
router.get('/owners/:id', ownerController.obtenerOwnerPorId);
router.post('/owners', autenticarApiKey, ownerController.crearOwner);
router.put('/owners/:id', autenticarApiKey, ownerController.actualizarOwner);
router.delete('/owners/:id', autenticarApiKey, ownerController.eliminarOwner);
router.get('/owners/:id/stats', autenticarApiKey, ownerController.obtenerEstadisticasOwner);
router.get('/owners/:id/cursos', ownerController.obtenerCursosOwner);
router.get('/owners/:id/suscriptores', autenticarApiKey, ownerController.obtenerSuscriptoresOwner);
router.patch('/owners/:id/rating', autenticarApiKey, ownerController.actualizarRatingOwner);
router.get('/owners/destacados', ownerController.obtenerOwnersDestacados);

// ===== RUTAS DE BIBLIOTECA =====
router.get('/biblioteca', autenticarApiKey, bibliotecaController.obtenerBibliotecaCompleta);
router.get('/biblioteca/filtrar', autenticarApiKey, bibliotecaController.filtrarCursos);
router.get('/biblioteca/favoritos', autenticarApiKey, bibliotecaController.obtenerFavoritos);
router.post('/biblioteca/favoritos', autenticarApiKey, bibliotecaController.agregarFavorito);
router.delete('/biblioteca/favoritos/:cursoId', autenticarApiKey, bibliotecaController.removerFavorito);
router.get('/biblioteca/acceso/:cursoId', autenticarApiKey, bibliotecaController.verificarAccesoCurso);

// ===== RUTAS DE VENTAS =====
router.get('/ventas', autenticarApiKey, requerirRol(['admin']), ventaController.obtenerVentas);
router.get('/ventas/:id', autenticarApiKey, requerirRol(['admin']), ventaController.obtenerVentaPorId);
router.post('/ventas', autenticarApiKey, ventaController.crearVenta);
router.post('/ventas/:id/confirmar', autenticarApiKey, ventaController.confirmarVenta);
router.get('/ventas/historial', autenticarApiKey, ventaController.obtenerHistorialCompras);
router.get('/ventas/:id/comprobante', autenticarApiKey, ventaController.obtenerComprobante);
router.post('/ventas/:id/calificacion', autenticarApiKey, ventaController.calificarCursoComprado);
router.post('/ventas/cupon', autenticarApiKey, ventaController.aplicarCupon);
router.get('/ventas/carrito', autenticarApiKey, ventaController.obtenerCarrito);
router.post('/ventas/carrito', autenticarApiKey, ventaController.agregarAlCarrito);
router.post('/ventas/carrito/pagar', autenticarApiKey, ventaController.pagarCarrito);
router.post('/ventas/:id/reembolso', autenticarApiKey, ventaController.solicitarReembolso);

// ===== RUTAS DE NOTIFICACIONES =====
router.get('/notificaciones', autenticarApiKey, notificacionController.obtenerNotificaciones);
router.get('/notificaciones/:id', autenticarApiKey, notificacionController.obtenerNotificacionPorId);
router.get('/notificaciones/todas', autenticarApiKey, requerirRol(['admin']), notificacionController.obtenerTodasNotificaciones);
router.post('/notificaciones', autenticarApiKey, notificacionController.crearNotificacion);
router.post('/notificaciones/curso', autenticarApiKey, notificacionController.crearNotificacionCurso);
router.post('/notificaciones/vencimiento', autenticarApiKey, notificacionController.crearNotificacionVencimiento);
router.patch('/notificaciones/:id/leida', autenticarApiKey, notificacionController.marcarComoLeida);
router.patch('/notificaciones/:id/noleida', autenticarApiKey, notificacionController.marcarComoNoLeida);
router.delete('/notificaciones/:id', autenticarApiKey, notificacionController.eliminarNotificacion);
router.patch('/notificaciones/leer-todas', autenticarApiKey, notificacionController.marcarTodasComoLeidas);
router.get('/notificaciones/tipo/:tipo', autenticarApiKey, notificacionController.obtenerNotificacionesPorTipo);
router.put('/usuarios/:id/notificaciones', autenticarApiKey, notificacionController.actualizarPreferenciasNotificacion);

// ===== RUTAS ESPECIALES =====

// Obtener cursos por categoría
router.get('/cursos/categoria/:categoria', async (req, res) => {
    try {
        const { categoria } = req.params;
        const cursos = await require('./model/curso.model').find({
            categoria: { $in: [categoria] }
        }).populate('owner');
        res.json({
            success: true,
            data: { cursos }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
});

// Obtener exchanges por usuario
router.get('/exchanges/usuario/:usuarioId', autenticarApiKey, async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const exchanges = await require('./model/exchange.model').find({
            $or: [
                { emisor: usuarioId },
                { receptor: usuarioId }
            ]
        }).populate('emisor receptor cursoEmisor cursoReceptor');
        res.json({
            success: true,
            data: { exchanges }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
});

// Obtener cursos por owner
router.get('/cursos/owner/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;
        const cursos = await require('./model/curso.model').find({
            owner: ownerId
        }).populate('owner');
        res.json({
            success: true,
            data: { cursos }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
});

// Endpoint de información de la API
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'SKILLTRADE API v1.0',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            usuarios: '/api/usuarios',
            cursos: '/api/cursos',
            exchanges: '/api/exchanges',
            suscripciones: '/api/suscripciones',
            owners: '/api/owners',
            biblioteca: '/api/biblioteca',
            ventas: '/api/ventas',
            notificaciones: '/api/notificaciones'
        }
    });
});

module.exports = router; 