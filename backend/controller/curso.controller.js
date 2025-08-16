const Curso = require('../model/curso.model');
const Owner = require('../model/owner.model');

exports.crearCurso = async (req, res) => {
    try {
        const curso = new Curso(req.body);
        await curso.save();

        await Owner.findByIdAndUpdate(req.body.owner, {
            $addToSet: { cursosCreados: curso._id }
        });

        res.status(201).json(curso);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.obtenerCursos = async (req, res) => {
    try {
        const cursos = await Curso.find().populate('owner');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerCursoPorId = async (req, res) => {
    try {
        const curso = await Curso.findById(req.params.id).populate('owner');
        if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
        res.json(curso);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.actualizarCurso = async (req, res) => {
    try {
        const curso = await Curso.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });
        res.json(curso);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.eliminarCurso = async (req, res) => {
    try {
        const curso = await Curso.findByIdAndDelete(req.params.id);
        if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

        await Owner.findByIdAndUpdate(curso.owner, {
            $pull: { cursosCreados: curso._id }
        });

        res.json({ mensaje: 'Curso eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
