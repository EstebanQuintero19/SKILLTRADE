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

// Import middleware
const { verificarToken, verificarRol } = require('./middleware/auth');

// ===== RUTAS DE AUTENTICACIÓN =====
router.post('/auth/register', usuarioController.registrarUsuario);
router.post('/auth/login', usuarioController.loginUsuario);
router.post('/auth/logout', verificarToken, usuarioController.cerrarSesion);

// ===== RUTAS DE USUARIOS =====
router.get('/usuarios', validateApiKey, usuarioController.obtenerUsuarios);
router.get('/usuarios/:id', verificarToken, usuarioController.obtenerUsuarioPorId);
router.post('/usuarios', usuarioController.crearUsuario);
router.put('/usuarios/:id', verificarToken, usuarioController.actualizarUsuario);
router.delete('/usuarios/:id', verificarToken, usuarioController.eliminarUsuario);

// ===== RUTAS DE PERFIL =====
router.get('/perfil', verificarToken, usuarioController.obtenerPerfil);
router.put('/perfil', verificarToken, usuarioController.editarPerfil);
router.post('/perfil/foto', verificarToken, usuarioController.subirFotoPerfil);
router.put('/perfil/password', verificarToken, usuarioController.cambiarPassword);
router.get('/perfil/estadisticas', verificarToken, usuarioController.obtenerEstadisticasPersonales);

// ===== RUTAS DE CURSOS =====
router.get('/cursos', validateApiKey, cursoController.obtenerCursos);
router.get('/cursos/:id', cursoController.obtenerCursoPorId);
router.post('/cursos', cursoController.crearCurso);
router.put('/cursos/:id', cursoController.actualizarCurso);
router.delete('/cursos/:id', cursoController.eliminarCurso);

// ===== RUTAS DE EXCHANGES =====
router.get('/exchanges', exchangeController.obtenerExchanges);
router.get('/exchanges/:id', exchangeController.obtenerExchangePorId);
router.post('/exchanges', exchangeController.crearExchange);
router.put('/exchanges/:id', exchangeController.actualizarExchange);
router.delete('/exchanges/:id', exchangeController.eliminarExchange);

// ===== RUTAS DE OWNERS =====
router.get('/owners', ownerController.obtenerOwners);
router.get('/owners/:id', ownerController.obtenerOwnerPorId);
router.post('/owners', ownerController.crearOwner);
router.put('/owners/:id', ownerController.actualizarOwner);
router.delete('/owners/:id', ownerController.eliminarOwner);

// ===== RUTAS DE BIBLIOTECAS =====
router.get('/bibliotecas', bibliotecaController.obtenerBibliotecas);
router.get('/bibliotecas/:id', bibliotecaController.obtenerBibliotecaPorId);

// ===== RUTAS DE CARRITOS =====
router.get('/carritos', carritoController.obtenerCarritos);
router.get('/carritos/:id', carritoController.obtenerCarritoPorId);



// Obtener cursos por categoría
router.get('/cursos/categoria/:categoria', async (req, res) => {
    try {
        const { categoria } = req.params;
        const cursos = await require('./model/curso.model').find({
            categoria: { $in: [categoria] }
        }).populate('owner');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener exchanges por usuario
router.get('/exchanges/usuario/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const exchanges = await require('./model/exchange.model').find({
            $or: [
                { emisor: usuarioId },
                { receptor: usuarioId }
            ]
        }).populate('emisor receptor curso');
        res.json(exchanges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener cursos por owner
router.get('/cursos/owner/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;
        const cursos = await require('./model/curso.model').find({
            owner: ownerId
        }).populate('owner');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint de información de la API
router.get('/', (req, res) => {
    res.json({
        message: 'SKILLTRADE API v0',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v0/auth',
            usuarios: '/api/v0/usuarios',
            cursos: '/api/v0/cursos',
            exchanges: '/api/v0/exchanges',
            owners: '/api/v0/owners',
            perfil: '/api/v0/perfil'
        }
    });
});

module.exports = router; 