const mongoose = require('mongoose');
const { Schema } = mongoose;

const ventaSchema = new Schema({
    comprador: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El comprador es obligatorio'],
        index: true
    },
    vendedor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El vendedor es obligatorio'],
        index: true
    },
    items: [{
        curso: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
            required: [true, 'El curso es obligatorio'],
            index: true
        },
        precio: {
            type: Number,
            required: [true, 'El precio es obligatorio'],
            min: [0, 'El precio no puede ser negativo']
        },
        descuento: {
            codigo: {
                type: String,
                maxlength: [20, 'El código de descuento no puede exceder 20 caracteres']
            },
            porcentaje: { 
                type: Number, 
                min: [0, 'El porcentaje no puede ser negativo'], 
                max: [100, 'El porcentaje no puede exceder 100%'], 
                default: 0 
            },
            monto: { 
                type: Number, 
                min: [0, 'El monto no puede ser negativo'], 
                default: 0 
            }
        },
        precioFinal: {
            type: Number,
            required: [true, 'El precio final es obligatorio'],
            min: [0, 'El precio final no puede ser negativo']
        },
        cantidad: {
            type: Number,
            default: 1,
            min: [1, 'La cantidad mínima es 1'],
            max: [10, 'La cantidad máxima es 10']
        }
    }],
    cupones: [{
        codigo: {
            type: String,
            required: true,
            uppercase: true,
            maxlength: [20, 'El código no puede exceder 20 caracteres']
        },
        descuento: {
            type: Number,
            required: true,
            min: [0, 'El descuento no puede ser negativo']
        },
        tipo: { 
            type: String, 
            enum: ['porcentaje', 'monto_fijo'],
            required: true
        },
        aplicado: { 
            type: Boolean, 
            default: true 
        }
    }],
    subtotal: {
        type: Number,
        required: [true, 'El subtotal es obligatorio'],
        min: [0, 'El subtotal no puede ser negativo']
    },
    descuentoTotal: {
        type: Number,
        default: 0,
        min: [0, 'El descuento total no puede ser negativo']
    },
    impuestos: {
        porcentaje: {
            type: Number,
            default: 0,
            min: [0, 'El porcentaje de impuestos no puede ser negativo'],
            max: [100, 'El porcentaje de impuestos no puede exceder 100%']
        },
        monto: {
            type: Number,
            default: 0,
            min: [0, 'El monto de impuestos no puede ser negativo']
        }
    },
    total: {
        type: Number,
        required: [true, 'El total es obligatorio'],
        min: [0, 'El total no puede ser negativo']
    },
    estado: {
        type: String,
        enum: {
            values: ['pendiente', 'procesando', 'completada', 'cancelada', 'reembolsada', 'fallida'],
            message: 'Estado inválido'
        },
        default: 'pendiente',
        index: true
    },
    metodoPago: {
        tipo: {
            type: String,
            enum: ['tarjeta', 'paypal', 'transferencia', 'efectivo'],
            required: [true, 'El método de pago es obligatorio']
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
        referencia: {
            type: String,
            maxlength: [100, 'La referencia no puede exceder 100 caracteres']
        }
    },
    fechaCompra: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    fechaPago: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                return v >= this.fechaCompra;
            },
            message: 'La fecha de pago no puede ser anterior a la compra'
        }
    },
    fechaEntrega: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                if (this.fechaPago) {
                    return v >= this.fechaPago;
                }
                return true;
            },
            message: 'La fecha de entrega no puede ser anterior al pago'
        }
    },
    fechaCancelacion: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                return v >= this.fechaCompra;
            },
            message: 'La fecha de cancelación no puede ser anterior a la compra'
        }
    },
    motivoCancelacion: {
        type: String,
        maxlength: [500, 'El motivo no puede exceder 500 caracteres']
    },
    usuarioCancelacion: { 
        type: Schema.Types.ObjectId, 
        ref: 'Usuario' 
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
            max: [5, 'La puntuación máxima es 5'] 
        },
        comentario: {
            type: String,
            maxlength: [500, 'El comentario no puede exceder 500 caracteres']
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
            min: [0, 'El monto no puede ser negativo']
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
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Calcular totales en tiempo real
            ret.subtotal = doc.calcularSubtotal();
            ret.descuentoTotal = doc.calcularDescuentoTotal();
            ret.total = doc.calcularTotal();
            return ret;
        }
    }
});

