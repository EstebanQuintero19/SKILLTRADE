const mongoose = require('mongoose');
const { Schema } = mongoose;

const bibliotecaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    cursos: [{
        curso: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
            required: true
        },
        fechaAdquisicion: {
            type: Date,
            default: Date.now
        },
        metodoAdquisicion: {
            type: String,
            enum: ['compra', 'intercambio', 'admin', 'promocion'],
            default: 'compra'
        },
        estado: {
            type: String,
            enum: ['activo', 'completado', 'en_progreso'],
            default: 'activo'
        },
        progreso: {
            porcentajeCompletado: {
                type: Number,
                default: 0,
                min: [0, 'El porcentaje no puede ser negativo'],
                max: [100, 'El porcentaje no puede exceder 100'],
                validate: {
                    validator: function(v) {
                        return Number.isInteger(v) && v >= 0 && v <= 100;
                    },
                    message: 'El porcentaje debe ser un número entero entre 0 y 100'
                }
            },
            ultimaActividad: {
                type: Date,
                default: Date.now,
                validate: {
                    validator: function(v) {
                        if (!v) return true; // Permitir null
                        return v <= new Date();
                    },
                    message: 'La última actividad no puede ser futura'
                }
            }
        },
        recordatorios: [{
            titulo: {
                type: String,
                required: true,
                maxlength: [100, 'El título no puede exceder 100 caracteres']
            },
            descripcion: {
                type: String,
                maxlength: [300, 'La descripción no puede exceder 300 caracteres']
            },
            fecha: {
                type: Date,
                required: true
            },
            completado: {
                type: Boolean,
                default: false
            },
            prioridad: {
                type: String,
                enum: ['baja', 'media', 'alta'],
                default: 'media'
            }
        }],
        recursos: [{
            nombre: {
                type: String,
                required: true,
                maxlength: [100, 'El nombre no puede exceder 100 caracteres']
            },
            tipo: {
                type: String,
                enum: ['archivo', 'enlace', 'nota', 'ejercicio'],
                required: true
            },
            url: {
                type: String,
                maxlength: [500, 'La URL no puede exceder 500 caracteres'],
                validate: {
                    validator: function(v) {
                        // Requerido si tipo es enlace o archivo
                        if (this.tipo === 'enlace' || this.tipo === 'archivo') {
                            return typeof v === 'string' && (v.startsWith('http') || v.startsWith('/'));
                        }
                        // opcional en otros tipos
                        return true;
                    },
                    message: 'La URL es obligatoria y debe ser válida cuando el tipo es enlace o archivo'
                }
            },
            descripcion: {
                type: String,
                maxlength: [300, 'La descripción no puede exceder 300 caracteres']
            },
            fechaCreacion: {
                type: Date,
                default: Date.now
            },
            descargado: {
                type: Boolean,
                default: false
            }
        }]
    }],
    colecciones: [{
        nombre: {
            type: String,
            required: true,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres']
        },
        descripcion: {
            type: String,
            maxlength: [300, 'La descripción no puede exceder 300 caracteres']
        },
        cursos: [{
            type: Schema.Types.ObjectId,
            ref: 'Curso'
        }],
        fechaCreacion: {
            type: Date,
            default: Date.now
        },
        privada: {
            type: Boolean,
            default: false
        },
        color: {
            type: String,
            match: [/^#[0-9A-F]{6}$/i, 'Formato de color inválido (hexadecimal)']
        }
    }],
    preferencias: {
        notificaciones: {
            recordatorios: { type: Boolean, default: true },
            nuevosCursos: { type: Boolean, default: true },
            logros: { type: Boolean, default: true },
            promociones: { type: Boolean, default: false }
        },
        privacidad: {
            perfilPublico: { type: Boolean, default: true },
            mostrarProgreso: { type: Boolean, default: true },
            mostrarCertificados: { type: Boolean, default: true },
            mostrarColecciones: { type: Boolean, default: true }
        },
        interfaz: {
            tema: {
                type: String,
                enum: ['claro', 'oscuro', 'auto'],
                default: 'auto'
            },
            idioma: {
                type: String,
                default: 'es',
                enum: ['es', 'en', 'fr', 'pt']
            },
            notificacionesPush: { type: Boolean, default: true }
        }
    },
    logros: [{
        nombre: {
            type: String,
            required: true,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres']
        },
        descripcion: {
            type: String,
            maxlength: [300, 'La descripción no puede exceder 300 caracteres']
        },
        icono: {
            type: String,
            maxlength: [100, 'El icono no puede exceder 100 caracteres']
        },
        fechaObtencion: {
            type: Date,
            default: Date.now
        },
        tipo: {
            type: String,
            enum: ['progreso', 'tiempo', 'social', 'especial'],
            required: true
        },
        puntos: {
            type: Number,
            default: 0,
            min: [0, 'Los puntos no pueden ser negativos'],
            validate: {
                validator: function(v) {
                    return Number.isInteger(v) && v >= 0;
                },
                message: 'Los puntos deben ser un número entero no negativo'
            }
        }
    }],
}, {
    collection: 'bibliotecas',
    timestamps: true
});

