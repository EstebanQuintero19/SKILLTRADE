const Exchange = require('../models/exchange.model');

exports.crearExchange = async (req, res) => {
    try {
        const exchange = new Exchange(req.body);
        await exchange.save();
        res.status(201).json(exchange);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.obtenerExchanges = async (req, res) => {
    try {
        const exchanges = await Exchange.find().populate('emisor receptor curso');
        res.json(exchanges);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerExchangePorId = async (req, res) => {
    try {
        const exchange = await Exchange.findById(req.params.id).populate('emisor receptor curso');
        if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
        res.json(exchange);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarExchange = async (req, res) => {
    try {
        const exchange = await Exchange.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
        res.json(exchange);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.eliminarExchange = async (req, res) => {
    try {
        const exchange = await Exchange.findByIdAndDelete(req.params.id);
        if (!exchange) return res.status(404).json({ error: 'Intercambio no encontrado' });
        res.json({ mensaje: 'Intercambio eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
