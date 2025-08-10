const mongoose = require('mongoose');
const { Schema } = mongoose;

const usuarioSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
        trim: true,
        match: [/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
            'Formato de email inválido'
        ],
        index: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        select: false // No incluir en consultas por defecto
    },
    foto: {
        type: String,
        default: null,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'URL de imagen inválida'
        }
    },
    biografia: {
        type: String,
        maxlength: [500, 'La biografía no puede exceder 500 caracteres'],
        default: '',
        trim: true
    },
    datosContacto: {
        telefono: {
            type: String,
            match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Formato de teléfono inválido']
        },
        direccion: {
            type: String,
            maxlength: [200, 'La dirección no puede exceder 200 caracteres']
        },
        redesSociales: {
            linkedin: {
                type: String,
                match: [/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/, 'URL de LinkedIn inválida']
            },
            twitter: {
                type: String,
                match: [/^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/, 'URL de Twitter inválida']
            },
            github: {
                type: String,
                match: [/^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/, 'URL de GitHub inválida']
            }
        }
    },
    visibilidadPerfil: {
        type: String,
        enum: {
            values: ['publico', 'privado'],
            message: 'La visibilidad debe ser "publico" o "privado"'
        },
        default: 'publico'
    },
    fechaRegistro: {
        type: Date,
        required: true,
        default: Date.now,
        immutable: true // No se puede modificar después de la creación
    },
    ultimoAcceso: {
        type: Date,
        default: Date.now
    },
    rol: {
        type: String,
        enum: {
            values: ['admin', 'usuario', 'moderador'],
            message: 'Rol inválido'
        },
        default: 'usuario'
    },
    activo: {
        type: Boolean,
        default: true,
        index: true
    },
    estadisticas: {
        cursosCreados: { 
            type: Number, 
            default: 0, 
            min: [0, 'No puede ser negativo'] 
        },
        cursosCompartidos: { 
            type: Number, 
            default: 0, 
            min: [0, 'No puede ser negativo'] 
        },
        intercambiosRealizados: { 
            type: Number, 
            default: 0, 
            min: [0, 'No puede ser negativo'] 
        },
        suscripcionesActivas: { 
            type: Number, 
            default: 0, 
            min: [0, 'No puede ser negativo'] 
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        },
        dispositivo: {
            type: String,
            required: true
        },
        fechaCreacion: { 
            type: Date, 
            default: Date.now,
            expires: 7 * 24 * 60 * 60 * 1000 // Expira en 7 días
        },
        ultimoUso: {
            type: Date,
            default: Date.now
        }
    }],
    preferencias: {
        idioma: {
            type: String,
            enum: ['es', 'en', 'pt'],
            default: 'es'
        },
        zonaHoraria: {
            type: String,
            default: 'America/Bogota'
        },
        notificaciones: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: false },
            sms: { type: Boolean, default: false }
        }
    }
}, {
    collection: 'usuarios',
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.tokens;
            return ret;
        }
    },
    toObject: { 
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.tokens;
            return ret;
        }
    }
});

// Índices para mejorar consultas
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ rol: 1, activo: 1 });
usuarioSchema.index({ 'estadisticas.cursosCreados': -1 });
usuarioSchema.index({ fechaRegistro: -1 });

// Índice de texto para búsquedas
usuarioSchema.index({ 
    nombre: 'text', 
    biografia: 'text' 
});

// Virtual para nombre completo
usuarioSchema.virtual('nombreCompleto').get(function() {
    return this.nombre;
});

// Virtual para edad (si se agrega fecha de nacimiento)
usuarioSchema.virtual('edad').get(function() {
    if (this.fechaNacimiento) {
        return Math.floor((new Date() - this.fechaNacimiento) / (365.25 * 24 * 60 * 60 * 1000));
    }
    return null;
});

// Método para generar token JWT
usuarioSchema.methods.generarToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { 
            _id: this._id,
            email: this.email,
            rol: this.rol 
        }, 
        process.env.JWT_SECRET || 'secret_key', 
        { 
            expiresIn: '7d',
            issuer: 'skilltrade',
            audience: 'skilltrade-users'
        }
    );
};

// Método para verificar contraseña
usuarioSchema.methods.verificarPassword = async function(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this.password);
};

// Método para hashear contraseña
usuarioSchema.methods.hashearPassword = async function() {
    const bcrypt = require('bcryptjs');
    if (this.isModified('password')) {
        const saltRounds = 12; // Aumentar seguridad
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
};

// Método para actualizar último acceso
usuarioSchema.methods.actualizarUltimoAcceso = function() {
    this.ultimoAcceso = new Date();
    return this.save();
};

// Método para agregar token de sesión
usuarioSchema.methods.agregarToken = function(token, dispositivo) {
    // Limpiar tokens expirados
    this.tokens = this.tokens.filter(t => t.fechaCreacion > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    // Agregar nuevo token
    this.tokens.push({ token, dispositivo });
    return this.save();
};

// Método para remover token
usuarioSchema.methods.removerToken = function(token) {
    this.tokens = this.tokens.filter(t => t.token !== token);
    return this.save();
};

// Método para limpiar tokens expirados
usuarioSchema.methods.limpiarTokensExpirados = function() {
    const ahora = new Date();
    this.tokens = this.tokens.filter(t => t.fechaCreacion > new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000));
    return this.save();
};

// Middleware pre-save para hashear contraseña
usuarioSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password')) {
            await this.hashearPassword();
        }
        
        // Actualizar estadísticas si es necesario
        if (this.isModified('estadisticas')) {
            // Validar que las estadísticas no sean negativas
            Object.keys(this.estadisticas).forEach(key => {
                if (this.estadisticas[key] < 0) {
                    this.estadisticas[key] = 0;
                }
            });
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware pre-update para hashear contraseña en updates
usuarioSchema.pre('findOneAndUpdate', async function(next) {
    try {
        const update = this.getUpdate();
        if (update.password) {
            const bcrypt = require('bcryptjs');
            update.password = await bcrypt.hash(update.password, 12);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware post-save para logging
usuarioSchema.post('save', function(doc) {
    console.log(`Usuario ${doc.email} ${doc.isNew ? 'creado' : 'actualizado'}`);
});

module.exports = mongoose.model('Usuario', usuarioSchema);
