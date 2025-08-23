const mongoose = require('mongoose');
const { Schema } = mongoose;

const cursoSchema = new Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true,
        minlength: [5, 'El título debe tener al menos 5 caracteres'],
        maxlength: [100, 'El título no puede exceder 100 caracteres']
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        minlength: [20, 'La descripción debe tener al menos 20 caracteres'],
        maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
    },
    categoria: {
        type: [String],
        required: [true, 'Debe ingresar al menos una categoría'],
        validate: {
            validator: function(v) {
                return v.length > 0 && v.length <= 5;
            },
            message: 'Debe tener entre 1 y 5 categorías'
        }
    },
    imagen: {
        type: String,
        required: [true, 'La imagen del curso es obligatoria'],
        validate: {
            validator: function(v) {
                return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image');
            },
            message: 'La imagen debe ser una URL válida, ruta local o base64'
        }
    },
    archivos: [{
        nombre: {
            type: String,
            required: [true, 'El nombre del archivo es obligatorio'],
            maxlength: [100, 'El nombre del archivo no puede exceder 100 caracteres']
        },
        url: {
            type: String,
            required: [true, 'La URL del archivo es obligatoria'],
            validate: {
                validator: function(v) {
                    return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:');
                },
                message: 'La URL del archivo debe ser válida'
            }
        },
        tipo: {
            type: String,
            required: [true, 'El tipo de archivo es obligatorio'],
            enum: {
                values: ['pdf', 'doc', 'ppt', 'zip', 'video', 'audio', 'imagen', 'otro'],
                message: 'Tipo de archivo no válido'
            }
        }
    }],
    videoIntroductorio: {
        url: {
            type: String,
            validate: {
                validator: function(v) {
                    if (!v) return true; // Opcional
                    return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:video');
                },
                message: 'La URL del video debe ser válida'
            }
        },
        duracion: {
            type: Number,
            min: [0, 'La duración no puede ser negativa'],
            max: [3600, 'La duración máxima es 1 hora'],
            validate: {
                validator: function(v) {
                    if (!v) return true; // Opcional
                    return Number.isInteger(v) && v >= 0;
                },
                message: 'La duración debe ser un número entero no negativo'
            }
        }
    },
    nivel: {
        type: String,
        enum: {
            values: ['basico', 'intermedio', 'avanzado'],
            message: 'El nivel debe ser básico, intermedio o avanzado'
        },
        required: [true, 'El nivel del curso es obligatorio']
    },
    etiquetas: [{
        type: String,
        trim: true,
        minlength: [1, 'Cada etiqueta debe tener al menos 1 carácter'],
        maxlength: [30, 'Cada etiqueta no puede exceder 30 caracteres']
    }],
    precio: {
        type: Number,
        default: 0,
        min: [0, 'El precio no puede ser negativo'],
        max: [9999.99, 'El precio máximo es 9999.99'],
        validate: {
            validator: function(v) {
                return Number.isFinite(v) && v >= 0;
            },
            message: 'El precio debe ser un número válido no negativo'
        }
    },
    visibilidad: {
        type: String,
        enum: {
            values: ['publico', 'privado', 'soloSuscriptores'],
            message: 'La visibilidad debe ser público, privado o solo suscriptores'
        },
        default: 'publico'
    },
    estadisticas: {
        visualizaciones: { 
            type: Number, 
            default: 0,
            min: [0, 'Las visualizaciones no pueden ser negativas'],
            validate: {
                validator: function(v) {
                    return Number.isInteger(v) && v >= 0;
                },
                message: 'Las visualizaciones deben ser un número entero no negativo'
            }
        },
        calificacionPromedio: { 
            type: Number, 
            default: 0,
            min: [0, 'La calificación no puede ser negativa'],
            max: [5, 'La calificación máxima es 5'],
            validate: {
                validator: function(v) {
                    return Number.isFinite(v) && v >= 0 && v <= 5;
                },
                message: 'La calificación debe ser un número entre 0 y 5'
            }
        },
        totalCalificaciones: { 
            type: Number, 
            default: 0,
            min: [0, 'El total de calificaciones no puede ser negativo'],
            validate: {
                validator: function(v) {
                    return Number.isInteger(v) && v >= 0;
                },
                message: 'El total de calificaciones debe ser un número entero no negativo'
            }
        },
        ventasRealizadas: { 
            type: Number, 
            default: 0,
            min: [0, 'Las ventas no pueden ser negativas'],
            validate: {
                validator: function(v) {
                    return Number.isInteger(v) && v >= 0;
                },
                message: 'Las ventas deben ser un número entero no negativo'
            }
        }
    },
    calificaciones: [{
        usuario: { 
            type: Schema.Types.ObjectId, 
            ref: 'Usuario',
            required: [true, 'El usuario de la calificación es obligatorio']
        },
        puntuacion: { 
            type: Number, 
            min: [1, 'La puntuación mínima es 1'], 
            max: [5, 'La puntuación máxima es 5'],
            required: [true, 'La puntuación es obligatoria'],
            validate: {
                validator: function(v) {
                    return Number.isInteger(v);
                },
                message: 'La puntuación debe ser un número entero'
            }
        },
        comentario: {
            type: String,
            maxlength: [500, 'El comentario no puede exceder 500 caracteres'],
            trim: true
        },
        fecha: { 
            type: Date, 
            default: Date.now 
        }
    }],
    comentarios: [{
        usuario: { 
            type: Schema.Types.ObjectId, 
            ref: 'Usuario',
            required: [true, 'El usuario del comentario es obligatorio']
        },
        contenido: {
            type: String,
            required: [true, 'El contenido del comentario es obligatorio'],
            maxlength: [1000, 'El comentario no puede exceder 1000 caracteres'],
            trim: true
        },
        fecha: { 
            type: Date, 
            default: Date.now 
        }
    }],
    fechaCreacion: {
        type: Date,
        default: Date.now,
        validate: {
            validator: function(v) {
                return v <= new Date();
            },
            message: 'La fecha de creación no puede ser futura'
        }
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El propietario del curso es obligatorio']
    },
    estadoCurso: {
        type: String,
        enum: {
            values: ['activo', 'borrador', 'archivado'],
            message: 'El estado del curso debe ser activo, borrador o archivado'
        },
        default: 'borrador'
    },
    certificado: {
        disponible: { 
            type: Boolean, 
            default: false 
        },
        requisitos: [{
            type: String,
            maxlength: [200, 'Cada requisito no puede exceder 200 caracteres'],
            trim: true
        }],
        plantilla: {
            type: String,
            default: 'default',
            enum: {
                values: ['default', 'premium', 'personalizada'],
                message: 'La plantilla debe ser default, premium o personalizada'
            }
        }
    },
    lecciones: [{
        titulo: {
            type: String,
            required: [true, 'El título de la lección es obligatorio'],
            maxlength: [100, 'El título no puede exceder 100 caracteres'],
            trim: true
        },
        descripcion: {
            type: String,
            maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
            trim: true
        },
        duracion: {
            type: Number,
            min: [0, 'La duración no puede ser negativa'],
            max: [7200, 'La duración máxima es 2 horas'],
            validate: {
                validator: function(v) {
                    if (!v) return true; // Opcional
                    return Number.isInteger(v) && v >= 0;
                },
                message: 'La duración debe ser un número entero no negativo'
            }
        },
        tipo: {
            type: String,
            enum: {
                values: ['video', 'texto', 'audio', 'interactivo'],
                message: 'El tipo debe ser video, texto, audio o interactivo'
            },
            default: 'video'
        },
        contenido: {
            url: {
                type: String,
                validate: {
                    validator: function(v) {
                        if (!v) return true; // Opcional
                        return v.startsWith('http') || v.startsWith('/') || v.startsWith('data:');
                    },
                    message: 'La URL del contenido debe ser válida'
                }
            },
            texto: {
                type: String,
                maxlength: [5000, 'El texto no puede exceder 5000 caracteres']
            }
        },
        orden: {
            type: Number,
            required: [true, 'El orden de la lección es obligatorio'],
            min: [1, 'El orden debe ser mayor a 0']
        }
    }]
}, {
    collection: 'cursos',
    timestamps: true
});

