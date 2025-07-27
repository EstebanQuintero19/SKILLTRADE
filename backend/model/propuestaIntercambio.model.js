const mongoose = require('../config/db');

const PropuestaIntercambioSchema = new mongoose.Schema({
    usuario1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true 
    },
    usuario2: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true 
    },
    cursoSolicitado: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Curso', 
        required: true 
    },
    cursoOfrecido: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Curso', 
        required: true 
    },
    estadoIntercambio: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'EstadoIntercambio', 
        required: true 
    }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('PropuestaIntercambio', PropuestaIntercambioSchema);
