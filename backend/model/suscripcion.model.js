const mongoose = require('mongoose');
const { Schema } = mongoose;

const suscripcionSchema = new Schema({
    suscriptor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    creador: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tipo: {
        type: String,
        enum: ['mensual', 'trimestral', 'anual'],
        required: true
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    fechaInicio: {
        type: Date,
        default: Date.now
    },
    fechaFin: {
        type: Date,
        required: true
    },
    estado: {
        type: String,
        enum: ['activa', 'vencida', 'cancelada'],
        default: 'activa'
    },
    renovacionAutomatica: {
        type: Boolean,
        default: true
    },
    metodoPago: {
        tipo: {
            type: String,
            enum: ['tarjeta', 'paypal', 'transferencia'],
            required: true
        }
    }
}, {
    collection: 'suscripciones',
    timestamps: true
});

// Método para verificar si la suscripción está activa
suscripcionSchema.methods.estaActiva = function() {
    return this.estado === 'activa' && new Date() <= this.fechaFin;
};

// Método para cancelar suscripción
suscripcionSchema.methods.cancelar = function() {
    this.estado = 'cancelada';
    this.renovacionAutomatica = false;
    return this.save();
};

module.exports = mongoose.model('Suscripcion', suscripcionSchema);
