const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../../app');
const Usuario = require('../../../models/usuario');
const Curso = require('../../../models/curso');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configuración inicial
const SALT_ROUNDS = 10;

// Antecedentes
Dado('que existe un usuario con el correo {string}', async function (email) {
  const hashedPassword = await bcrypt.hash('ClaveSegura123!', SALT_ROUNDS);
  this.usuarioPrueba = await Usuario.create({
    nombre: 'Instructor de Prueba',
    email,
    password: hashedPassword,
    rol: 'instructor',
    verificado: true
  });
});

Dado('el usuario ha iniciado sesión', async function () {
  // Simulamos el login para obtener el token
  const loginResponse = await request(app)
    .post('/api/usuarios/login')
    .send({
      email: this.usuarioPrueba.email,
      password: 'ClaveSegura123!'
    });
  
  this.token = loginResponse.body.token;
});

// Pasos de acción
When('envía una solicitud POST a {string} con:', async function (ruta, datos) {
  this.respuesta = await request(app)
    .post(ruta)
    .set('Authorization', `Bearer ${this.token}`)
    .set('Content-Type', 'application/json')
    .send(JSON.parse(datos));
});

// Pasos de validación
Then('el estado de la respuesta debe ser {int}', function (codigoEstado) {
  expect(this.respuesta.status).to.equal(codigoEstado);
});

Then('la respuesta debe contener un mensaje de éxito', function () {
  expect(this.respuesta.body).to.have.property('exito', true);
  expect(this.respuesta.body).to.have.property('mensaje');
  expect(this.respuesta.body.mensaje).to.be.a('string').that.is.not.empty;
});

Then('el curso debe estar asociado al usuario en la base de datos', async function () {
  // Buscar el curso recién creado
  const curso = await Curso.findOne({ titulo: 'Introducción a Node.js' });
  expect(curso).to.exist;
  
  // Verificar que el curso está asociado al usuario correcto
  expect(curso.instructor.toString()).to.equal(this.usuarioPrueba._id.toString());
  
  // Verificar que el usuario tiene el curso en su lista de cursos
  const usuario = await Usuario.findById(this.usuarioPrueba._id);
  expect(usuario.cursosDictados).to.include(curso._id);
});

// Limpieza después de las pruebas
after(async function() {
  await Usuario.deleteMany({});
  await Curso.deleteMany({});
});
