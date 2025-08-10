const mongoose = require('mongoose');
const { Schema } = mongoose;

const suscripcionSchema = new Schema({
    suscriptor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El suscriptor es obligatorio'],
        index: true
    },
    creador: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El creador del contenido es obligatorio'],
        index: true
    },
    plan: {
        tipo: {
            type: String,
            enum: {
                values: ['mensual', 'trimestral', 'semestral', 'anual'],
                message: 'El tipo de plan debe ser "mensual", "trimestral", "semestral" o "anual"'
            },
            required: [true, 'El tipo de plan es obligatorio']
        },
        precio: {
            type: Number,
            required: [true, 'El precio del plan es obligatorio'],
            min: [0, 'El precio no puede ser negativo'],
            max: [1000000, 'El precio no puede exceder 1,000,000']
        },
        duracion: {
            type: Number, // en días
            required: [true, 'La duración del plan es obligatoria'],
            min: [1, 'La duración mínima es 1 día'],
            max: [365, 'La duración máxima es 365 días']
        },
        nombre: {
            type: String,
            required: true,
            maxlength: [100, 'El nombre del plan no puede exceder 100 caracteres']
        },
        descripcion: {
            type: String,
            maxlength: [500, 'La descripción no puede exceder 500 caracteres']
        },
        caracteristicas: [{
            nombre: {
                type: String,
                required: true,
                maxlength: [100, 'El nombre de la característica no puede exceder 100 caracteres']
            },
            descripcion: {
                type: String,
                maxlength: [200, 'La descripción no puede exceder 200 caracteres']
            },
            activa: {
                type: Boolean,
                default: true
            }
        }]
    },
    fechaInicio: {
        type: Date,
        required: true,
        default: Date.now,
        immutable: true
    },
    fechaFin: {
        type: Date,
        required: [true, 'La fecha de fin es obligatoria'],
        validate: {
            validator: function(v) {
                return v > this.fechaInicio;
            },
            message: 'La fecha de fin debe ser posterior al inicio'
        }
    },
    estado: {
        type: String,
        enum: {
            values: ['activa', 'vencida', 'cancelada', 'suspendida'],
            message: 'Estado inválido'
        },
        default: 'activa',
        index: true
    },
    renovacionAutomatica: {
        type: Boolean,
        default: true
    },
    metodoPago: {
        tipo: {
            type: String,
            enum: ['tarjeta', 'paypal', 'transferencia', 'efectivo'],
            required: true
        },
        ultimos4: {
            type: String,
            match: [/^\d{4}$/, 'Los últimos 4 dígitos deben ser números']
        },
        marca: {
            type: String,
            enum: ['visa', 'mastercard', 'amex', 'discover', 'otro']
        },
        token: {
            type: String,
            select: false // No incluir en consultas por defecto
        },
        fechaVencimiento: {
            type: String,
            match: [/^\d{2}\/\d{2}$/, 'Formato de fecha inválido (MM/YY)']
        }
    },
    proximoPago: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                return v > this.fechaInicio;
            },
            message: 'La fecha del próximo pago debe ser posterior al inicio'
        }
    },
    beneficios: [{
        nombre: {
            type: String,
            required: true,
            maxlength: [100, 'El nombre del beneficio no puede exceder 100 caracteres']
        },
        descripcion: {
            type: String,
            maxlength: [300, 'La descripción no puede exceder 300 caracteres']
        },
        activo: { 
            type: Boolean, 
            default: true 
        },
        fechaActivacion: {
            type: Date,
            default: Date.now
        }
    }],
    calificacion: {
        puntuacion: { 
            type: Number, 
            min: [1, 'La puntuación mínima es 1'], 
            max: [5, 'La puntuación máxima es 5'] 
        },
        comentario: {
            type: String,
            maxlength: [500, 'El comentario no puede exceder 500 caracteres']
        },
        fecha: Date
    },
    notificaciones: {
        vencimiento: { 
            type: Boolean, 
            default: true 
        },
        nuevosCursos: { 
            type: Boolean, 
            default: true 
        },
        recordatorios: { 
            type: Boolean, 
            default: true 
        },
        promociones: {
            type: Boolean,
            default: true
        }
    },
    historialPagos: [{
        fecha: {
            type: Date,
            required: true
        },
        monto: {
            type: Number,
            required: true,
            min: [0, 'El monto no puede ser negativo']
        },
        estado: { 
            type: String, 
            enum: ['exitoso', 'fallido', 'pendiente', 'reembolsado'],
            required: true
        },
        referencia: {
            type: String,
            required: true,
            unique: true
        },
        metodoPago: {
            type: String,
            required: true
        },
        descripcion: {
            type: String,
            maxlength: [200, 'La descripción no puede exceder 200 caracteres']
        }
    }],
    cupones: [{
        codigo: {
            type: String,
            required: true,
            uppercase: true
        },
        descuento: {
            type: Number,
            required: true,
            min: [0, 'El descuento no puede ser negativo'],
            max: [100, 'El descuento no puede exceder 100%']
        },
        tipo: {
            type: String,
            enum: ['porcentaje', 'monto_fijo'],
            required: true
        },
        aplicado: {
            type: Boolean,
            default: false
        },
        fechaAplicacion: Date
    }],
    metadata: {
        ipSuscripcion: String,
        dispositivo: String,
        navegador: String,
        ubicacion: {
            pais: String,
            ciudad: String,
            zonaHoraria: String
        },
        referido: {
            codigo: String,
            usuario: Schema.Types.ObjectId
        }
    }
}, {
    collection: 'suscripciones',
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Calcular días restantes
            if (ret.fechaFin && ret.estado === 'activa') {
                const ahora = new Date();
                const diasRestantes = Math.ceil((ret.fechaFin - ahora) / (1000 * 60 * 60 * 24));
                ret.diasRestantes = diasRestantes > 0 ? diasRestantes : 0;
            }
            return ret;
        }
    }
});

