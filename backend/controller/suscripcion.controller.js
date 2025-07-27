const Suscripcion = require('../models/suscripcion.model');

exports.crearSuscripcion = async (req, res) => {
    try {
        const suscripcion = new Suscripcion(req.body);
        await suscripcion.save();
        res.status(201).json(suscripcion);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerSuscripciones = async (req, res) => {
    try {
        const suscripciones = await Suscripcion.find();
        res.json(suscripciones);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.eliminarSuscripcion = async (req, res) => {
    try {
        const suscripcion = await Suscripcion.findByIdAndDelete(req.params.id);
        if (!suscripcion) return res.status(404).json({ mensaje: 'Suscripción no encontrada' });
        res.json({ mensaje: 'Suscripción eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};
