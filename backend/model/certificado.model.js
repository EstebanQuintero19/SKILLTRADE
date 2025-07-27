const mongoose = require('../config/db');

const CertificadoSchema = new mongoose.Schema(
    {
        titulo: {
            type: String, 
            required: true 
        },
        numeroIdentificacion: {
            type: String, 
            required: true 
        },
        redaccion: { 
            type: String, 
            default: '' 
        },
        usuario: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Usuario', 
            required: true 
        },
        institucionEmisora: {
            type: String, 
            required: true 
        },
        fechaEmision: {
            type: Date, 
            default: Date.now 
        }
    },
    { 
        versionKey: false,
        timestamps: true 
    }
);

module.exports = mongoose.model('Certificado', CertificadoSchema);
