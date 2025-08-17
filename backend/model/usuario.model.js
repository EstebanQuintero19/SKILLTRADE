const mongoose = require('mongoose');
const { Schema } = mongoose;

const usuarioSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        select: false
    },
    foto: {
        type: String,
        default: null
    },
    biografia: {
        type: String,
        default: ''
    },
    datosContacto: {
        telefono: String,
        direccion: String
    },
    visibilidadPerfil: {
        type: String,
        enum: ['publico', 'privado'],
        default: 'publico'
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    ultimoAcceso: {
        type: Date,
        default: Date.now
    },
    rol: {
        type: String,
        enum: ['admin', 'usuario'],
        default: 'usuario'
    },
    activo: {
        type: Boolean,
        default: true
    },
    estadisticas: {
        cursosCreados: { type: Number, default: 0 },
        intercambiosRealizados: { type: Number, default: 0 },
        suscripcionesActivas: { type: Number, default: 0 }
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

// Índices básicos
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ nombre: 'text', biografia: 'text' });

// Método para generar token JWT
usuarioSchema.methods.generarToken = function() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { _id: this._id, email: this.email, rol: this.rol }, 
        process.env.JWT_SECRET || 'skilltrade_secret_key_2024', 
        { expiresIn: '7d' }
    );
};

// Método para verificar contraseña
usuarioSchema.methods.verificarPassword = async function(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, this.password);
};

// Middleware pre-save para hashear contraseña
usuarioSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const bcrypt = require('bcryptjs');
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('Usuario', usuarioSchema);
