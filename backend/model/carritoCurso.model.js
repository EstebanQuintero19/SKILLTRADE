const mongoose = require('../config/db');

const CarritoCursoSchema = new mongoose.Schema({
    carrito: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Carrito', 
        required: true 
    },
    curso: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Curso', 
        required: true 
    },
    precioUnit: { 
        type: Number, 
        required: true }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('CarritoCurso', CarritoCursoSchema);
