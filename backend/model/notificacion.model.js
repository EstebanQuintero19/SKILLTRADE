const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificacionSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio']
    },
    tipo: {
        type: String,
        enum: {
            values: ['intercambio', 'curso', 'suscripcion', 'sistema'],
            message: 'El tipo debe ser intercambio, curso, suscripcion o sistema'
        },
        required: [true, 'El tipo de notificación es obligatorio']
    },
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        maxlength: [100, 'El título no puede exceder 100 caracteres'],
        trim: true
    },
    mensaje: {
        type: String,
        required: [true, 'El mensaje es obligatorio'],
        maxlength: [500, 'El mensaje no puede exceder 500 caracteres'],
        trim: true
    },
    leida: {
        type: Boolean,
        default: false
    },
    prioridad: {
        type: String,
        enum: {
            values: ['baja', 'media', 'alta'],
            message: 'La prioridad debe ser baja, media o alta'
        },
        default: 'media'
    },
    accion: {
        tipo: {
            type: String,
            enum: ['navegar', 'abrir', 'dismiss'],
            default: 'navegar'
        },
        url: {
            type: String,
            maxlength: [500, 'La URL no puede exceder 500 caracteres']
        }
    }
}, {
    collection: 'notificaciones',
    timestamps: true
});

// Índices básicos
notificacionSchema.index({ usuario: 1, leida: 1 });
notificacionSchema.index({ usuario: 1, createdAt: -1 });
notificacionSchema.index({ tipo: 1, createdAt: -1 });

// Método para marcar como leída
notificacionSchema.methods.marcarComoLeida = function() {
    this.leida = true;
    return this.save();
};

// Método para marcar como no leída
notificacionSchema.methods.marcarComoNoLeida = function() {
    this.leida = false;
    return this.save();
};

// Método estático para obtener notificaciones no leídas
notificacionSchema.statics.obtenerNoLeidas = function(usuarioId) {
    return this.find({ usuario: usuarioId, leida: false })
               .sort({ createdAt: -1 })
               .limit(50);
};

// Método estático para obtener notificaciones por tipo
notificacionSchema.statics.obtenerPorTipo = function(usuarioId, tipo) {
    return this.find({ usuario: usuarioId, tipo })
               .sort({ createdAt: -1 })
               .limit(20);
};

module.exports = mongoose.model('Notificacion', notificacionSchema);
