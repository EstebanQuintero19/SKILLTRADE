const mongoose = require('mongoose');
const { Schema } = mongoose;

const exchangeSchema = new Schema({
    emisor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    receptor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    cursoEmisor: {
        type: Schema.Types.ObjectId,
        ref: 'Curso',
        required: true
    },
    cursoReceptor: {
        type: Schema.Types.ObjectId,
        ref: 'Curso',
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'aceptado', 'rechazado', 'activo', 'finalizado', 'cancelado'],
        default: 'pendiente'
    },
    fechaSolicitud: {
        type: Date,
        default: Date.now
    },
    fechaInicio: Date,
    fechaFin: Date,
    duracion: {
        type: Number,
        required: true,
        min: 1,
        max: 365
    },
    comentarios: [{
        usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
        contenido: String,
        fecha: { type: Date, default: Date.now }
    }],
    calificacionEmisor: {
        puntuacion: { type: Number, min: 1, max: 5 },
        comentario: String,
        fecha: Date
    },
    calificacionReceptor: {
        puntuacion: { type: Number, min: 1, max: 5 },
        comentario: String,
        fecha: Date
    },
}, {
    collection: 'exchanges',
    timestamps: true
});

// Índices básicos
exchangeSchema.index({ emisor: 1 });
exchangeSchema.index({ receptor: 1 });
exchangeSchema.index({ estado: 1 });

// Virtual para estado del intercambio
exchangeSchema.virtual('estadoDetallado').get(function() {
    if (this.estado === 'activo' && this.fechaFin) {
        const ahora = new Date();
        if (ahora > this.fechaFin) {
            return 'vencido';
        } else if (this.proximoAVencer()) {
            return 'proximo_a_vencer';
        }
    }
    return this.estado;
});

// Método para aceptar intercambio
exchangeSchema.methods.aceptar = function() {
    this.estado = 'aceptado';
    this.fechaInicio = new Date();
    this.fechaFin = new Date(Date.now() + (this.duracion * 24 * 60 * 60 * 1000));
    return this.save();
};

module.exports = mongoose.model('Exchange', exchangeSchema);
