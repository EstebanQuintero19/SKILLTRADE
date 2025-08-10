const mongoose = require('mongoose');
const { Schema } = mongoose;

const bibliotecaSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio'],
        unique: true,
        index: true
    },
    cursos: [{
        curso: {
            type: Schema.Types.ObjectId,
            ref: 'Curso',
            required: [true, 'El curso es obligatorio'],
            index: true
        },
        fechaAdquisicion: {
            type: Date,
            default: Date.now,
            required: true
        },
        metodoAdquisicion: {
            type: String,
            enum: {
                values: ['compra', 'intercambio', 'suscripcion', 'regalo', 'promocion'],
                message: 'Método de adquisición inválido'
            },
            required: true
        },
        estado: {
            type: String,
            enum: {
                values: ['activo', 'completado', 'en_progreso', 'pausado', 'archivado'],
                message: 'Estado inválido'
            },
            default: 'activo'
        },
        progreso: {
            leccionesCompletadas: {
                type: Number,
                default: 0,
                min: [0, 'Las lecciones completadas no pueden ser negativas']
            },
            totalLecciones: {
                type: Number,
                default: 0,
                min: [0, 'El total de lecciones no puede ser negativo']
            },
            porcentajeCompletado: {
                type: Number,
                default: 0,
                min: [0, 'El porcentaje no puede ser negativo'],
                max: [100, 'El porcentaje no puede exceder 100%']
            },
            tiempoTotal: {
                type: Number, // en minutos
                default: 0,
                min: [0, 'El tiempo no puede ser negativo']
            },
            ultimaActividad: {
                type: Date,
                default: Date.now
            }
        },
        notas: [{
            titulo: {
                type: String,
                required: true,
                maxlength: [100, 'El título no puede exceder 100 caracteres']
            },
            contenido: {
                type: String,
                required: true,
                maxlength: [1000, 'El contenido no puede exceder 1000 caracteres']
            },
            fecha: {
                type: Date,
                default: Date.now
            },
            leccion: {
                type: Schema.Types.ObjectId,
                ref: 'Leccion'
            },
            tags: [{
                type: String,
                maxlength: [50, 'Cada tag no puede exceder 50 caracteres']
            }]
        }],
        favoritos: [{
            leccion: {
                type: Schema.Types.ObjectId,
                ref: 'Leccion'
            },
            fecha: {
                type: Date,
                default: Date.now
            },
            tipo: {
                type: String,
                enum: ['leccion', 'recurso', 'ejercicio'],
                default: 'leccion'
            }
        }],
        certificado: {
            emitido: {
                type: Boolean,
                default: false
            },
            fechaEmision: Date,
            codigo: {
                type: String,
                unique: true,
                sparse: true
            },
            calificacion: {
                type: Number,
                min: [0, 'La calificación mínima es 0'],
                max: [100, 'La calificación máxima es 100']
            },
            descargado: {
                type: Boolean,
                default: false
            }
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
                maxlength: [500, 'La URL no puede exceder 500 caracteres']
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
    estadisticas: {
        totalCursos: {
            type: Number,
            default: 0,
            min: [0, 'El total no puede ser negativo']
        },
        cursosCompletados: {
            type: Number,
            default: 0,
            min: [0, 'El total no puede ser negativo']
        },
        tiempoTotal: {
            type: Number, // en minutos
            default: 0,
            min: [0, 'El tiempo no puede ser negativo']
        },
        certificadosObtenidos: {
            type: Number,
            default: 0,
            min: [0, 'El total no puede ser negativo']
        },
        ultimaActividad: {
            type: Date,
            default: Date.now
        },
        rachaActual: {
            type: Number,
            default: 0,
            min: [0, 'La racha no puede ser negativa']
        },
        rachaMaxima: {
            type: Number,
            default: 0,
            min: [0, 'La racha no puede ser negativa']
        }
    },
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
            min: [0, 'Los puntos no pueden ser negativos']
        }
    }],
    fechaCreacion: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    fechaActualizacion: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'bibliotecas',
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Calcular estadísticas en tiempo real
            ret.estadisticas = doc.calcularEstadisticas();
            return ret;
        }
    }
});

// Índices para mejorar consultas
bibliotecaSchema.index({ usuario: 1 });
bibliotecaSchema.index({ 'cursos.curso': 1 });
bibliotecaSchema.index({ 'cursos.estado': 1 });
bibliotecaSchema.index({ 'cursos.fechaAdquisicion': -1 });
bibliotecaSchema.index({ 'estadisticas.ultimaActividad': -1 });

