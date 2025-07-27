const Curso = require('../models/curso.model');

exports.crearCurso = async (req, res) => {
    try {
        const curso = new Curso(req.body);
        await curso.save();
        res.status(201).json(curso);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.obtenerCursos = async (req, res) => {
    try {
        const cursos = await Curso.find().populate('categoria usuario estadoCurso');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.obtenerCursoPorId = async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id).populate('categoria usuario estadoCurso');
        if (!curso) return res.status(404).json({ mensaje: 'Curso no encontrado' });
        res.json(curso);
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};

exports.actualizarCurso = async (req, res) => {
    try {
        const curso = await Curso.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!curso) return res.status(404).json({ mensaje: 'Curso no encontrado' });
        res.json(curso);
    } catch (error) {
        res.status(400).json({ mensaje: error.message });
    }
};

exports.eliminarCurso = async (req, res) => {
    try {
        const curso = await Curso.findByIdAndDelete(req.params.id);
        if (!curso) return res.status(404).json({ mensaje: 'Curso no encontrado' });
        res.json({ mensaje: 'Curso eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: error.message });
    }
};
