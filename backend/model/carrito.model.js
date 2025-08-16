const mongoose = require('mongoose');
const { Schema } = mongoose;

const carritoSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        unique: true
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
            min: 0
        },
        cantidad: {
            type: Number,
            default: 1,
            min: 1
        }
    }],

    total: {
        type: Number,
        default: 0,
        min: 0
    },

    estado: {
        type: String,
        enum: ['activo', 'convertido'],
        default: 'activo'
    },


}, {
    collection: 'carritos',
    timestamps: true
});

// Índices básicos
carritoSchema.index({ usuario: 1 });
carritoSchema.index({ estado: 1 });

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
    const itemExistente = this.items.find(item => 
        item.curso.toString() === cursoId.toString()
    );
    
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        this.items.push({
            curso: cursoId,
            precio,
            cantidad
        });
    }
    
    this.calcularTotal();
    
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





// Método para convertir carrito en orden
carritoSchema.methods.convertirEnOrden = function() {
    if (this.items.length === 0) {
        throw new Error('No se puede convertir un carrito vacío');
    }
    
    this.estado = 'convertido';
    
    return this.save();
};





module.exports = mongoose.model('Carrito', carritoSchema);
