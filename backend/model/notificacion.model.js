const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificacionSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario destinatario es obligatorio']
    },
    tipo: {
        type: String,
        enum: [
            'solicitud_intercambio',
            'intercambio_aceptado',
            'intercambio_rechazado',
            'intercambio_venciendo',
            'nuevo_curso_suscripto',
            'suscripcion_venciendo',
            'curso_comprado',
            'curso_vendido',
            'comentario_curso',
            'calificacion_curso',
            'sistema'
        ],
        required: [true, 'El tipo de notificación es obligatorio']
    },
    titulo: {
        type: String,
        required: [true, 'El título de la notificación es obligatorio'],
        maxlength: 100
    },
    mensaje: {
        type: String,
        required: [true, 'El mensaje de la notificación es obligatorio'],
        maxlength: 500
    },
    leida: {
        type: Boolean,
        default: false
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    fechaLectura: Date,
    datos: {
        // Datos adicionales según el tipo de notificación
        cursoId: Schema.Types.ObjectId,
        exchangeId: Schema.Types.ObjectId,
        suscripcionId: Schema.Types.ObjectId,
        usuarioId: Schema.Types.ObjectId,
        monto: Number,
        url: String
    },
    prioridad: {
        type: String,
        enum: ['baja', 'media', 'alta', 'urgente'],
        default: 'media'
    },
    canal: {
        email: { type: Boolean, default: true },
        plataforma: { type: Boolean, default: true },
        push: { type: Boolean, default: false }
    },
    enviada: {
        email: { type: Boolean, default: false },
        plataforma: { type: Boolean, default: true },
        push: { type: Boolean, default: false }
    },
    intentosEnvio: {
        email: { type: Number, default: 0 },
        push: { type: Number, default: 0 }
    },
    maxIntentos: {
        type: Number,
        default: 3
    }
}, {
    collection: 'notificaciones',
    timestamps: true
});

// Índices para mejorar consultas
notificacionSchema.index({ usuario: 1, leida: 1 });
notificacionSchema.index({ usuario: 1, fechaCreacion: -1 });
notificacionSchema.index({ tipo: 1, fechaCreacion: -1 });
notificacionSchema.index({ prioridad: 1, fechaCreacion: -1 });

// Método para marcar como leída
notificacionSchema.methods.marcarComoLeida = function() {
    this.leida = true;
    this.fechaLectura = new Date();
    return this.save();
};

// Método para verificar si se puede reenviar
notificacionSchema.methods.puedeReenviar = function(canal) {
    return this.intentosEnvio[canal] < this.maxIntentos;
};

// Método para incrementar intentos de envío
notificacionSchema.methods.incrementarIntentos = function(canal) {
    if (this.intentosEnvio[canal] < this.maxIntentos) {
        this.intentosEnvio[canal]++;
        return true;
    }
    return false;
};

// Método para marcar como enviada
notificacionSchema.methods.marcarComoEnviada = function(canal) {
    this.enviada[canal] = true;
    return this.save();
};

// Método estático para crear notificación
notificacionSchema.statics.crearNotificacion = function(datos) {
    return new this(datos);
};

// Método estático para obtener notificaciones no leídas
notificacionSchema.statics.obtenerNoLeidas = function(usuarioId) {
    return this.find({ usuario: usuarioId, leida: false })
               .sort({ fechaCreacion: -1 })
               .limit(50);
};

module.exports = mongoose.model('Notificacion', notificacionSchema);
