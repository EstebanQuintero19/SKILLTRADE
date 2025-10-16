/**
 * Modelo de Notificación - SkillTrade
 * 
 * Sistema de notificaciones para comunicación con usuarios:
 * - Notificaciones de intercambios (solicitudes, aceptaciones, rechazos)
 * - Notificaciones de cursos (nuevos, actualizaciones, completados)
 * - Notificaciones de suscripción (renovaciones, vencimientos)
 * - Notificaciones del sistema (mantenimiento, actualizaciones)
 * 
 * Características principales:
 * - Múltiples tipos de notificación con prioridades
 * - Sistema de acciones configurables (navegar, abrir, dismiss)
 * - Estado de lectura para seguimiento de engagement
 * - Validaciones de URLs para acciones de navegación
 * - Métodos de utilidad para gestión masiva
 * - Índices optimizados para consultas frecuentes
 * 
 * Tipos de notificación:
 * - intercambio: Relacionadas con el sistema de intercambios
 * - curso: Relacionadas con cursos y contenido educativo
 * - suscripcion: Relacionadas con planes y pagos
 * - sistema: Comunicaciones administrativas y técnicas
 * 
 * Prioridades:
 * - baja: Información general, no urgente
 * - media: Información importante, requiere atención
 * - alta: Información crítica, requiere acción inmediata
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Esquema de Notificación
 * 
 * Estructura completa para gestionar comunicaciones del sistema
 * con usuarios, incluyendo acciones y seguimiento de lectura.
 */
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
            maxlength: [500, 'La URL no puede exceder 500 caracteres'],
            validate: {
                validator: function(v) {
                    // this hace referencia al subdocumento accion
                    if (this.tipo === 'navegar' || this.tipo === 'abrir') {
                        return typeof v === 'string' && (v.startsWith('http') || v.startsWith('/'));
                    }
                    return true; // no requerida para 'dismiss'
                },
                message: 'La URL es obligatoria y debe ser válida cuando la acción es navegar o abrir'
            }
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
