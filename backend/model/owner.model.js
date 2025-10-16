/**
 * Modelo de Propietario (Owner) - SkillTrade
 * 
 * Representa a los creadores de contenido y propietarios de cursos:
 * - Extensión del modelo de usuario para creadores
 * - Gestión de cursos creados y suscriptores
 * - Sistema de calificaciones y reputación
 * - Configuración de precios de suscripción
 * - Estadísticas de engagement y popularidad
 * 
 * Características principales:
 * - Relación 1:1 con usuario (un usuario puede ser owner)
 * - Lista de cursos creados por el propietario
 * - Contador de suscriptores activos
 * - Sistema de rating promedio (0-5 estrellas)
 * - Valor de suscripción configurable
 * - Validaciones de integridad de datos numéricos
 * 
 * Funcionalidades del sistema:
 * - Conversión de usuarios regulares a creadores
 * - Tracking de popularidad y engagement
 * - Monetización a través de suscripciones
 * - Sistema de reputación basado en calificaciones
 * - Gestión centralizada de contenido creado
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Esquema de Propietario
 * 
 * Estructura para gestionar creadores de contenido con
 * estadísticas, cursos y configuración de monetización.
 */
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

// Índices básicos (usuario ya tiene índice único por el campo 'unique: true')
ownerSchema.index({ rating: -1 });


ownerSchema.methods.calcularRatingPromedio = function() {
    return this.rating;
};

module.exports = mongoose.model('Owner', ownerSchema);
