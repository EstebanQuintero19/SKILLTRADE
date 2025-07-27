const mongoose = require('../config/db');

const FlashesSchema = new mongoose.Schema({
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    cursoRelacionado: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Curso' 
    },
    videoUrl: { 
        type: String, 
        required: true 
    }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('Flashes', ReelSchema);
