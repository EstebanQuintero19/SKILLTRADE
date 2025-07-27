const Certificado = require('../models/certificado.model');

exports.crearCertificado = async (req, res) => {
    try {
        const certificado = new Certificado(req.body);
        await certificado.save();
        res.status(201).json(certificado);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerCertificados = async (req, res) => {
    try {
        const certificados = await Certificado.find().populate('usuario');
        res.json(certificados);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.obtenerCertificadoPorId = async (req, res) => {
    try {
        const certificado = await Certificado.findById(req.params.id).populate('usuario');
        if (!certificado) return res.status(404).json({ mensaje: 'Certificado no encontrado' });
        res.json(certificado);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.eliminarCertificado = async (req, res) => {
    try {
        const certificado = await Certificado.findByIdAndDelete(req.params.id);
        if (!certificado) return res.status(404).json({ mensaje: 'Certificado no encontrado' });
        res.json({ mensaje: 'Certificado eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};