// Índices para mejorar consultas
ventaSchema.index({ comprador: 1, fechaCompra: -1 });
ventaSchema.index({ vendedor: 1, fechaCompra: -1 });
ventaSchema.index({ estado: 1, fechaCompra: -1 });
ventaSchema.index({ 'items.curso': 1 });
ventaSchema.index({ fechaCompra: -1 });
ventaSchema.index({ metodoPago: 1 });

// Índices compuestos para consultas frecuentes
ventaSchema.index({ comprador: 1, estado: 1 });
ventaSchema.index({ vendedor: 1, estado: 1 });
ventaSchema.index({ estado: 1, fechaCompra: 1 });

// Virtual para cantidad total de items
ventaSchema.virtual('totalItems').get(function() {
    return this.items.reduce((total, item) => total + item.cantidad, 0);
});

// Virtual para verificar si la venta está completada
ventaSchema.virtual('estaCompletada').get(function() {
    return this.estado === 'completada';
});

// Virtual para verificar si se puede cancelar
ventaSchema.virtual('sePuedeCancelar').get(function() {
    return ['pendiente', 'procesando'].includes(this.estado);
});

// Virtual para verificar si se puede reembolsar
ventaSchema.virtual('sePuedeReembolsar').get(function() {
    return this.estado === 'completada' && !this.reembolso.solicitado;
});

// Método para procesar pago
ventaSchema.methods.procesarPago = function() {
    if (this.estado !== 'pendiente') {
        throw new Error('Solo se pueden procesar pagos pendientes');
    }
    
    this.estado = 'procesando';
    this.fechaPago = new Date();
    
    return this.save();
};

// Método para completar venta
ventaSchema.methods.completar = function() {
    if (this.estado !== 'procesando') {
        throw new Error('Solo se pueden completar ventas en procesamiento');
    }
    
    this.estado = 'completada';
    this.fechaEntrega = new Date();
    
    return this.save();
};

// Método para cancelar venta
ventaSchema.methods.cancelar = function(usuarioId, motivo = '') {
    if (!this.sePuedeCancelar) {
        throw new Error('No se puede cancelar esta venta');
    }
    
    this.estado = 'cancelada';
    this.motivoCancelacion = motivo;
    this.fechaCancelacion = new Date();
    this.usuarioCancelacion = usuarioId;
    
    return this.save();
};

// Método para solicitar reembolso
ventaSchema.methods.solicitarReembolso = function(motivo) {
    if (!this.sePuedeReembolsar) {
        throw new Error('No se puede solicitar reembolso para esta venta');
    }
    
    this.reembolso.solicitado = true;
    this.reembolso.fechaSolicitud = new Date();
    this.reembolso.motivo = motivo;
    this.reembolso.monto = this.total;
    
    return this.save();
};

// Método para procesar reembolso
ventaSchema.methods.procesarReembolso = function(estado, metodoReembolso = 'original') {
    if (this.reembolso.estado !== 'pendiente') {
        throw new Error('El reembolso ya fue procesado');
    }
    
    this.reembolso.estado = estado;
    this.reembolso.metodoReembolso = metodoReembolso;
    this.reembolso.fechaProcesamiento = new Date();
    
    if (estado === 'procesado') {
        this.estado = 'reembolsada';
    }
    
    return this.save();
};

// Método para agregar tracking
ventaSchema.methods.agregarTracking = function(numero, empresa) {
    this.tracking.numero = numero;
    this.tracking.empresa = empresa;
    this.tracking.fechaEnvio = new Date();
    
    return this.save();
};

