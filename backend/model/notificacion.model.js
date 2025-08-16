const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificacionSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tipo: {
        type: String,
        enum: ['intercambio', 'curso', 'suscripcion', 'sistema'],
        required: true
    },
    titulo: {
        type: String,
        required: true,
        maxlength: 100
    },
    mensaje: {
        type: String,
        required: true,
        maxlength: 500
    },
    leida: {
        type: Boolean,
        default: false
    },



}, {
    collection: 'notificaciones',
    timestamps: true
});

// Índices básicos
notificacionSchema.index({ usuario: 1, leida: 1 });
notificacionSchema.index({ usuario: 1, createdAt: -1 });

// Método para marcar como leída
notificacionSchema.methods.marcarComoLeida = function() {
    this.leida = true;
    return this.save();
};









// Método estático para obtener notificaciones no leídas
notificacionSchema.statics.obtenerNoLeidas = function(usuarioId) {
    return this.find({ usuario: usuarioId, leida: false })
               .sort({ createdAt: -1 })
               .limit(50);
};

module.exports = mongoose.model('Notificacion', notificacionSchema);