// Índices compuestos para consultas frecuentes
bibliotecaSchema.index({ usuario: 1, 'cursos.estado': 1 });
bibliotecaSchema.index({ 'cursos.estado': 1, 'cursos.ultimaActividad': -1 });

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
            leccionesCompletadas: 0,
            totalLecciones: 0,
            porcentajeCompletado: 0,
            tiempoTotal: 0,
            ultimaActividad: new Date()
        }
    });
    
    this.fechaActualizacion = new Date();
    this.actualizarEstadisticas();
    
    return this.save();
};

// Método para remover curso de la biblioteca
bibliotecaSchema.methods.removerCurso = function(cursoId) {
    this.cursos = this.cursos.filter(c => 
        c.curso.toString() !== cursoId.toString()
    );
    
    this.fechaActualizacion = new Date();
    this.actualizarEstadisticas();
    
    return this.save();
};

// Método para actualizar progreso de un curso
bibliotecaSchema.methods.actualizarProgreso = function(cursoId, leccionesCompletadas, totalLecciones, tiempoMinutos = 0) {
    const curso = this.cursos.find(c => 
        c.curso.toString() === cursoId.toString()
    );
    
    if (!curso) {
        throw new Error('Curso no encontrado en la biblioteca');
    }
    
    curso.progreso.leccionesCompletadas = leccionesCompletadas;
    curso.progreso.totalLecciones = totalLecciones;
    curso.progreso.porcentajeCompletado = totalLecciones > 0 ? 
        Math.round((leccionesCompletadas / totalLecciones) * 100) : 0;
    curso.progreso.tiempoTotal += tiempoMinutos;
    curso.progreso.ultimaActividad = new Date();
    
    // Actualizar estado del curso
    if (curso.progreso.porcentajeCompletado >= 100) {
        curso.estado = 'completado';
        this.emitirCertificado(cursoId);
    } else if (curso.progreso.porcentajeCompletado > 0) {
        curso.estado = 'en_progreso';
    }
    
    this.fechaActualizacion = new Date();
    this.actualizarEstadisticas();
    
    return this.save();
};

// Método para emitir certificado
bibliotecaSchema.methods.emitirCertificado = function(cursoId) {
    const curso = this.cursos.find(c => 
        c.curso.toString() === cursoId.toString()
    );
    
    if (!curso) {
        throw new Error('Curso no encontrado en la biblioteca');
    }
    
    if (curso.estado === 'completado' && !curso.certificado.emitido) {
        curso.certificado.emitido = true;
        curso.certificado.fechaEmision = new Date();
        curso.certificado.codigo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        curso.certificado.calificacion = Math.floor(Math.random() * 21) + 80; // 80-100
        
        // Agregar logro
        this.agregarLogro('Curso Completado', 'Has completado un curso exitosamente', 'trophy', 'progreso', 100);
        
        return this.save();
    }
    
    return false;
};

// Método para agregar nota a un curso
bibliotecaSchema.methods.agregarNota = function(cursoId, titulo, contenido, leccionId = null, tags = []) {
    const curso = this.cursos.find(c => 
        c.curso.toString() === cursoId.toString()
    );
    
    if (!curso) {
        throw new Error('Curso no encontrado en la biblioteca');
    }
    
    curso.notas.push({
        titulo,
        contenido,
        fecha: new Date(),
        leccion: leccionId,
        tags: tags.slice(0, 5) // Máximo 5 tags
    });
    
    this.fechaActualizacion = new Date();
    
    return this.save();
};

// Método para agregar a favoritos
bibliotecaSchema.methods.agregarFavorito = function(cursoId, leccionId, tipo = 'leccion') {
    const curso = this.cursos.find(c => 
        c.curso.toString() === cursoId.toString()
    );
    
    if (!curso) {
        throw new Error('Curso no encontrado en la biblioteca');
    }
    
    // Verificar si ya está en favoritos
    const favoritoExistente = curso.favoritos.find(f => 
        f.leccion.toString() === leccionId.toString() && f.tipo === tipo
    );
    
    if (favoritoExistente) {
        throw new Error('Ya está en favoritos');
    }
    
    curso.favoritos.push({
        leccion: leccionId,
        fecha: new Date(),
        tipo
    });
    
    this.fechaActualizacion = new Date();
    
    return this.save();
};

