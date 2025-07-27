const Propuesta = require('../models/propuesta.model');

exports.crearPropuesta = async (req, res) => {
    try {
        const propuesta = new Propuesta(req.body);
        await propuesta.save();
        res.status(201).json(propuesta);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerPropuestas = async (req, res) => {
    try {
        const propuestas = await Propuesta.find().populate('usuario1 usuario2 cursoSolicitado cursoOfrecido estadoIntercambio');
        res.json(propuestas);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoIntercambio } = req.body;
        const propuesta = await Propuesta.findByIdAndUpdate(id, { estadoIntercambio }, { new: true });
        res.json(propuesta);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};
