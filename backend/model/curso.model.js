const mongoose = require('mongoose');
const { Schema } = mongoose;

const cursoSchema = new Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio'],
        minlength: [5, 'El título debe tener al menos 5 caracteres'],
        maxlength: [200, 'El título no puede exceder 200 caracteres'],
        trim: true,
        index: true
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
        maxlength: [2000, 'La descripción no puede exceder 2000 caracteres'],
        trim: true
    },
    categoria: {
        type: [String],
        required: [true, 'Debe ingresar al menos una categoría'],
        validate: [
            {
                validator: function(arr) {
                    return Array.isArray(arr) && arr.length > 0;
                },
                message: 'Debe haber al menos una categoría'
            },
            {
                validator: function(arr) {
                    return arr.every(c => typeof c === 'string' && c.length >= 3 && c.length <= 50);
                },
                message: 'Cada categoría debe tener entre 3 y 50 caracteres'
            }
        ],
        index: true
    },
    imagen: {
        type: String,
        required: [true, 'La imagen del curso es obligatoria'],
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(v);
            },
            message: 'URL de imagen inválida'
        }
    },
    archivos: [{
        nombre: {
            type: String,
            required: true,
            maxlength: [100, 'El nombre del archivo no puede exceder 100 caracteres']
        },
        url: {
            type: String,
            required: true,
            validate: {
                validator: function(v) {
                    return /^https?:\/\/.+/.test(v);
                },
                message: 'URL del archivo inválida'
            }
        },
        tipo: {
            type: String,
            required: true,
            enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', 'mp4', 'mp3', 'otro']
        },
        tamano: {
            type: Number,
            min: [0, 'El tamaño no puede ser negativo'],
            max: [100 * 1024 * 1024, 'El archivo no puede exceder 100MB'] // 100MB máximo
        },
        fechaSubida: {
            type: Date,
            default: Date.now
        }
    }],
    videoIntroductorio: {
        url: {
            type: String,
            validate: {
                validator: function(v) {
                    if (!v) return true; // Permitir null
                    return /^https?:\/\/(www\.)?(youtube\.com|vimeo\.com|dailymotion\.com)\/.+/.test(v);
                },
                message: 'URL de video inválida. Solo se permiten YouTube, Vimeo o Dailymotion'
            }
        },
        duracion: {
            type: Number,
            min: [0, 'La duración no puede ser negativa'],
            max: [600, 'El video no puede exceder 10 minutos'] // 10 minutos máximo
        }
    },
    nivel: {
        type: String,
        enum: {
            values: ['basico', 'intermedio', 'avanzado'],
            message: 'El nivel debe ser "basico", "intermedio" o "avanzado"'
        },
        required: [true, 'El nivel del curso es obligatorio'],
        index: true
    },
    etiquetas: [{
        type: String,
        maxlength: [30, 'Cada etiqueta no puede exceder 30 caracteres'],
        validate: {
            validator: function(arr) {
                return arr.length <= 20; // Máximo 20 etiquetas
            },
            message: 'No puede tener más de 20 etiquetas'
        }
    }],
    precio: {
        type: Number,
        min: [0, 'El precio no puede ser negativo'],
        max: [1000000, 'El precio no puede exceder 1,000,000'],
        required: [true, 'El precio del curso es obligatorio'],
        index: true
    },
    visibilidad: {
        type: String,
        enum: {
            values: ['publico', 'privado', 'soloSuscriptores'],
            message: 'La visibilidad debe ser "publico", "privado" o "soloSuscriptores"'
        },
        default: 'publico',
        index: true
    },
    estadisticas: {
        visualizaciones: { 
            type: Number, 
            default: 0, 
            min: [0, 'No puede ser negativo'] 
        },
        calificacionPromedio: { 
            type: Number, 
            default: 0, 
            min: [0, 'No puede ser negativo'], 
            max: [5, 'No puede exceder 5'] 
        },
        totalCalificaciones: { 
            type: Number, 
            default: 0, 
            min: [0, 'No puede ser negativo'] 
        },
        totalComentarios: { 
            type: Number, 
            default: 0, 
            min: [0, 'No puede ser negativo'] 
        },
        totalVentas: {
            type: Number,
            default: 0,
            min: [0, 'No puede ser negativo']
        },
        ingresosGenerados: {
            type: Number,
            default: 0,
            min: [0, 'No puede ser negativo']
        }
    },
    calificaciones: [{
        usuario: { 
            type: Schema.Types.ObjectId, 
            ref: 'Usuario',
            required: true
        },
        puntuacion: { 
            type: Number, 
            min: [1, 'La puntuación mínima es 1'], 
            max: [5, 'La puntuación máxima es 5'],
            required: true
        },
        comentario: {
            type: String,
            maxlength: [500, 'El comentario no puede exceder 500 caracteres']
        },
        fecha: { 
            type: Date, 
            default: Date.now 
        },
        util: {
            type: Number,
            default: 0,
            min: [0, 'No puede ser negativo']
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
            maxlength: [1000, 'El comentario no puede exceder 1000 caracteres']
        },
        fecha: { 
            type: Date, 
            default: Date.now 
        },
        respuestas: [{
            usuario: { 
                type: Schema.Types.ObjectId, 
                ref: 'Usuario',
                required: true
            },
            contenido: {
                type: String,
                required: true,
                maxlength: [500, 'La respuesta no puede exceder 500 caracteres']
            },
            fecha: { 
                type: Date, 
                default: Date.now 
            }
        }],
        util: {
            type: Number,
            default: 0,
            min: [0, 'No puede ser negativo']
        }
    }],
    fechaCreacion: {
        type: Date,
        required: true,
        default: Date.now,
        immutable: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        index: true
    },
    estadoCurso: {
        type: String,
        enum: {
            values: ['activo', 'borrador', 'finalizado', 'archivado'],
            message: 'Estado inválido'
        },
        default: 'borrador',
        index: true
    },
    costo: {
        type: Number,
        min: [0, 'El costo no puede ser negativo'],
        required: true
    },
    duracion: {
        type: Number, // en minutos
        min: [0, 'La duración no puede ser negativa'],
        max: [10080, 'La duración no puede exceder 1 semana'], // 1 semana máximo
        default: 0
    },
    idioma: {
        type: String,
        enum: ['español', 'ingles', 'portugues', 'frances', 'aleman'],
        default: 'español'
    },
    certificado: {
        disponible: { 
            type: Boolean, 
            default: false 
        },
        requisitos: [{
            type: String,
            maxlength: [200, 'Cada requisito no puede exceder 200 caracteres']
        }],
        plantilla: {
            type: String,
            default: 'default'
        }
    },
    requisitos: [{
        tipo: {
            type: String,
            enum: ['conocimiento', 'herramienta', 'software', 'hardware'],
            required: true
        },
        descripcion: {
            type: String,
            required: true,
            maxlength: [300, 'La descripción no puede exceder 300 caracteres']
        },
        obligatorio: {
            type: Boolean,
            default: true
        }
    }],
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
    }],
    cupones: [{
        codigo: {
            type: String,
            required: true,
            unique: true,
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
        fechaInicio: {
            type: Date,
            required: true
        },
        fechaFin: {
            type: Date,
            required: true
        },
        maxUsos: {
            type: Number,
            default: -1 // -1 = ilimitado
        },
        usosActuales: {
            type: Number,
            default: 0
        },
        activo: {
            type: Boolean,
            default: true
        }
    }]
}, {
    collection: 'cursos',
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Calcular estadísticas en tiempo real
            if (ret.calificaciones && ret.calificaciones.length > 0) {
                const total = ret.calificaciones.reduce((sum, cal) => sum + cal.puntuacion, 0);
                ret.estadisticas.calificacionPromedio = (total / ret.calificaciones.length).toFixed(1);
                ret.estadisticas.totalCalificaciones = ret.calificaciones.length;
            }
            return ret;
        }
    }
});

