const mongoose = require('mongoose');
const { Schema } = mongoose;

const ventaSchema = new Schema({
    comprador: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    vendedor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    items: [{
        curso: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
            required: true
        },
        precio: {
            type: Number,
            required: true,
            min: [0, 'El precio no puede ser negativo'],
            validate: {
                validator: function(v) {
                    return Number.isFinite(v) && v >= 0;
                },
                message: 'El precio debe ser un número válido no negativo'
            }
        },
        cantidad: {
            type: Number,
            default: 1,
            min: [1, 'La cantidad mínima es 1'],
            validate: {
                validator: function(v) {
                    return Number.isInteger(v) && v >= 1;
                },
                message: 'La cantidad debe ser un número entero mayor a 0'
            }
        }
    }],
    total: {
        type: Number,
        required: true,
        min: [0, 'El total no puede ser negativo'],
        validate: {
            validator: function(v) {
                return Number.isFinite(v) && v >= 0;
            },
            message: 'El total debe ser un número válido no negativo'
        }
    },
    estado: {
        type: String,
        enum: ['pendiente', 'completada', 'cancelada'],
        default: 'pendiente'
    },
    metodoPago: {
        tipo: {
            type: String,
            enum: ['tarjeta', 'paypal', 'transferencia'],
            required: true
        }
    },
    fechaCompra: {
        type: Date,
        default: Date.now
    },
    direccionEnvio: {
        nombre: {
            type: String,
            required: true,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres']
        },
        direccion: {
            type: String,
            required: true,
            maxlength: [200, 'La dirección no puede exceder 200 caracteres']
        },
        ciudad: {
            type: String,
            required: true,
            maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
        },
        codigoPostal: {
            type: String,
            required: true,
            maxlength: [10, 'El código postal no puede exceder 10 caracteres']
        },
        pais: {
            type: String,
            required: true,
            maxlength: [100, 'El país no puede exceder 100 caracteres']
        },
        telefono: {
            type: String,
            required: true,
            match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Formato de teléfono inválido']
        }
    },
    facturacion: {
        nombre: {
            type: String,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres']
        },
        rfc: {
            type: String,
            match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'RFC inválido']
        },
        direccion: {
            type: String,
            maxlength: [200, 'La dirección no puede exceder 200 caracteres']
        },
        ciudad: {
            type: String,
            maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
        },
        codigoPostal: {
            type: String,
            maxlength: [10, 'El código postal no puede exceder 10 caracteres']
        },
        pais: {
            type: String,
            maxlength: [100, 'El país no puede exceder 100 caracteres']
        }
    },
    tracking: {
        numero: {
            type: String,
            maxlength: [50, 'El número de tracking no puede exceder 50 caracteres']
        },
        empresa: {
            type: String,
            maxlength: [100, 'El nombre de la empresa no puede exceder 100 caracteres']
        },
        estado: {
            type: String,
            enum: ['enviado', 'en_transito', 'entregado', 'devuelto'],
            default: 'enviado'
        },
        fechaEnvio: Date,
        fechaEntrega: Date,
        historial: [{
            fecha: {
                type: Date,
                required: true
            },
            estado: {
                type: String,
                required: true
            },
            ubicacion: {
                type: String,
                maxlength: [200, 'La ubicación no puede exceder 200 caracteres']
            },
            descripcion: {
                type: String,
                maxlength: [500, 'La descripción no puede exceder 500 caracteres']
            }
        }]
    },
    calificacion: {
        puntuacion: { 
            type: Number, 
            min: [1, 'La puntuación mínima es 1'], 
            max: [5, 'La puntuación máxima es 5'],
            validate: {
                validator: function(v) {
                    if (!v) return true; // Opcional
                    return Number.isInteger(v) && v >= 1 && v <= 5;
                },
                message: 'La puntuación debe ser un número entero entre 1 y 5'
            }
        },
        comentario: {
            type: String,
            maxlength: [500, 'El comentario no puede exceder 500 caracteres'],
            validate: {
                validator: function(v) {
                    if (!v) return true; // Opcional
                    return v.length > 0;
                },
                message: 'El comentario no puede estar vacío si se proporciona'
            }
        },
        fecha: Date
    },
    reembolso: {
        solicitado: {
            type: Boolean,
            default: false
        },
        fechaSolicitud: Date,
        motivo: {
            type: String,
            maxlength: [500, 'El motivo no puede exceder 500 caracteres']
        },
        estado: {
            type: String,
            enum: ['pendiente', 'aprobado', 'rechazado', 'procesado'],
            default: 'pendiente'
        },
        monto: {
            type: Number,
            min: [0, 'El monto no puede ser negativo'],
            validate: {
                validator: function(v) {
                    if (!v) return true; // Opcional
                    return Number.isFinite(v) && v >= 0;
                },
                message: 'El monto debe ser un número válido no negativo'
            }
        },
        fechaProcesamiento: Date,
        metodoReembolso: {
            type: String,
            enum: ['original', 'credito', 'transferencia']
        }
    },
    metadata: {
        ipCompra: String,
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
        },
        utm: {
            source: String,
            medium: String,
            campaign: String,
            term: String,
            content: String
        }
    }
}, {
    collection: 'ventas',
    timestamps: true
});

ventaSchema.index({ comprador: 1 });
ventaSchema.index({ vendedor: 1 });
ventaSchema.index({ estado: 1 });

ventaSchema.virtual('sePuedeCancelar').get(function() {
    // El enum de estado es ['pendiente','completada','cancelada']
    return this.estado === 'pendiente';
});

ventaSchema.virtual('sePuedeReembolsar').get(function() {
    return this.estado === 'completada' && !this.reembolso.solicitado;
});

ventaSchema.methods.completar = function() {
    this.estado = 'completada';
    return this.save();
};

ventaSchema.methods.cancelar = function() {
    this.estado = 'cancelada';
    return this.save();
};

ventaSchema.methods.agregarTracking = function(numero, empresa) {
    this.tracking.numero = numero;
    this.tracking.empresa = empresa;
    this.tracking.fechaEnvio = new Date();
    
    return this.save();
};

// Recalcular total antes de guardar para garantizar integridad
ventaSchema.pre('save', function(next) {
    if (Array.isArray(this.items)) {
        this.total = this.items.reduce((acc, item) => acc + (Number(item.precio) * Number(item.cantidad || 1)), 0);
    }
    next();
});

module.exports = mongoose.model('Venta', ventaSchema);