// Índices para mejorar búsquedas
cursoSchema.index({ titulo: 'text', descripcion: 'text', etiquetas: 'text' });
cursoSchema.index({ categoria: 1 });
cursoSchema.index({ nivel: 1 });
cursoSchema.index({ owner: 1 });
cursoSchema.index({ estadoCurso: 1 });
cursoSchema.index({ precio: 1 });

// Validación personalizada para verificar que no haya lecciones con el mismo orden
cursoSchema.path('lecciones').validate(function(lecciones) {
    const ordenes = lecciones.map(l => l.orden);
    const ordenesUnicos = [...new Set(ordenes)];
    return ordenes.length === ordenesUnicos.length;
}, 'No puede haber lecciones con el mismo orden');

// Límite máximo de etiquetas
cursoSchema.path('etiquetas').validate(function(etiquetas) {
    return !Array.isArray(etiquetas) || etiquetas.length <= 10;
}, 'No puede tener más de 10 etiquetas');

// Método para agregar calificación
cursoSchema.methods.agregarCalificacion = function(usuarioId, puntuacion, comentario = '') {
    // Verificar que el usuario no haya calificado antes
    const calificacionExistente = this.calificaciones.find(c => 
        c.usuario.toString() === usuarioId.toString()
    );
    
    if (calificacionExistente) {
        throw new Error('El usuario ya ha calificado este curso');
    }
    
    this.calificaciones.push({
        usuario: usuarioId,
        puntuacion,
        comentario
    });
    
    // Actualizar promedio
    const total = this.calificaciones.reduce((sum, cal) => sum + cal.puntuacion, 0);
    this.estadisticas.calificacionPromedio = total / this.calificaciones.length;
    this.estadisticas.totalCalificaciones = this.calificaciones.length;
    
    return this.save();
};

// Método para agregar comentario
cursoSchema.methods.agregarComentario = function(usuarioId, contenido) {
    this.comentarios.push({
        usuario: usuarioId,
        contenido
    });
    
    return this.save();
};

// Método para incrementar visualizaciones
cursoSchema.methods.incrementarVisualizacion = function() {
    this.estadisticas.visualizaciones += 1;
    return this.save();
};

module.exports = mongoose.model('Curso', cursoSchema);
