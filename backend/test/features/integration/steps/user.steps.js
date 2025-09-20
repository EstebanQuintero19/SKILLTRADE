const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../app');
const Usuario = require('../../../models/usuario');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuración inicial
const SALT_ROUNDS = 10;

// Antecedentes
Dado('que la base de datos está limpia', async function () {
  await Usuario.deleteMany({});
  this.usuarioPrueba = null;
  this.usuarioCreado = null;
});

Dado('que existe un usuario con el correo {string}', async function (email) {
  const hashedPassword = await bcrypt.hash('ClaveSegura123!', SALT_ROUNDS);
  this.usuarioPrueba = await Usuario.create({
    nombre: 'Usuario Existente',
    email,
    password: hashedPassword,
    rol: 'estudiante',
    verificado: true,
    fechaRegistro: new Date()
  });
  this.emailExistente = email;
});

// Pasos de acción
Cuando('envío una solicitud {string} a {string} con:', async function (metodo, ruta, datos) {
  try {
    this.respuesta = await request(app)
      [metodo.toLowerCase()](ruta)
      .set('Content-Type', 'application/json')
      .send(JSON.parse(datos));
  } catch (error) {
    this.error = error;
  }
});

// Pasos de validación
Entonces('el estado de la respuesta debe ser {int}', function (codigoEstado) {
  expect(this.respuesta.status).to.equal(codigoEstado);
});

Entonces('la respuesta debe contener un mensaje de éxito', function () {
  expect(this.respuesta.body).to.have.property('exito', true);
  expect(this.respuesta.body).to.have.property('mensaje');
  expect(this.respuesta.body.mensaje).to.be.a('string').that.is.not.empty;
});

Entonces('la respuesta debe contener un token de acceso', function () {
  expect(this.respuesta.body).to.have.property('token');
  const token = this.respuesta.body.token;
  expect(token).to.be.a('string').that.is.not.empty;
  
  // Verificar que el token es válido
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  expect(decoded).to.have.property('id');
  this.usuarioId = decoded.id;
});

Entonces('un nuevo usuario debe crearse en la base de datos', async function () {
  const usuario = await Usuario.findOne({ email: 'usuario@ejemplo.com' });
  expect(usuario).to.exist;
  expect(usuario.nombre).to.equal('Usuario de Prueba');
  expect(usuario.rol).to.equal('estudiante');
  expect(usuario.verificado).to.be.false;
  expect(usuario.fechaRegistro).to.be.a('date');
});

Entonces('el usuario debe tener el rol {string}', async function (rol) {
  const usuario = await Usuario.findOne({ email: 'usuario@ejemplo.com' });
  expect(usuario.rol).to.equal(rol);
});

Entonces('el usuario debe estar verificado', async function () {
  const usuario = await Usuario.findOne({ email: 'usuario@ejemplo.com' });
  expect(usuario.verificado).to.be.true;
});

Entonces('la respuesta debe contener un mensaje de error indicando que el correo ya existe', function () {
  expect(this.respuesta.body).to.have.property('exito', false);
  expect(this.respuesta.body).to.have.property('error');
  expect(this.respuesta.body.error).to.include('ya está registrado');
});

Entonces('la respuesta debe contener un mensaje de error sobre la contraseña inválida', function () {
  expect(this.respuesta.body).to.have.property('exito', false);
  expect(this.respuesta.body).to.have.property('error');
  expect(this.respuesta.body.error).to.include('contraseña');
  expect(this.respuesta.body.error).to.match(/débil|inválida|requisitos/i);
});
