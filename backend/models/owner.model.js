const mongoose = require('mongoose');
const { Schema } = mongoose;

const ownerSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        unique: true
    },
    cursosCreados: [{
        type: Schema.Types.ObjectId,
        ref: 'Curso'
    }],
    suscriptores: {
        type: Number,
        min: 0,
        default: 0
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    valorSuscripcion: {
        type: Number,
        min: 0,
        required: true
    }
}, {
    collection: 'owner',
    timestamps: true
});

module.exports = mongoose.model('Owner', ownerSchema);
