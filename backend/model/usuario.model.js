const mongoose = require('../config/db');

const schemaUser = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 150
    },
    nombreUsuario: {
        type: String,
        required: true,
        unique: true,
        minlength: 1,
        maxlength: 150
    },
    fechaNacimiento: {
        type: Date,
        required: true
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    correo: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'El correo debe ser válido']
    },
    cursosPagos: {
        type: Array,
        default: []
    },
    cursosInscritos: {
        type: Array,
        default: []
    },
    suscriptores: {
        type: Number,
        default: 0
    },
    suscripciones: {
        type: Array,
        default: []
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    }
}, {
    versionKey: false
});

const users = mongoose.model('users', schemaUser);
module.exports = users;

//cuando el usuario pasa a ser un owner se le agrega el atributo rating(calificación)
