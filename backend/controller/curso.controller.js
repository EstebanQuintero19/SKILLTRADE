const Curso = require('../model/curso.model');
const Owner = require('../model/owner.model');

exports.crearCurso = async (req, res) => {
    try {
        console.log('Datos recibidos en backend:', req.body);
        
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token de autorización requerido' });
        }

        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'skilltrade_secret_key_2024';
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { titulo, descripcion, categoria, precio, nivel, visibilidad } = req.body;
        
        if (!titulo || !descripcion || !categoria || !precio) {
            return res.status(400).json({ 
                error: 'Faltan campos obligatorios: titulo, descripcion, categoria, precio' 
            });
        }
        
        const precioNumerico = parseFloat(precio);
        if (isNaN(precioNumerico)) {
            return res.status(400).json({ 
                error: 'El precio debe ser un número válido' 
            });
        }
        
        const cursoData = {
            titulo: titulo.trim(),
            descripcion: descripcion.trim(),
            categoria: Array.isArray(categoria) ? categoria : [categoria],
            precio: precioNumerico,
            nivel: nivel || 'basico',
            visibilidad: visibilidad || 'publico',
            owner: decoded._id,
            imagen: req.body.imagen || 'default-course.jpg'
        };

        console.log('Datos procesados para crear curso:', cursoData);

        const curso = new Curso(cursoData);
        await curso.save();

        res.status(201).json(curso);
    } catch (error) {
        console.error('Error creando curso:', error);
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
