const { Dado, Cuando, Entonces } = require('@cucumber/cucumber');
const { expect } = require('chai');
const { validarContrasena } = require('../../../utils/validadores');

// Configuración inicial
Dado('una instancia del validador de contraseñas', function () {
  // No se necesita configuración adicional para este caso simple
});

// Pasos de prueba unitaria
Cuando('valido la contraseña {string}', function (contrasena) {
  this.contrasena = contrasena;
  this.resultado = validarContrasena(contrasena);
});

Entonces('la validación debe ser {string}', function (resultadoEsperado) {
  const esperado = resultadoEsperado.toLowerCase() === 'true';
  expect(this.resultado.valida).to.equal(
    esperado,
    `Se esperaba que la validación fuera ${esperado} para la contraseña "${this.contrasena}"`
  );
});

Entonces('debo ver el mensaje de error {string}', function (mensajeEsperado) {
  if (this.resultado.valida) {
    throw new Error('La validación fue exitosa, no se esperaba un mensaje de error');
  }
  expect(this.resultado.mensaje).to.include(
    mensajeEsperado,
    `Se esperaba el mensaje de error que contenga "${mensajeEsperado}"`
  );
});

// Escenarios de prueba específicos
Dado('una contraseña con menos de 8 caracteres', function () {
  this.contrasena = 'A1b2!c3';
});

Dado('una contraseña sin mayúsculas', function () {
  this.contrasena = 'contraseña123!';
});

Dado('una contraseña sin minúsculas', function () {
  this.contrasena = 'CONTRASEÑA123!';
});

Dado('una contraseña sin números', function () {
  this.contrasena = 'Contraseña!';
});

Dado('una contraseña sin caracteres especiales', function () {
  this.contrasena = 'Contraseña123';
});

Dado('una contraseña válida', function () {
  this.contrasena = 'Contraseña123!';
});
