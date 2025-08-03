const mongoose = require('mongoose');
const { Schema } = mongoose;

const exchangeSchema = new Schema({
  emisor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario emisor es obligatorio']
  },
  receptor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario receptor es obligatorio']
  },
  curso: {
    type: Schema.Types.ObjectId,
    ref: 'Curso',
    required: [true, 'El curso es obligatorio']
  },
  tipo: {
    type: String,
    enum: ['prestamo', 'intercambio', 'compartido'],
    required: [true, 'El tipo de intercambio es obligatorio']
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'],
    default: 'pendiente'
  },
  fechaSolicitud: {
    type: Date,
    default: Date.now
  },
  fechaExpiracion: {
    type: Date
  }
}, {
  collection: 'exchange',
  timestamps: true
});

module.exports = mongoose.model('Exchange', exchangeSchema);
