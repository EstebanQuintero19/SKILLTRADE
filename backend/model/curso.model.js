const mongoose = require('mongoose');
const { Schema } = mongoose;

const cursoSchema = new Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        minlength: 5,
        trim: true
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        minlength: 10,
        trim: true
    },
    categoria: {
        type: [String],
        required: [true, 'Debe ingresar al menos una categoría'],
        validate: [
            {
                validator: arr => Array.isArray(arr) && arr.length > 0,
                message: 'Debe haber al menos una categoría'
            },
            {
                validator: arr => arr.every(c => typeof c === 'string' && c.length >= 3),
                message: 'Cada categoría debe tener al menos 3 caracteres'
            }
        ]
    },
    fechaCreacion: {
        type: Date,
        required: true,
        default: Date.now
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Owner',
        required: true
    },
    estadoCurso: {
        type: String,
        enum: ['activo', 'borrador', 'finalizado'],
        required: true
    },
    costo: {
        type: Number,
        min: 0,
        required: true
    }
}, {
    collection: 'curso',
    timestamps: true
});

module.exports = mongoose.model('Curso', cursoSchema);
