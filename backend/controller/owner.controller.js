const Owner = require('../models/owner.model');

exports.crearOwner = async (req, res) => {
    try {
        const owner = new Owner(req.body);
        await owner.save();
        res.status(201).json(owner);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.obtenerOwners = async (req, res) => {
    try {
        const owners = await Owner.find().populate('usuario cursosCreados');
        res.json(owners);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerOwnerPorId = async (req, res) => {
    try {
        const owner = await Owner.findById(req.params.id).populate('usuario cursosCreados');
        if (!owner) return res.status(404).json({ error: 'Owner no encontrado' });
        res.json(owner);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarOwner = async (req, res) => {
    try {
        const owner = await Owner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!owner) return res.status(404).json({ error: 'Owner no encontrado' });
        res.json(owner);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.eliminarOwner = async (req, res) => {
    try {
        const owner = await Owner.findByIdAndDelete(req.params.id);
        if (!owner) return res.status(404).json({ error: 'Owner no encontrado' });
        res.json({ mensaje: 'Owner eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
