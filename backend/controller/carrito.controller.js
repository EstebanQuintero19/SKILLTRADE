const Carrito = require('../models/carrito.model');

exports.crearCarrito = async (req, res) => {
    try {
        const carrito = new Carrito(req.body);
        await carrito.save();
        res.status(201).json(carrito);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerCarritos = async (req, res) => {
    try {
        const carritos = await Carrito.find().populate('usuario');
        res.json(carritos);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.eliminarCarrito = async (req, res) => {
    try {
        const carrito = await Carrito.findByIdAndDelete(req.params.id);
        if (!carrito) return res.status(404).json({ mensaje: 'Carrito no encontrado' });
        res.json({ mensaje: 'Carrito eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};
