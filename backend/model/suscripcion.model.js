const mongoose = require('../config/db');

const suscripcionSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            required: true,
            trim: true,
        },
        descripcion: {
            type: String,
            default: '',
            trim: true,
        },
        precio: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { 
        versionKey: false 
    }
);

module.exports = mongoose.model('Suscripcion', suscripcionSchema);
