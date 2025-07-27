const mongoose = require('../config/db');

const CursoSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true 
    },
    descripcion: { 
        type: String 
    },
    categoria: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Categoria' 
    },
    fechaCreacion: { 
        type: Date, 
        default: Date.now 
    },
    horaCreacion: { 
        type: String 
    },
    numeroSesiones: { 
        type: Number, 
        default: 0 },
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario' 
    },
    estadoCurso: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'EstadoCurso' 
    },
    costo: { 
        type: Number, 
        required: true 
    }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('Curso', CursoSchema);

//agregar el campo de estadoCurso (0, 1)
//costo por defecto en free