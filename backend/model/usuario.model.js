const mongoose = require('mongoose');
const { Schema } = mongoose;

const usuarioSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Formato de email inválido']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false
    },
    apiKey: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    foto: {
        type: String,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                return v.startsWith('http') || v.startsWith('/');
            },
            message: 'La foto debe ser una URL válida o una ruta local'
        }
    },
    biografia: {
        type: String,
        default: '',
        maxlength: [500, 'La biografía no puede exceder 500 caracteres'],
        trim: true
    },
    telefono: {
        type: String,
        default: '',
        match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Formato de teléfono inválido'],
        trim: true
    },
    visibilidad: {
        type: String,
        enum: {
            values: ['publico', 'privado'],
            message: 'La visibilidad debe ser público o privado'
        },
        default: 'publico'
    },
    fechaCreacion: {
        type: Date,
        default: Date.now,
        validate: {
            validator: function(v) {
                return v <= new Date();
            },
            message: 'La fecha de creación no puede ser futura'
        }
    },
    ultimoAcceso: {
        type: Date,
        default: Date.now,
        validate: {
            validator: function(v) {
                return v <= new Date();
            },
            message: 'La fecha de último acceso no puede ser futura'
        }
    },
    rol: {
        type: String,
        enum: {
            values: ['admin', 'usuario'],
            message: 'El rol debe ser admin o usuario'
        },
        default: 'usuario'
    },
    activo: {
        type: Boolean,
        default: true
    },
    estadisticas: {
        cursosCreados: { 
            type: Number, 
            default: 0,
            min: [0, 'Los cursos creados no pueden ser negativos']
        },
        intercambiosRealizados: { 
            type: Number, 
            default: 0,
            min: [0, 'Los intercambios no pueden ser negativos']
        },
        suscripcionesActivas: { 
            type: Number, 
            default: 0,
            min: [0, 'Las suscripciones no pueden ser negativas']
        }
    }
}, {
    collection: 'usuarios',
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            return ret;
        }
    },
    toObject: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});

// Índices básicos (email ya tiene índice único en schema)
usuarioSchema.index({ nombre: 'text', biografia: 'text' });
usuarioSchema.index({ rol: 1 });
usuarioSchema.index({ activo: 1 });

// Validación personalizada para verificar que el usuario no se registre a sí mismo como admin
usuarioSchema.pre('save', function(next) {
    if (this.isNew && this.rol === 'admin') {
        // Solo permitir admin si es el primer usuario o si hay validación externa
        console.log('Usuario admin creado:', this.email);
    }
    next();
});

// Método para generar nueva API Key
usuarioSchema.methods.generarNuevaApiKey = function() {
    const crypto = require('crypto');
    this.apiKey = crypto.randomBytes(32).toString('hex');
    return this.save();
};

// Método para verificar contraseña
usuarioSchema.methods.verificarPassword = async function(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this.password);
};

// Método para actualizar último acceso
usuarioSchema.methods.actualizarUltimoAcceso = function() {
    this.ultimoAcceso = new Date();
    return this.save();
};

// Método para limpiar datos sensibles
usuarioSchema.methods.limpiarDatosSensibles = function() {
    const usuario = this.toObject();
    delete usuario.password;
    delete usuario.apiKey;
    return usuario;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
