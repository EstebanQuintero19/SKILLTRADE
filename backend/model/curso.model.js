const mongoose = require('mongoose');
const { Schema } = mongoose;

const cursoSchema = new Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        trim: true
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true
    },
    categoria: {
        type: [String],
        required: [true, 'Debe ingresar al menos una categoría']
    },
    imagen: {
        type: String,
        required: [true, 'La imagen del curso es obligatoria']
    },
    archivos: [{
        nombre: String,
        url: String,
        tipo: String
    }],
    videoIntroductorio: {
        url: String,
        duracion: Number
    },
    nivel: {
        type: String,
        enum: ['basico', 'intermedio', 'avanzado'],
        required: [true, 'El nivel del curso es obligatorio']
    },
    etiquetas: [String],
    precio: {
        type: Number,
        default: 0,
        min: 0
    },
    visibilidad: {
        type: String,
        enum: ['publico', 'privado', 'soloSuscriptores'],
        default: 'publico'
    },
    estadisticas: {
        visualizaciones: { type: Number, default: 0 },
        calificacionPromedio: { type: Number, default: 0 },
        totalCalificaciones: { type: Number, default: 0 },
        ventasRealizadas: { type: Number, default: 0 }
    },
    calificaciones: [{
        usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
        puntuacion: { type: Number, min: 1, max: 5 },
        comentario: String,
        fecha: { type: Date, default: Date.now }
    }],
    comentarios: [{
        usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
        contenido: String,
        fecha: { type: Date, default: Date.now }
    }],
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    estadoCurso: {
        type: String,
        enum: ['activo', 'borrador', 'archivado'],
        default: 'borrador'
    },
    certificado: {
        disponible: { type: Boolean, default: false },
        requisitos: [{
            type: String,
            maxlength: [200, 'Cada requisito no puede exceder 200 caracteres']
        }],
        plantilla: {
            type: String,
            default: 'default'
        }
    },
    lecciones: [{
        titulo: {
            type: String,
            required: true,
            maxlength: [100, 'El título no puede exceder 100 caracteres']
        },
        descripcion: {
            type: String,
            maxlength: [500, 'La descripción no puede exceder 500 caracteres']
        },
        duracion: {
            type: Number,
            min: [0, 'La duración no puede ser negativa']
        },
        tipo: {
            type: String,
            enum: ['video', 'texto', 'audio', 'interactivo'],
            default: 'video'
        },
        contenido: {
            url: String,
            texto: String
        },
        orden: {
            type: Number,
            required: true,
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
cursoSchema.index({ categoria: 1 });
cursoSchema.index({ titulo: 'text', descripcion: 'text' });

// Método para agregar calificación
cursoSchema.methods.agregarCalificacion = function(usuarioId, puntuacion, comentario = '') {
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



module.exports = mongoose.model('Curso', cursoSchema);
