const Biblioteca = require('../model/biblioteca.model');
const Curso = require('../model/curso.model');
const mongoose = require('mongoose');

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
}

const obtenerBiblioteca = async(req, res) => {
    try {
        const{usuarioId} = req.params;

        if(!isValidObjectId(usuarioId)){
            return res.status(400).json([
                {
                    success: false,
                    message: 'ID de usuario inválido'
                }
            ]);
        }

        let biblioteca = await Biblioteca.findOne({usuario: usuarioId})
            .populate({
                path: 'cursos.curso',
                select: 'titulo descripcion precio categoria instructor categoria nivel'
            })
            .populate({
                path: 'colecciones.cursos',
                select: 'titulo precio categoria'
            });

        if (!biblioteca) {
            return res.status(404).json({
                success: false,
                message: 'Biblioteca no encontrada para este usuario'
            });
        }

        res.status(200).json({
            success: true,
            data: biblioteca
        });

    } catch (error) {
        console.error('Error al obtener biblioteca:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    obtenerBiblioteca
};