// Índices para mejorar búsquedas
cursoSchema.index({ titulo: 'text', descripcion: 'text', etiquetas: 'text' });
cursoSchema.index({ categoria: 1 });
cursoSchema.index({ nivel: 1 });
cursoSchema.index({ precio: 1 });
cursoSchema.index({ owner: 1 });
cursoSchema.index({ estadoCurso: 1 });
cursoSchema.index({ visibilidad: 1 });
cursoSchema.index({ fechaCreacion: -1 });
cursoSchema.index({ 'estadisticas.calificacionPromedio': -1 });
cursoSchema.index({ 'estadisticas.totalVentas': -1 });

// Índices compuestos para consultas frecuentes
cursoSchema.index({ categoria: 1, nivel: 1, precio: 1 });
cursoSchema.index({ owner: 1, estadoCurso: 1 });
cursoSchema.index({ visibilidad: 1, estadoCurso: 1 });

// Virtual para precio con descuento
cursoSchema.virtual('precioConDescuento').get(function() {
    if (this.cupones && this.cupones.length > 0) {
        const cuponActivo = this.cupones.find(c => 
            c.activo && 
            c.fechaInicio <= new Date() && 
            c.fechaFin >= new Date() &&
            (c.maxUsos === -1 || c.usosActuales < c.maxUsos)
        );
        
        if (cuponActivo) {
            if (cuponActivo.tipo === 'porcentaje') {
                return this.precio * (1 - cuponActivo.descuento / 100);
            } else {
                return Math.max(0, this.precio - cuponActivo.descuento);
            }
        }
    }
    return this.precio;
});