// Índices para mejorar consultas
suscripcionSchema.index({ suscriptor: 1, estado: 1 });
suscripcionSchema.index({ creador: 1, estado: 1 });
suscripcionSchema.index({ fechaFin: 1, estado: 1 });
suscripcionSchema.index({ proximoPago: 1 });
suscripcionSchema.index({ 'plan.tipo': 1, estado: 1 });

// Índices compuestos para consultas frecuentes
suscripcionSchema.index({ suscriptor: 1, creador: 1 });
suscripcionSchema.index({ estado: 1, fechaFin: 1 });
suscripcionSchema.index({ suscriptor: 1, fechaInicio: -1 });

// Virtual para días restantes
suscripcionSchema.virtual('diasRestantes').get(function() {
    if (this.fechaFin && this.estado === 'activa') {
        const ahora = new Date();
        const diasRestantes = Math.ceil((this.fechaFin - ahora) / (1000 * 60 * 60 * 24));
        return diasRestantes > 0 ? diasRestantes : 0;
    }
    return null;
});

// Virtual para porcentaje de tiempo consumido
suscripcionSchema.virtual('porcentajeConsumido').get(function() {
    if (this.fechaInicio && this.fechaFin) {
        const total = this.fechaFin - this.fechaInicio;
        const consumido = new Date() - this.fechaInicio;
        return Math.min(100, Math.max(0, (consumido / total) * 100));
    }
    return 0;
});

// Virtual para estado detallado
suscripcionSchema.virtual('estadoDetallado').get(function() {
    if (this.estado === 'activa' && this.fechaFin) {
        const ahora = new Date();
        if (ahora > this.fechaFin) {
            return 'vencida';
        } else if (this.proximaAVencer()) {
            return 'proxima_a_vencer';
        }
    }
    return this.estado;
});

// Método para verificar si la suscripción está activa
suscripcionSchema.methods.estaActiva = function() {
    const ahora = new Date();
    return this.estado === 'activa' && this.fechaFin > ahora;
};

