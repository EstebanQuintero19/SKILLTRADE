const express = require('express');
const router = express.Router();

// Import controllers
const usuarioController = require('./controller/usuario.controller');
const cursoController = require('./controller/curso.controller');
const exchangeController = require('./controller/exchange.controller');
const ownerController = require('./controller/owner.controller');

// ===== RUTAS DE USUARIOS =====
router.get('/usuarios', usuarioController.obtenerUsuarios);
router.get('/usuarios/:id', usuarioController.obtenerUsuarioPorId);
router.post('/usuarios', usuarioController.crearUsuario);
router.put('/usuarios/:id', usuarioController.actualizarUsuario);
router.delete('/usuarios/:id', usuarioController.eliminarUsuario);

// ===== RUTAS DE CURSOS =====
router.get('/cursos', cursoController.obtenerCursos);
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

// ===== RUTAS ESPECIALES =====

// Obtener cursos por categoría
router.get('/cursos/categoria/:categoria', async (req, res) => {
    try {
        const { categoria } = req.params;
        const cursos = await require('./models/curso.model').find({
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
        const exchanges = await require('./models/exchange.model').find({
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
        const cursos = await require('./models/curso.model').find({
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
            usuarios: '/api/v0/usuarios',
            cursos: '/api/v0/cursos',
            exchanges: '/api/v0/exchanges',
            owners: '/api/v0/owners'
        }
    });
});

module.exports = router; 