// Método para actualizar estado tracking
ventaSchema.methods.actualizarTracking = function(estado, ubicacion, descripcion) {
    this.tracking.estado = estado;
    
    if (estado === 'entregado') {
        this.tracking.fechaEntrega = new Date();
    }
    
    this.tracking.historial.push({
        fecha: new Date(),
        estado,
        ubicacion,
        descripcion
    });
    
    return this.save();
};

// Método para calificar venta
ventaSchema.methods.calificar = function(puntuacion, comentario = '') {
    if (puntuacion < 1 || puntuacion > 5) {
        throw new Error('La puntuación debe estar entre 1 y 5');
    }
    
    if (this.estado !== 'completada') {
        throw new Error('Solo se pueden calificar ventas completadas');
    }
    
    this.calificacion = {
        puntuacion,
        comentario,
        fecha: new Date()
    };
    
    return this.save();
};

// Método para calcular subtotal
ventaSchema.methods.calcularSubtotal = function() {
    return this.items.reduce((total, item) => {
        return total + (item.precio * item.cantidad);
    }, 0);
};

// Método para calcular descuento total
ventaSchema.methods.calcularDescuentoTotal = function() {
    let descuentoTotal = 0;
    
    // Descuentos por item
    this.items.forEach(item => {
        if (item.descuento.porcentaje > 0) {
            descuentoTotal += (item.precio * item.cantidad * item.descuento.porcentaje) / 100;
        } else if (item.descuento.monto > 0) {
            descuentoTotal += item.descuento.monto * item.cantidad;
        }
    });
    
    // Descuentos por cupones aplicados
    this.cupones.forEach(cupon => {
        if (cupon.aplicado) {
            if (cupon.tipo === 'porcentaje') {
                descuentoTotal += (this.subtotal * cupon.descuento) / 100;
            } else {
                descuentoTotal += cupon.descuento;
            }
        }
    });
    
    return descuentoTotal;
};

// Método para calcular total
ventaSchema.methods.calcularTotal = function() {
    const subtotal = this.calcularSubtotal();
    const descuentoTotal = this.calcularDescuentoTotal();
    const impuestos = (subtotal - descuentoTotal) * (this.impuestos.porcentaje / 100);
    
    this.impuestos.monto = impuestos;
    
    return Math.max(0, subtotal - descuentoTotal + impuestos);
};

// Método para generar factura
ventaSchema.methods.generarFactura = function() {
    if (!this.facturacion.nombre || !this.facturacion.rfc) {
        throw new Error('Datos de facturación incompletos');
    }
    
    // Aquí se generaría la factura
    return {
        numero: `FAC-${this._id.toString().slice(-8).toUpperCase()}`,
        fecha: this.fechaCompra,
        cliente: this.facturacion,
        items: this.items,
        subtotal: this.subtotal,
        descuento: this.descuentoTotal,
        impuestos: this.impuestos,
        total: this.total
    };
};

// Middleware pre-save para validaciones
ventaSchema.pre('save', function(next) {
    try {
        // Validar que comprador y vendedor sean diferentes
        if (this.comprador.toString() === this.vendedor.toString()) {
            throw new Error('El comprador y vendedor no pueden ser el mismo usuario');
        }
        
        // Validar que los items tengan datos válidos
        this.items.forEach(item => {
            if (!item.curso || item.precio < 0 || item.cantidad < 1) {
                throw new Error('Datos de item inválidos');
            }
        });
        
        // Validar fechas
        if (this.fechaPago && this.fechaCompra > this.fechaPago) {
            throw new Error('La fecha de pago no puede ser anterior a la compra');
        }
        
        // Validar que el total no sea negativo
        if (this.total < 0) {
            this.total = 0;
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware post-save para logging
ventaSchema.post('save', function(doc) {
    console.log(`Venta ${doc._id} ${doc.isNew ? 'creada' : 'actualizada'} - Estado: ${doc.estado} - Total: $${doc.total}`);
});

module.exports = mongoose.model('Venta', ventaSchema);
