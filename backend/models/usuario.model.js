const mongoose = require('mongoose');
const { Schema } = mongoose;

const usuarioSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        minlength: 2,
        maxlength: 100,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email inválido'],
        lowercase: true,
        trim: true
    },
    fechaRegistro: {
        type: Date,
        required: true,
        default: Date.now
    },
    rol: {
        type: String,
        enum: ['admin', 'usuario', 'moderador'],
        default: 'usuario'
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    collection: 'usuarios',
    timestamps: false
});

module.exports = mongoose.model('Usuario', usuarioSchema);
