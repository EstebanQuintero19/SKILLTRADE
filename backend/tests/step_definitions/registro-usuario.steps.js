const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const Usuario = require('../../../model/usuario.model');
const Biblioteca = require('../../../model/biblioteca.model');

let respuesta;
let datosRegistro;

Given('que estoy en la página de registro', function () {
    // Simular que estamos en la página de registro
    // No necesitamos hacer nada específico aquí
});

Given('no existe un usuario con email {string}', async function (email) {
    const usuario = await Usuario.findOne({ email });
    expect(usuario).to.be.null;
});

Given('que ya existe un usuario con email {string}', async function (email) {
    // Crear un usuario existente para probar duplicados
    const usuarioExistente = new Usuario({
        email,
        nombre: 'Usuario Existente',
        password: 'hashedpassword',
        fechaCreacion: new Date()
    });
    await usuarioExistente.save();
});

When('envío una solicitud de registro con:', async function (dataTable) {
    // Convertir la tabla de datos a un objeto
    datosRegistro = {};
    dataTable.hashes().forEach(row => {
        if (row.valor !== '') {
            datosRegistro[row.campo] = row.valor;
        }
    });

    // Simular la llamada al endpoint de registro
    respuesta = await testApp
        .post('/api/usuarios')
        .send(datosRegistro);
});

Then('debo recibir una respuesta exitosa con código {int}', function (codigoEsperado) {
    expect(respuesta.status).to.equal(codigoEsperado);
});

Then('la respuesta debe contener el mensaje {string}', function (mensajeEsperado) {
    expect(respuesta.body.message).to.equal(mensajeEsperado);
});

Then('debo recibir los datos del usuario creado', function () {
    expect(respuesta.body.data).to.exist;
    expect(respuesta.body.data.usuario).to.exist;
    expect(respuesta.body.data.usuario.email).to.equal(datosRegistro.email);
    expect(respuesta.body.data.usuario.nombre).to.equal(datosRegistro.nombre);
    expect(respuesta.body.data.usuario.id).to.exist;
});

Then('el usuario debe tener un API Key generado', function () {
    expect(respuesta.body.data.usuario.apiKey).to.exist;
    expect(respuesta.body.data.usuario.apiKey).to.have.lengthOf(64);
    expect(respuesta.body.data.usuario.apiKey).to.match(/^[0-9a-f]+$/);
});

Then('debe existir una biblioteca asociada al usuario', async function () {
    const usuarioId = respuesta.body.data.usuario.id;
    const biblioteca = await Biblioteca.findOne({ usuario: usuarioId });
    expect(biblioteca).to.not.be.null;
    expect(biblioteca.usuario.toString()).to.equal(usuarioId);
});

Then('debo recibir un error con código {int}', function (codigoEsperado) {
    expect(respuesta.status).to.equal(codigoEsperado);
    expect(respuesta.body.success).to.be.false;
});

Then('la respuesta debe indicar formato de email inválido', function () {
    // Verificar que el error está relacionado con el formato del email
    expect(respuesta.body.message).to.include('email');
});
