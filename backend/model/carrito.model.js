const mongoose = require('../config/db');

const CarritoSchema = new mongoose.Schema({
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario', 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['abierto', 'comprado'], 
        default: 'abierto' 
    },
    fechaCreacion: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('Carrito', CarritoSchema);