// Método para crear colección
bibliotecaSchema.methods.crearColeccion = function(nombre, descripcion, privada = false, color = '#007bff') {
    const coleccionExistente = this.colecciones.find(c => 
        c.nombre.toLowerCase() === nombre.toLowerCase()
    );
    
    if (coleccionExistente) {
        throw new Error('Ya existe una colección con ese nombre');
    }
    
    this.colecciones.push({
        nombre,
        descripcion,
        cursos: [],
        fechaCreacion: new Date(),
        privada,
        color
    });
    
    this.fechaActualizacion = new Date();
    
    return this.save();
};

// Método para agregar curso a colección
bibliotecaSchema.methods.agregarCursoAColeccion = function(nombreColeccion, cursoId) {
    const coleccion = this.colecciones.find(c => 
        c.nombre.toLowerCase() === nombreColeccion.toLowerCase()
    );
    
    if (!coleccion) {
        throw new Error('Colección no encontrada');
    }
    
    if (coleccion.cursos.includes(cursoId)) {
        throw new Error('El curso ya está en la colección');
    }
    
    coleccion.cursos.push(cursoId);
    this.fechaActualizacion = new Date();
    
    return this.save();
};

// Método para agregar logro
bibliotecaSchema.methods.agregarLogro = function(nombre, descripcion, icono, tipo, puntos = 0) {
    const logroExistente = this.logros.find(l => 
        l.nombre === nombre
    );
    
    if (logroExistente) {
        return false; // Ya tiene este logro
    }
    
    this.logros.push({
        nombre,
        descripcion,
        icono,
        fechaObtencion: new Date(),
        tipo,
        puntos
    });
    
    this.fechaActualizacion = new Date();
    
    return this.save();
};

// Método para calcular estadísticas
bibliotecaSchema.methods.calcularEstadisticas = function() {
    const totalCursos = this.cursos.length;
    const cursosCompletados = this.cursos.filter(c => c.estado === 'completado').length;
    const tiempoTotal = this.cursos.reduce((total, c) => total + c.progreso.tiempoTotal, 0);
    const certificadosObtenidos = this.cursos.filter(c => c.certificado.emitido).length;
    
    // Calcular racha
    const hoy = new Date();
    const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
    
    let rachaActual = 0;
    let rachaMaxima = this.estadisticas.rachaMaxima;
    
    // Lógica simple para racha (se puede mejorar)
    if (this.estadisticas.ultimaActividad >= ayer) {
        rachaActual = this.estadisticas.rachaActual + 1;
        rachaMaxima = Math.max(rachaMaxima, rachaActual);
    }
    
    this.estadisticas = {
        totalCursos,
        cursosCompletados,
        tiempoTotal,
        certificadosObtenidos,
        ultimaActividad: new Date(),
        rachaActual,
        rachaMaxima
    };
    
    return this.estadisticas;
};

// Método para actualizar estadísticas
bibliotecaSchema.methods.actualizarEstadisticas = function() {
    this.calcularEstadisticas();
    return this.save();
};

// Método para obtener recomendaciones
bibliotecaSchema.methods.obtenerRecomendaciones = function() {
    const categoriasFavoritas = this.cursos
        .filter(c => c.estado === 'completado' || c.estado === 'en_progreso')
        .reduce((acc, curso) => {
            // Aquí se implementaría la lógica de recomendaciones
            // Por ahora retornamos un array vacío
            return acc;
        }, []);
    
    return categoriasFavoritas;
};

// Middleware pre-save para validaciones
bibliotecaSchema.pre('save', function(next) {
    try {
        // Validar que el usuario exista
        if (!this.usuario) {
            throw new Error('El usuario es obligatorio');
        }
        
        // Validar que los cursos tengan datos válidos
        this.cursos.forEach(curso => {
            if (!curso.curso) {
                throw new Error('Datos de curso inválidos');
            }
            
            // Validar porcentaje de progreso
            if (curso.progreso.porcentajeCompletado < 0 || curso.progreso.porcentajeCompletado > 100) {
                throw new Error('Porcentaje de progreso inválido');
            }
        });
        
        // Actualizar fecha de actualización
        this.fechaActualizacion = new Date();
        
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware post-save para logging
bibliotecaSchema.post('save', function(doc) {
    console.log(`Biblioteca ${doc._id} ${doc.isNew ? 'creada' : 'actualizada'} - Cursos: ${doc.cursos.length}`);
});

module.exports = mongoose.model('Biblioteca', bibliotecaSchema);
