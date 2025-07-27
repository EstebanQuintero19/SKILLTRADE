const Flashes = require('../models/flashes.model');

exports.crearReel = async (req, res) => {
    try {
        const reel = new Reel(req.body);
        await reel.save();
        res.status(201).json(reel);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerReels = async (req, res) => {
    try {
        const reels = await Reel.find().populate('usuario cursoRelacionado');
        res.json(reels);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};
