const ProgresionCurso = require('../models/progresion.model');

exports.actualizarProgreso = async (req, res) => {
    try {
        const { curso, usuario, progresion } = req.body;
        const progreso = await ProgresionCurso.findOneAndUpdate(
            { curso, usuario },
            { progresion },
            { upsert: true, new: true }
        );
        res.json(progreso);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerProgresos = async (req, res) => {
    try {
        const progresos = await ProgresionCurso.find().populate('curso usuario');
        res.json(progresos);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};
