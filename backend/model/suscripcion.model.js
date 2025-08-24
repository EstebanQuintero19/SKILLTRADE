const mongoose = require('mongoose');
const { Schema } = mongoose;

const suscripcionSchema = new Schema({
    suscriptor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El suscriptor es obligatorio']
    },
    creador: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El creador es obligatorio'],
        validate: {
            validator: function(v) {
                return v && this.suscriptor && v.toString() !== this.suscriptor.toString();
            },
            message: 'El creador no puede ser el mismo que el suscriptor'
        }
    },
    tipo: {
        type: String,
        enum: {
            values: ['mensual', 'trimestral', 'anual'],
            message: 'El tipo de suscripción debe ser mensual, trimestral o anual'
        },
        required: [true, 'El tipo de suscripción es obligatorio']
    },
    precio: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [0, 'El precio no puede ser negativo'],
        validate: {
            validator: function(v) {
                return Number.isFinite(v) && v >= 0;
            },
            message: 'El precio debe ser un número válido no negativo'
        }
    },
    fechaInicio: {
        type: Date,
        default: Date.now,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                return v <= new Date();
            },
            message: 'La fecha de inicio no puede ser futura'
        }
    },
    fechaFin: {
        type: Date,
        required: [true, 'La fecha de fin es obligatoria'],
        validate: {
            validator: function(v) {
                if (!v) return false; // Requerido
                if (!this.fechaInicio) return true; // Si no hay fecha de inicio, permitir
                return v > this.fechaInicio;
            },
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        }
    },
    estado: {
        type: String,
        enum: {
            values: ['activa', 'vencida', 'cancelada'],
            message: 'El estado debe ser activa, vencida o cancelada'
        },
        default: 'activa'
    },
    renovacionAutomatica: {
        type: Boolean,
        default: true
    },
    metodoPago: {
        tipo: {
            type: String,
            enum: {
                values: ['tarjeta', 'paypal', 'transferencia'],
                message: 'El método de pago debe ser tarjeta, paypal o transferencia'
            },
            required: [true, 'El método de pago es obligatorio']
        }
    }
}, {
    collection: 'suscripciones',
    timestamps: true
});

// Índices básicos
suscripcionSchema.index({ suscriptor: 1, estado: 1 });
suscripcionSchema.index({ creador: 1, estado: 1 });
suscripcionSchema.index({ fechaFin: 1 });

// Solo una suscripción activa por par suscriptor-creador
suscripcionSchema.index(
    { suscriptor: 1, creador: 1 },
    { unique: true, partialFilterExpression: { estado: 'activa' } }
);

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

// Método para renovar suscripción
suscripcionSchema.methods.renovar = function() {
    if (this.estado === 'activa') {
        const ahora = new Date();
        const duracion = this.tipo === 'mensual' ? 30 : this.tipo === 'trimestral' ? 90 : 365;
        this.fechaInicio = ahora;
        this.fechaFin = new Date(ahora.getTime() + (duracion * 24 * 60 * 60 * 1000));
        return this.save();
    }
    throw new Error('No se puede renovar una suscripción inactiva');
};

module.exports = mongoose.model('Suscripcion', suscripcionSchema);