// Virtual para duración total del curso
cursoSchema.virtual('duracionTotal').get(function() {
    if (this.lecciones && this.lecciones.length > 0) {
        return this.lecciones.reduce((total, leccion) => total + (leccion.duracion || 0), 0);
    }
    return this.duracion;
});

// Virtual para total de lecciones
cursoSchema.virtual('totalLecciones').get(function() {
    return this.lecciones ? this.lecciones.length : 0;
});

// Método para calcular estadísticas
cursoSchema.methods.actualizarEstadisticas = function() {
    if (this.calificaciones && this.calificaciones.length > 0) {
        const total = this.calificaciones.reduce((sum, cal) => sum + cal.puntuacion, 0);
        this.estadisticas.calificacionPromedio = parseFloat((total / this.calificaciones.length).toFixed(1));
        this.estadisticas.totalCalificaciones = this.calificaciones.length;
    }
    
    this.estadisticas.totalComentarios = this.comentarios ? this.comentarios.length : 0;
    
    return this.save();
};

// Método para agregar calificación
cursoSchema.methods.agregarCalificacion = function(usuarioId, puntuacion, comentario = '') {
    // Verificar si el usuario ya calificó
    const calificacionExistente = this.calificaciones.find(
        cal => cal.usuario.toString() === usuarioId.toString()
    );
    
    if (calificacionExistente) {
        // Actualizar calificación existente
        calificacionExistente.puntuacion = puntuacion;
        calificacionExistente.comentario = comentario;
        calificacionExistente.fecha = new Date();
    } else {
        // Agregar nueva calificación
        this.calificaciones.push({
            usuario: usuarioId,
            puntuacion,
            comentario,
            fecha: new Date()
        });
    }
    
    // Actualizar estadísticas
    this.actualizarEstadisticas();
    
    return this.save();
};

// Método para agregar comentario
cursoSchema.methods.agregarComentario = function(usuarioId, contenido) {
    this.comentarios.push({
        usuario: usuarioId,
        contenido,
        fecha: new Date()
    });
    
    this.estadisticas.totalComentarios = this.comentarios.length;
    
    return this.save();
};

// Método para verificar si un usuario puede acceder al curso
cursoSchema.methods.usuarioPuedeAcceder = function(usuarioId, esOwner = false) {
    if (esOwner) return true;
    if (this.visibilidad === 'publico') return true;
    if (this.visibilidad === 'soloSuscriptores') {
        // Aquí se verificaría la suscripción
        return false; // Implementar lógica de suscripción
    }
    return false;
};

// Middleware pre-save para validaciones
cursoSchema.pre('save', function(next) {
    try {
        // Validar que el precio sea mayor o igual al costo
        if (this.precio < this.costo) {
            throw new Error('El precio no puede ser menor al costo');
        }
        
        // Validar que las lecciones tengan orden secuencial
        if (this.lecciones && this.lecciones.length > 0) {
            const ordenes = this.lecciones.map(l => l.orden).sort((a, b) => a - b);
            for (let i = 0; i < ordenes.length; i++) {
                if (ordenes[i] !== i + 1) {
                    throw new Error('Las lecciones deben tener orden secuencial');
                }
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware post-save para logging
cursoSchema.post('save', function(doc) {
    console.log(`Curso "${doc.titulo}" ${doc.isNew ? 'creado' : 'actualizado'}`);
});

module.exports = mongoose.model('Curso', cursoSchema);
