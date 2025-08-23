const mongoose = require('mongoose');
const { Schema } = mongoose;

const carritoSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio'],
        unique: true
    },
    items: [{
        curso: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
            required: [true, 'El curso es obligatorio']
        },
        precio: {
            type: Number,
            required: [true, 'El precio es obligatorio'],
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
            max: [10, 'La cantidad máxima es 10'],
            validate: {
                validator: function(v) {
                    return Number.isInteger(v) && v >= 1 && v <= 10;
                },
                message: 'La cantidad debe ser un número entero entre 1 y 10'
            }
        }
    }],
    total: {
        type: Number,
        default: 0,
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
        enum: {
            values: ['activo', 'convertido'],
            message: 'El estado debe ser activo o convertido'
        },
        default: 'activo'
    },
    expiraEn: {
        type: Date,
        default: function() {
            return new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 días
        }
    }
}, {
    collection: 'carritos',
    timestamps: true
});

// Índices básicos
carritoSchema.index({ usuario: 1 });
carritoSchema.index({ estado: 1 });
carritoSchema.index({ expiraEn: 1 });

// Validación personalizada para verificar que no haya cursos duplicados
carritoSchema.path('items').validate(function(items) {
    const cursoIds = items.map(item => item.curso.toString());
    const uniqueIds = [...new Set(cursoIds)];
    return cursoIds.length === uniqueIds.length;
}, 'No se pueden agregar cursos duplicados al carrito');

// Virtual para verificar si el carrito está vacío
carritoSchema.virtual('estaVacio').get(function() {
    return this.items.length === 0;
});

// Virtual para verificar si el carrito ha expirado
carritoSchema.virtual('haExpirado').get(function() {
    return new Date() > this.expiraEn;
});

// Virtual para obtener el número de items
carritoSchema.virtual('numeroItems').get(function() {
    return this.items.length;
});

// Método para agregar curso al carrito
carritoSchema.methods.agregarCurso = function(cursoId, precio, cantidad = 1) {
    // Validar cantidad
    if (cantidad < 1 || cantidad > 10) {
        throw new Error('La cantidad debe estar entre 1 y 10');
    }
    
    const itemExistente = this.items.find(item => 
        item.curso.toString() === cursoId.toString()
    );
    
    if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        if (nuevaCantidad > 10) {
            throw new Error('La cantidad total no puede exceder 10');
        }
        itemExistente.cantidad = nuevaCantidad;
    } else {
        this.items.push({
            curso: cursoId,
            precio,
            cantidad
        });
    }
    
    this.calcularTotal();
    this.renovarExpiracion();
    
    return this.save();
};

// Método para remover curso del carrito
carritoSchema.methods.removerCurso = function(cursoId) {
    this.items = this.items.filter(item => 
        item.curso.toString() !== cursoId.toString()
    );
    
    this.calcularTotal();
    
    return this.save();
};

// Método para actualizar cantidad de un curso
carritoSchema.methods.actualizarCantidad = function(cursoId, cantidad) {
    if (cantidad < 1 || cantidad > 10) {
        throw new Error('La cantidad debe estar entre 1 y 10');
    }
    
    const item = this.items.find(item => 
        item.curso.toString() === cursoId.toString()
    );
    
    if (!item) {
        throw new Error('Curso no encontrado en el carrito');
    }
    
    if (cantidad <= 0) {
        return this.removerCurso(cursoId);
    }
    
    item.cantidad = cantidad;
    this.calcularTotal();
    
    return this.save();
};

// Método para limpiar carrito
carritoSchema.methods.limpiar = function() {
    this.items = [];
    this.total = 0;
    
    return this.save();
};

// Método para calcular total
carritoSchema.methods.calcularTotal = function() {
    this.total = this.items.reduce((total, item) => {
        return total + (item.precio * item.cantidad);
    }, 0);
    return this.total;
};

// Método para renovar expiración
carritoSchema.methods.renovarExpiracion = function() {
    this.expiraEn = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
};

// Método para convertir carrito en orden
carritoSchema.methods.convertirEnOrden = function() {
    if (this.items.length === 0) {
        throw new Error('No se puede convertir un carrito vacío');
    }
    
    if (this.haExpirado) {
        throw new Error('No se puede convertir un carrito expirado');
    }
    
    this.estado = 'convertido';
    
    return this.save();
};

module.exports = mongoose.model('Carrito', carritoSchema);
