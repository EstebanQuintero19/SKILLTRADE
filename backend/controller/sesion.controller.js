const Sesion = require('../models/sesion.model');

exports.crearSesion = async (req, res) => {
    try {
        const sesion = new Sesion(req.body);
        await sesion.save();
        res.status(201).json(sesion);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerSesiones = async (req, res) => {
    try {
        const sesiones = await Sesion.find().populate('curso');
        res.json(sesiones);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.obtenerSesionPorId = async (req, res) => {
    try {
        const sesion = await Sesion.findById(req.params.id).populate('curso');
        if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });
        res.json(sesion);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.actualizarSesion = async (req, res) => {
    try {
        const sesion = await Sesion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });
        res.json(sesion);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.eliminarSesion = async (req, res) => {
    try {
        const sesion = await Sesion.findByIdAndDelete(req.params.id);
        if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });
        res.json({ mensaje: 'Sesión eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};
