const mongoose = require('mongoose');
const { Schema } = mongoose;

const exchangeSchema = new Schema({
    emisor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El emisor es obligatorio']
    },
    receptor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El receptor es obligatorio'],
        validate: {
            validator: function(v) {
                return v && this.emisor && v.toString() !== this.emisor.toString();
            },
            message: 'El emisor y receptor no pueden ser el mismo usuario'
        }
    },
    cursoEmisor: {
        type: Schema.Types.ObjectId,
        ref: 'Curso',
        required: [true, 'El curso del emisor es obligatorio']
    },
    cursoReceptor: {
        type: Schema.Types.ObjectId,
        ref: 'Curso',
        required: [true, 'El curso del receptor es obligatorio'],
        validate: {
            validator: function(v) {
                return v && this.cursoEmisor && v.toString() !== this.cursoEmisor.toString();
            },
            message: 'Los cursos del emisor y receptor no pueden ser el mismo'
        }
    },
    estado: {
        type: String,
        enum: {
            values: ['pendiente', 'aceptado', 'rechazado', 'activo', 'finalizado', 'cancelado'],
            message: 'El estado debe ser pendiente, aceptado, rechazado, activo, finalizado o cancelado'
        },
        default: 'pendiente'
    },
    fechaSolicitud: {
        type: Date,
        default: Date.now,
        validate: {
            validator: function(v) {
                return !v || v <= new Date();
            },
            message: 'La fecha de solicitud no puede ser futura'
        }
    },
    fechaInicio: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                if (!this.fechaSolicitud) return true; // Si no hay fecha de solicitud, permitir
                return v >= this.fechaSolicitud;
            },
            message: 'La fecha de inicio debe ser posterior a la fecha de solicitud'
        }
    },
    fechaFin: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                if (!this.fechaInicio) return true; // Si no hay fecha de inicio, permitir
                return v > this.fechaInicio;
            },
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        }
    },
    duracion: {
        type: Number,
        required: [true, 'La duración es obligatoria'],
        min: [1, 'La duración mínima es 1 día'],
        max: [365, 'La duración máxima es 365 días'],
        validate: {
            validator: function(v) {
                return Number.isInteger(v) && v > 0;
            },
            message: 'La duración debe ser un número entero positivo'
        }
    },
    comentarios: [{
        usuario: { 
            type: Schema.Types.ObjectId, 
            ref: 'Usuario',
            required: [true, 'El usuario del comentario es obligatorio']
        },
        contenido: { 
            type: String,
            required: [true, 'El contenido del comentario es obligatorio'],
            minlength: [3, 'El comentario debe tener al menos 3 caracteres'],
            maxlength: [500, 'El comentario no puede exceder 500 caracteres'],
            trim: true
        },
        fecha: { 
            type: Date, 
            default: Date.now 
        }
    }],
    calificacionEmisor: {
        puntuacion: { 
            type: Number, 
            min: [1, 'La puntuación mínima es 1'], 
            max: [5, 'La puntuación máxima es 5'],
            validate: {
                validator: function(v) {
                    const c = this.calificacionEmisor || {};
                    if (c.comentario || c.fecha) {
                        return Number.isInteger(v) && v >= 1 && v <= 5;
                    }
                    return true; // Si no hay comentario ni fecha, la puntuación es opcional
                },
                message: 'La puntuación debe ser un número entero entre 1 y 5'
            }
        },
        comentario: { 
            type: String,
            maxlength: [300, 'El comentario no puede exceder 300 caracteres'],
            trim: true
        },
        fecha: Date
    },
    calificacionReceptor: {
        puntuacion: { 
            type: Number, 
            min: [1, 'La puntuación mínima es 1'], 
            max: [5, 'La puntuación máxima es 5'],
            validate: {
                validator: function(v) {
                    const c = this.calificacionReceptor || {};
                    if (c.comentario || c.fecha) {
                        return Number.isInteger(v) && v >= 1 && v <= 5;
                    }
                    return true; // Si no hay comentario ni fecha, la puntuación es opcional
                },
                message: 'La puntuación debe ser un número entero entre 1 y 5'
            }
        },
        comentario: { 
            type: String,
            maxlength: [300, 'El comentario no puede exceder 300 caracteres'],
            trim: true
        },
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
exchangeSchema.index({ fechaSolicitud: -1 });

// Índice parcial único para evitar múltiples intercambios activos/pendientes entre el mismo par y cursos
exchangeSchema.index(
    { emisor: 1, receptor: 1, cursoEmisor: 1, cursoReceptor: 1, estado: 1 },
    { unique: true, partialFilterExpression: { estado: { $in: ['pendiente', 'activo'] } } }
);

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

// Método para verificar si está próximo a vencer
exchangeSchema.methods.proximoAVencer = function() {
    if (this.fechaFin) {
        const ahora = new Date();
        const diasRestantes = Math.ceil((this.fechaFin - ahora) / (1000 * 60 * 60 * 24));
        return diasRestantes <= 7 && diasRestantes > 0;
    }
    return false;
};

// Método para aceptar intercambio
exchangeSchema.methods.aceptar = function() {
    this.estado = 'aceptado';
    this.fechaInicio = new Date();
    this.fechaFin = new Date(Date.now() + (this.duracion * 24 * 60 * 60 * 1000));
    return this.save();
};

// Método para rechazar intercambio
exchangeSchema.methods.rechazar = function() {
    this.estado = 'rechazado';
    return this.save();
};

// Método para cancelar intercambio
exchangeSchema.methods.cancelar = function() {
    if (['pendiente', 'aceptado'].includes(this.estado)) {
        this.estado = 'cancelado';
        return this.save();
    }
    throw new Error('No se puede cancelar un intercambio en este estado');
};

module.exports = mongoose.model('Exchange', exchangeSchema);
