const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const crypto = require('crypto');

// Función que vamos a probar (extraída del controlador)
const generarApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

let apiKey;
let apiKeys = [];

Given('que tengo acceso a la función generarApiKey', function () {
    // Verificar que la función existe y es una función
    expect(typeof generarApiKey).to.equal('function');
});

When('genero una nueva API Key', function () {
    apiKey = generarApiKey();
});

When('genero {int} API Keys diferentes', function (cantidad) {
    apiKeys = [];
    for (let i = 0; i < cantidad; i++) {
        apiKeys.push(generarApiKey());
    }
});

Then('la API Key debe tener {int} caracteres hexadecimales', function (longitud) {
    expect(apiKey).to.have.lengthOf(longitud);
    // Verificar que solo contiene caracteres hexadecimales
    expect(apiKey).to.match(/^[0-9a-f]+$/);
});

Then('la API Key debe ser única', function () {
    // Generar otra API Key para comparar
    const otraApiKey = generarApiKey();
    expect(apiKey).to.not.equal(otraApiKey);
});

Then('todas las API Keys deben ser únicas', function () {
    // Verificar que no hay duplicados
    const keysUnicas = new Set(apiKeys);
    expect(keysUnicas.size).to.equal(apiKeys.length);
});

Then('todas deben tener {int} caracteres hexadecimales', function (longitud) {
    apiKeys.forEach(key => {
        expect(key).to.have.lengthOf(longitud);
        expect(key).to.match(/^[0-9a-f]+$/);
    });
});