// Índices básicos
bibliotecaSchema.index({ usuario: 1 }, { unique: true });
bibliotecaSchema.index({ 'cursos.curso': 1 });

// Validación: evitar cursos duplicados por biblioteca
bibliotecaSchema.path('cursos').validate(function(cursos) {
    const ids = cursos.map(c => c.curso && c.curso.toString());
    const uniques = new Set(ids);
    return ids.length === uniques.size;
}, 'No se puede repetir el mismo curso en la biblioteca');

// Virtual para verificar si la biblioteca está vacía
bibliotecaSchema.virtual('estaVacia').get(function() {
    return this.cursos.length === 0;
});

// Virtual para obtener cursos activos
bibliotecaSchema.virtual('cursosActivos').get(function() {
    return this.cursos.filter(curso => curso.estado === 'activo');
});

// Virtual para obtener cursos completados
bibliotecaSchema.virtual('cursosCompletados').get(function() {
    return this.cursos.filter(curso => curso.estado === 'completado');
});

// Método para agregar curso a la biblioteca
bibliotecaSchema.methods.agregarCurso = function(cursoId, metodoAdquisicion = 'compra') {
    // Verificar si el curso ya está en la biblioteca
    const cursoExistente = this.cursos.find(c => 
        c.curso.toString() === cursoId.toString()
    );
    
    if (cursoExistente) {
        throw new Error('El curso ya está en la biblioteca');
    }
    
    // Agregar nuevo curso
    this.cursos.push({
        curso: cursoId,
        fechaAdquisicion: new Date(),
        metodoAdquisicion,
        estado: 'activo',
        progreso: {
            porcentajeCompletado: 0,
            ultimaActividad: new Date()
        }
    });
    
    return this.save();
};

// Método para remover curso
bibliotecaSchema.methods.removerCurso = function(cursoId) {
    const indice = this.cursos.findIndex(c => 
        c.curso.toString() === cursoId.toString()
    );
    
    if (indice === -1) {
        throw new Error('Curso no encontrado en la biblioteca');
    }
    
    this.cursos.splice(indice, 1);
    
    return this.save();
};

// Método para actualizar progreso
bibliotecaSchema.methods.actualizarProgreso = function(cursoId, porcentaje) {
    const curso = this.cursos.find(c => 
        c.curso.toString() === cursoId.toString()
    );
    
    if (!curso) {
        throw new Error('Curso no encontrado en la biblioteca');
    }
    
    curso.progreso.porcentajeCompletado = porcentaje;
    curso.progreso.ultimaActividad = new Date();
    
    if (porcentaje >= 100) {
        curso.estado = 'completado';
    } else if (porcentaje > 0) {
        curso.estado = 'en_progreso';
    }
    
    return this.save();
};










module.exports = mongoose.model('Biblioteca', bibliotecaSchema);