// Método para verificar si está próxima a vencer
suscripcionSchema.methods.proximaAVencer = function() {
    const ahora = new Date();
    if (!this.fechaFin) return false;
    
    const diasRestantes = Math.ceil((this.fechaFin - ahora) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 7 && diasRestantes > 0;
};

// Método para renovar suscripción
suscripcionSchema.methods.renovar = function() {
    if (this.renovacionAutomatica && this.estado === 'activa') {
        this.fechaInicio = new Date();
        this.fechaFin = new Date(this.fechaInicio.getTime() + (this.plan.duracion * 24 * 60 * 60 * 1000));
        this.proximoPago = this.fechaFin;
        
        // Agregar al historial de pagos
        this.historialPagos.push({
            fecha: new Date(),
            monto: this.plan.precio,
            estado: 'exitoso',
            referencia: `REN_${Date.now()}`,
            metodoPago: this.metodoPago.tipo,
            descripcion: 'Renovación automática'
        });
        
        return this.save();
    }
    return false;
};

// Método para cancelar suscripción
suscripcionSchema.methods.cancelar = function(motivo = '') {
    if (this.estado === 'activa') {
        this.estado = 'cancelada';
        this.renovacionAutomatica = false;
        
        // Agregar comentario de cancelación
        if (motivo) {
            this.calificacion = {
                puntuacion: 0,
                comentario: `Cancelada: ${motivo}`,
                fecha: new Date()
            };
        }
        
        return this.save();
    }
    return false;
};

// Método para suspender suscripción
suscripcionSchema.methods.suspender = function(motivo = '') {
    if (this.estado === 'activa') {
        this.estado = 'suspendida';
        
        // Agregar comentario de suspensión
        if (motivo) {
            this.calificacion = {
                puntuacion: 0,
                comentario: `Suspendida: ${motivo}`,
                fecha: new Date()
            };
        }
        
        return this.save();
    }
    return false;
};

// Método para agregar beneficio
suscripcionSchema.methods.agregarBeneficio = function(nombre, descripcion) {
    this.beneficios.push({
        nombre,
        descripcion,
        activo: true,
        fechaActivacion: new Date()
    });
    
    return this.save();
};

// Método para aplicar cupón
suscripcionSchema.methods.aplicarCupon = function(codigo, descuento, tipo) {
    const cupon = {
        codigo: codigo.toUpperCase(),
        descuento,
        tipo,
        aplicado: true,
        fechaAplicacion: new Date()
    };
    
    this.cupones.push(cupon);
    
    // Aplicar descuento al precio del plan
    if (tipo === 'porcentaje') {
        this.plan.precio = this.plan.precio * (1 - descuento / 100);
    } else {
        this.plan.precio = Math.max(0, this.plan.precio - descuento);
    }
    
    return this.save();
};

// Método para agregar pago al historial
suscripcionSchema.methods.agregarPago = function(monto, estado, referencia, metodoPago, descripcion = '') {
    this.historialPagos.push({
        fecha: new Date(),
        monto,
        estado,
        referencia,
        metodoPago,
        descripcion
    });
    
    return this.save();
};

// Método para calificar suscripción
suscripcionSchema.methods.calificar = function(puntuacion, comentario = '') {
    if (puntuacion < 1 || puntuacion > 5) {
        throw new Error('La puntuación debe estar entre 1 y 5');
    }
    
    this.calificacion = {
        puntuacion,
        comentario,
        fecha: new Date()
    };
    
    return this.save();
};

// Middleware pre-save para validaciones
suscripcionSchema.pre('save', function(next) {
    try {
        // Validar que suscriptor y creador sean diferentes
        if (this.suscriptor.toString() === this.creador.toString()) {
            throw new Error('El suscriptor y creador no pueden ser el mismo usuario');
        }
        
        // Validar fechas
        if (this.fechaInicio && this.fechaFin && this.fechaInicio >= this.fechaFin) {
            throw new Error('La fecha de fin debe ser posterior al inicio');
        }
        
        // Validar que el precio no sea negativo después de aplicar cupones
        if (this.plan.precio < 0) {
            this.plan.precio = 0;
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware post-save para logging
suscripcionSchema.post('save', function(doc) {
    console.log(`Suscripción ${doc._id} ${doc.isNew ? 'creada' : 'actualizada'} - Estado: ${doc.estado}`);
});

module.exports = mongoose.model('Suscripcion', suscripcionSchema);
