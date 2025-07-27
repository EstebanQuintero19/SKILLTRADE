const mongoose = require('../config/db');

const SesionSchema = new mongoose.Schema({
    orden: { 
        type: Number, 
        required: true 
    },
    tituloSesion: { 
        type: String, 
        required: true 
    },
    descripcion: { 
        type: String 
    },
    curso: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Curso', 
        required: true 
    }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('Sesion', SesionSchema);
