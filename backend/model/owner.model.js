const mongoose = require('mongoose');
const { Schema } = mongoose;

const ownerSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio'],
        unique: true
    },
    cursosCreados: [{
        type: Schema.Types.ObjectId,
        ref: 'Curso'
    }],
    suscriptores: {
        type: Number,
        min: [0, 'Los suscriptores no pueden ser negativos'],
        default: 0,
        validate: {
            validator: function(v) {
                return Number.isInteger(v) && v >= 0;
            },
            message: 'Los suscriptores deben ser un número entero no negativo'
        }
    },
    rating: {
        type: Number,
        min: [0, 'El rating no puede ser negativo'],
        max: [5, 'El rating máximo es 5'],
        default: 0,
        validate: {
            validator: function(v) {
                return Number.isFinite(v) && v >= 0 && v <= 5;
            },
            message: 'El rating debe ser un número entre 0 y 5'
        }
    },
    valorSuscripcion: {
        type: Number,
        min: [0, 'El valor de suscripción no puede ser negativo'],
        required: [true, 'El valor de suscripción es obligatorio'],
        validate: {
            validator: function(v) {
                return Number.isFinite(v) && v >= 0;
            },
            message: 'El valor de suscripción debe ser un número válido no negativo'
        }
    }
}, {
    collection: 'owner',
    timestamps: true
});

// Índices básicos
ownerSchema.index({ usuario: 1 });
ownerSchema.index({ rating: -1 });


ownerSchema.methods.calcularRatingPromedio = function() {
    return this.rating;
};

module.exports = mongoose.model('Owner', ownerSchema);
