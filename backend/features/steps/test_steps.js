const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Given('que tengo una prueba configurada', function () {
  this.pruebaConfigurada = true;
});

When('ejecuto la prueba', function () {
  this.resultado = 'éxito';
});

Then('debería ver un mensaje de éxito', function () {
  expect(this.pruebaConfigurada).to.be.true;
  expect(this.resultado).to.equal('éxito');
});
