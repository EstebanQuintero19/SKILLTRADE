const mongoose = require('mongoose');
const { Schema } = mongoose;

const exchangeSchema = new Schema({
    emisor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario emisor es obligatorio'],
        index: true
    },
    receptor: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario receptor es obligatorio'],
        index: true
    },
    cursoEmisor: {
        type: Schema.Types.ObjectId,
        ref: 'Curso',
        required: [true, 'El curso del emisor es obligatorio'],
        index: true
    },
    cursoReceptor: {
        type: Schema.Types.ObjectId,
        ref: 'Curso',
        required: [true, 'El curso del receptor es obligatorio'],
        index: true
    },
    tipo: {
        type: String,
        enum: {
            values: ['intercambio', 'prestamo'],
            message: 'El tipo debe ser "intercambio" o "prestamo"'
        },
        required: [true, 'El tipo de intercambio es obligatorio'],
        index: true
    },
    estado: {
        type: String,
        enum: {
            values: ['pendiente', 'aceptado', 'rechazado', 'activo', 'finalizado', 'cancelado'],
            message: 'Estado inválido'
        },
        default: 'pendiente',
        index: true
    },
    fechaSolicitud: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    fechaAceptacion: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                return v >= this.fechaSolicitud;
            },
            message: 'La fecha de aceptación no puede ser anterior a la solicitud'
        }
    },
    fechaInicio: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                if (this.fechaAceptacion) {
                    return v >= this.fechaAceptacion;
                }
                return true;
            },
            message: 'La fecha de inicio no puede ser anterior a la aceptación'
        }
    },
    fechaFin: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!v) return true; // Permitir null
                if (this.fechaInicio) {
                    return v > this.fechaInicio;
                }
                return true;
            },
            message: 'La fecha de fin debe ser posterior al inicio'
        }
    },
    duracion: {
        type: Number, // en días
        required: [true, 'La duración del intercambio es obligatoria'],
        min: [1, 'La duración mínima es 1 día'],
        max: [365, 'La duración máxima es 365 días']
    },
    recordatorios: [{
        fecha: {
            type: Date,
            required: true
        },
        enviado: { 
            type: Boolean, 
            default: false 
        },
        tipo: { 
            type: String, 
            enum: ['inicio', 'vencimiento', 'recordatorio'],
            required: true
        },
        mensaje: {
            type: String,
            maxlength: [200, 'El mensaje no puede exceder 200 caracteres']
        }
    }],
    comentarios: [{
        usuario: { 
            type: Schema.Types.ObjectId, 
            ref: 'Usuario',
            required: true
        },
        contenido: {
            type: String,
            required: true,
            maxlength: [500, 'El comentario no puede exceder 500 caracteres']
        },
        fecha: { 
            type: Date, 
            default: Date.now 
        },
        tipo: {
            type: String,
            enum: ['general', 'soporte', 'reclamo'],
            default: 'general'
        }
    }],
    calificacionEmisor: {
        puntuacion: { 
            type: Number, 
            min: [1, 'La puntuación mínima es 1'], 
            max: [5, 'La puntuación máxima es 5'] 
        },
        comentario: {
            type: String,
            maxlength: [300, 'El comentario no puede exceder 300 caracteres']
        },
        fecha: Date
    },
    calificacionReceptor: {
        puntuacion: { 
            type: Number, 
            min: [1, 'La puntuación mínima es 1'], 
            max: [5, 'La puntuación máxima es 5'] 
        },
        comentario: {
            type: String,
            maxlength: [300, 'El comentario no puede exceder 300 caracteres']
        },
        fecha: Date
    },
    motivoCancelacion: {
        type: String,
        maxlength: [500, 'El motivo no puede exceder 500 caracteres']
    },
    fechaCancelacion: Date,
    usuarioCancelacion: { 
        type: Schema.Types.ObjectId, 
        ref: 'Usuario' 
    },
    terminos: {
        aceptados: {
            type: Boolean,
            default: false
        },
        fechaAceptacion: Date,
        version: {
            type: String,
            default: '1.0'
        }
    },
    notificaciones: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
        sms: { type: Boolean, default: false }
    },
    metadata: {
        ipSolicitud: String,
        dispositivo: String,
        navegador: String,
        ubicacion: {
            pais: String,
            ciudad: String,
            zonaHoraria: String
        }
    }
}, {
    collection: 'exchanges',
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Calcular días restantes
            if (ret.fechaFin && ret.estado === 'activo') {
                const ahora = new Date();
                const diasRestantes = Math.ceil((ret.fechaFin - ahora) / (1000 * 60 * 60 * 24));
                ret.diasRestantes = diasRestantes > 0 ? diasRestantes : 0;
            }
            return ret;
        }
    }
});

// Índices para mejorar consultas
exchangeSchema.index({ emisor: 1, estado: 1 });
exchangeSchema.index({ receptor: 1, estado: 1 });
exchangeSchema.index({ estado: 1, fechaInicio: 1 });
exchangeSchema.index({ fechaFin: 1, estado: 1 });
exchangeSchema.index({ tipo: 1, estado: 1 });
exchangeSchema.index({ fechaSolicitud: -1 });

// Índices compuestos para consultas frecuentes
exchangeSchema.index({ emisor: 1, receptor: 1 });
exchangeSchema.index({ cursoEmisor: 1, cursoReceptor: 1 });
exchangeSchema.index({ estado: 1, tipo: 1 });

