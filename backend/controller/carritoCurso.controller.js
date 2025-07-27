const CarritoCurso = require('../models/carritoCurso.model');

exports.agregarCursoAlCarrito = async (req, res) => {
    try {
        const item = new CarritoCurso(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerCursosCarrito = async (req, res) => {
    try {
        const items = await CarritoCurso.find().populate('carrito curso');
        res.json(items);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.eliminarCursoDelCarrito = async (req, res) => {
    try {
        const item = await CarritoCurso.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ mensaje: 'Curso no encontrado en carrito' });
        res.json({ mensaje: 'Curso eliminado del carrito' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};
