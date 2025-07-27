const mongoose = require('../config/db');

const CategoriaSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true, 
        unique: true }
}, { 
    versionKey: false 
});

module.exports = mongoose.model('Categoria', CategoriaSchema);
