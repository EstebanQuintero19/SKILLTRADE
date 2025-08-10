const mongoose = require('mongoose');
const { Schema } = mongoose;

const carritoSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio'],
        unique: true,
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
        fechaAgregado: {
            type: Date,
            default: Date.now
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
            default: false 
        },
        fechaAplicacion: Date,
        maxUsos: {
            type: Number,
            default: -1 // -1 = ilimitado
        },
        usosActuales: {
            type: Number,
            default: 0
        },
        fechaVencimiento: Date
    }],
    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'El subtotal no puede ser negativo']
    },
    descuentoTotal: {
        type: Number,
        default: 0,
        min: [0, 'El descuento total no puede ser negativo']
    },
    total: {
        type: Number,
        default: 0,
        min: [0, 'El total no puede ser negativo']
    },
    fechaCreacion: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    fechaActualizacion: {
        type: Date,
        default: Date.now
    },
    expiraEn: {
        type: Date,
        default: function() {
            // El carrito expira en 7 días
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        },
        index: true
    },
    estado: {
        type: String,
        enum: {
            values: ['activo', 'abandonado', 'convertido', 'expirado'],
            message: 'Estado inválido'
        },
        default: 'activo',
        index: true
    },
    notas: {
        type: String,
        maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    },
    direccionEnvio: {
        nombre: {
            type: String,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres']
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
        },
        telefono: {
            type: String,
            match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Formato de teléfono inválido']
        }
    },
    metodoPago: {
        tipo: {
            type: String,
            enum: ['tarjeta', 'paypal', 'transferencia', 'efectivo'],
            default: 'tarjeta'
        },
        ultimos4: {
            type: String,
            match: [/^\d{4}$/, 'Los últimos 4 dígitos deben ser números']
        },
        marca: {
            type: String,
            enum: ['visa', 'mastercard', 'amex', 'discover', 'otro']
        }
    }
}, {
    collection: 'carritos',
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
carritoSchema.index({ usuario: 1 });
carritoSchema.index({ expiraEn: 1 });
carritoSchema.index({ estado: 1 });
carritoSchema.index({ fechaCreacion: -1 });
carritoSchema.index({ 'items.curso': 1 });

// Índices compuestos para consultas frecuentes
carritoSchema.index({ usuario: 1, estado: 1 });
carritoSchema.index({ estado: 1, expiraEn: 1 });

// Virtual para cantidad total de items
carritoSchema.virtual('totalItems').get(function() {
    return this.items.reduce((total, item) => total + item.cantidad, 0);
});

// Virtual para verificar si el carrito está vacío
carritoSchema.virtual('estaVacio').get(function() {
    return this.items.length === 0;
});

// Virtual para verificar si el carrito ha expirado
carritoSchema.virtual('haExpirado').get(function() {
    return new Date() > this.expiraEn;
});

// Método para agregar curso al carrito
carritoSchema.methods.agregarCurso = function(cursoId, precio, cantidad = 1) {
    // Verificar si el curso ya está en el carrito
    const cursoExistente = this.items.find(item => 
        item.curso.toString() === cursoId.toString()
    );
    
    if (cursoExistente) {
        // Si ya existe, actualizar precio, cantidad y fecha
        cursoExistente.precio = precio;
        cursoExistente.cantidad = Math.min(10, cursoExistente.cantidad + cantidad);
        cursoExistente.precioFinal = this.calcularPrecioFinal(precio, cursoExistente.descuento);
        cursoExistente.fechaAgregado = new Date();
    } else {
        // Agregar nuevo curso
        this.items.push({
            curso: cursoId,
            precio: precio,
            precioFinal: precio,
            cantidad: Math.min(10, cantidad),
            fechaAgregado: new Date()
        });
    }
    
    // Actualizar fechas
    this.fechaActualizacion = new Date();
    this.expiraEn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Recalcular totales
    this.actualizarTotales();
    
    return this.save();
};

// Método para remover curso del carrito
carritoSchema.methods.removerCurso = function(cursoId) {
    this.items = this.items.filter(item => 
        item.curso.toString() !== cursoId.toString()
    );
    
    this.fechaActualizacion = new Date();
    this.actualizarTotales();
    
    return this.save();
};

// Método para actualizar cantidad de un curso
carritoSchema.methods.actualizarCantidad = function(cursoId, cantidad) {
    const item = this.items.find(item => 
        item.curso.toString() === cursoId.toString()
    );
    
    if (item) {
        item.cantidad = Math.max(1, Math.min(10, cantidad));
        item.precioFinal = this.calcularPrecioFinal(item.precio, item.descuento);
        item.fechaAgregado = new Date();
        
        this.fechaActualizacion = new Date();
        this.actualizarTotales();
        
        return this.save();
    }
    
    return false;
};

// Método para aplicar cupón
carritoSchema.methods.aplicarCupon = function(codigo) {
    // Verificar si el cupón ya está aplicado
    const cuponExistente = this.cupones.find(c => c.codigo === codigo.toUpperCase());
    if (cuponExistente && cuponExistente.aplicado) {
        throw new Error('Este cupón ya está aplicado');
    }
    
    // Aquí se validaría el cupón contra la base de datos
    // Por ahora simulamos la validación
    const cupon = {
        codigo: codigo.toUpperCase(),
        descuento: 10, // Ejemplo: 10% de descuento
        tipo: 'porcentaje',
        aplicado: true,
        fechaAplicacion: new Date(),
        maxUsos: -1,
        usosActuales: 0,
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
    };
    
    this.cupones.push(cupon);
    this.actualizarTotales();
    
    return this.save();
};

// Método para remover cupón
carritoSchema.methods.removerCupon = function(codigo) {
    this.cupones = this.cupones.filter(c => c.codigo !== codigo.toUpperCase());
    this.actualizarTotales();
    
    return this.save();
};

// Método para limpiar carrito
carritoSchema.methods.limpiar = function() {
    this.items = [];
    this.cupones = [];
    this.subtotal = 0;
    this.descuentoTotal = 0;
    this.total = 0;
    this.fechaActualizacion = new Date();
    
    return this.save();
};

// Método para calcular subtotal
carritoSchema.methods.calcularSubtotal = function() {
    return this.items.reduce((total, item) => {
        return total + (item.precio * item.cantidad);
    }, 0);
};

// Método para calcular descuento total
carritoSchema.methods.calcularDescuentoTotal = function() {
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
carritoSchema.methods.calcularTotal = function() {
    return Math.max(0, this.subtotal - this.descuentoTotal);
};

// Método para calcular precio final de un item
carritoSchema.methods.calcularPrecioFinal = function(precio, descuento) {
    let precioFinal = precio;
    
    if (descuento.porcentaje > 0) {
        precioFinal = precio * (1 - descuento.porcentaje / 100);
    } else if (descuento.monto > 0) {
        precioFinal = Math.max(0, precio - descuento.monto);
    }
    
    return precioFinal;
};

// Método para actualizar totales
carritoSchema.methods.actualizarTotales = function() {
    this.subtotal = this.calcularSubtotal();
    this.descuentoTotal = this.calcularDescuentoTotal();
    this.total = this.calcularTotal();
    
    // Actualizar precio final de cada item
    this.items.forEach(item => {
        item.precioFinal = this.calcularPrecioFinal(item.precio, item.descuento);
    });
};

// Método para verificar si el carrito está expirado
carritoSchema.methods.verificarExpiracion = function() {
    if (new Date() > this.expiraEn && this.estado === 'activo') {
        this.estado = 'expirado';
        return this.save();
    }
    return false;
};

// Método para convertir carrito en orden
carritoSchema.methods.convertirEnOrden = function() {
    if (this.items.length === 0) {
        throw new Error('No se puede convertir un carrito vacío');
    }
    
    this.estado = 'convertido';
    this.fechaActualizacion = new Date();
    
    return this.save();
};

// Middleware pre-save para validaciones
carritoSchema.pre('save', function(next) {
    try {
        // Validar que el usuario exista
        if (!this.usuario) {
            throw new Error('El usuario es obligatorio');
        }
        
        // Validar que los items tengan datos válidos
        this.items.forEach(item => {
            if (!item.curso || item.precio < 0 || item.cantidad < 1) {
                throw new Error('Datos de item inválidos');
            }
        });
        
        // Validar que el total no sea negativo
        if (this.total < 0) {
            this.total = 0;
        }
        
        // Actualizar fecha de actualización
        this.fechaActualizacion = new Date();
        
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware post-save para logging
carritoSchema.post('save', function(doc) {
    console.log(`Carrito ${doc._id} ${doc.isNew ? 'creado' : 'actualizado'} - Items: ${doc.items.length}`);
});

module.exports = mongoose.model('Carrito', carritoSchema);
