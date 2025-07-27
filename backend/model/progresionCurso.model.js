const mongoose = require('../config/db');

const ProgresionCursoSchema = new mongoose.Schema({
    curso: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Curso', 
        required: true 
    },
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    progresion: { 
        type: Number, 
        min: 0, 
        max: 100, 
        required: true 
    } 
}, { 
    versionKey: false 
});

module.exports = mongoose.model('ProgresionCurso', ProgresionCursoSchema);