// Virtual para días restantes
exchangeSchema.virtual('diasRestantes').get(function() {
    if (this.fechaFin && this.estado === 'activo') {
        const ahora = new Date();
        const diasRestantes = Math.ceil((this.fechaFin - ahora) / (1000 * 60 * 60 * 24));
        return diasRestantes > 0 ? diasRestantes : 0;
    }
    return null;
});

// Virtual para estado del intercambio
exchangeSchema.virtual('estadoDetallado').get(function() {
    if (this.estado === 'activo' && this.fechaFin) {
        const ahora = new Date();
        if (ahora > this.fechaFin) {
            return 'vencido';
        } else if (this.proximoAVencer()) {
            return 'proximo_a_vencer';
        }
    }
    return this.estado;
});

// Método para verificar si el intercambio está activo
exchangeSchema.methods.estaActivo = function() {
    const ahora = new Date();
    return this.estado === 'activo' && 
           this.fechaInicio <= ahora && 
           this.fechaFin >= ahora;
};

// Método para verificar si está próximo a vencer
exchangeSchema.methods.proximoAVencer = function() {
    const ahora = new Date();
    if (!this.fechaFin) return false;
    
    const diasRestantes = Math.ceil((this.fechaFin - ahora) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 3 && diasRestantes > 0;
};

// Método para finalizar intercambio automáticamente
exchangeSchema.methods.finalizarAutomaticamente = function() {
    const ahora = new Date();
    if (this.fechaFin < ahora && this.estado === 'activo') {
        this.estado = 'finalizado';
        return true;
    }
    return false;
};

// Método para aceptar intercambio
exchangeSchema.methods.aceptar = function() {
    if (this.estado !== 'pendiente') {
        throw new Error('Solo se pueden aceptar intercambios pendientes');
    }
    
    this.estado = 'aceptado';
    this.fechaAceptacion = new Date();
    this.fechaInicio = new Date();
    this.fechaFin = new Date(this.fechaInicio.getTime() + (this.duracion * 24 * 60 * 60 * 1000));
    
    // Configurar recordatorios
    this.recordatorios = [
        {
            fecha: this.fechaInicio,
            tipo: 'inicio',
            mensaje: 'Tu intercambio ha comenzado'
        },
        {
            fecha: new Date(this.fechaFin.getTime() - (3 * 24 * 60 * 60 * 1000)), // 3 días antes
            tipo: 'recordatorio',
            mensaje: 'Tu intercambio vence en 3 días'
        },
        {
            fecha: this.fechaFin,
            tipo: 'vencimiento',
            mensaje: 'Tu intercambio ha vencido'
        }
    ];
    
    return this.save();
};

// Método para rechazar intercambio
exchangeSchema.methods.rechazar = function(motivo = '') {
    if (this.estado !== 'pendiente') {
        throw new Error('Solo se pueden rechazar intercambios pendientes');
    }
    
    this.estado = 'rechazado';
    return this.save();
};

// Método para cancelar intercambio
exchangeSchema.methods.cancelar = function(usuarioId, motivo = '') {
    if (!['pendiente', 'aceptado', 'activo'].includes(this.estado)) {
        throw new Error('No se puede cancelar este intercambio');
    }
    
    this.estado = 'cancelado';
    this.motivoCancelacion = motivo;
    this.fechaCancelacion = new Date();
    this.usuarioCancelacion = usuarioId;
    
    return this.save();
};

// Método para agregar comentario
exchangeSchema.methods.agregarComentario = function(usuarioId, contenido, tipo = 'general') {
    this.comentarios.push({
        usuario: usuarioId,
        contenido,
        tipo,
        fecha: new Date()
    });
    
    return this.save();
};

// Método para calificar
exchangeSchema.methods.calificar = function(usuarioId, puntuacion, comentario = '') {
    if (this.estado !== 'finalizado') {
        throw new Error('Solo se pueden calificar intercambios finalizados');
    }
    
    if (usuarioId.toString() === this.emisor.toString()) {
        this.calificacionEmisor = {
            puntuacion,
            comentario,
            fecha: new Date()
        };
    } else if (usuarioId.toString() === this.receptor.toString()) {
        this.calificacionReceptor = {
            puntuacion,
            comentario,
            fecha: new Date()
        };
    } else {
        throw new Error('Solo los participantes pueden calificar');
    }
    
    return this.save();
};

// Método para verificar si se puede calificar
exchangeSchema.methods.puedeCalificar = function(usuarioId) {
    if (this.estado !== 'finalizado') return false;
    
    if (usuarioId.toString() === this.emisor.toString()) {
        return !this.calificacionEmisor.puntuacion;
    } else if (usuarioId.toString() === this.receptor.toString()) {
        return !this.calificacionReceptor.puntuacion;
    }
    
    return false;
};

// Middleware pre-save para validaciones
exchangeSchema.pre('save', function(next) {
    try {
        // Validar que emisor y receptor sean diferentes
        if (this.emisor.toString() === this.receptor.toString()) {
            throw new Error('El emisor y receptor no pueden ser el mismo usuario');
        }
        
        // Validar que los cursos sean diferentes
        if (this.cursoEmisor.toString() === this.cursoReceptor.toString()) {
            throw new Error('Los cursos deben ser diferentes');
        }
        
        // Validar fechas
        if (this.fechaInicio && this.fechaFin && this.fechaInicio >= this.fechaFin) {
            throw new Error('La fecha de fin debe ser posterior al inicio');
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware post-save para logging
exchangeSchema.post('save', function(doc) {
    console.log(`Exchange ${doc._id} ${doc.isNew ? 'creado' : 'actualizado'} - Estado: ${doc.estado}`);
});

module.exports = mongoose.model('Exchange', exchangeSchema);
