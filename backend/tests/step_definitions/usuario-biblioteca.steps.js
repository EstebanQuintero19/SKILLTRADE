const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const Usuario = require('../../../model/usuario.model');
const Biblioteca = require('../../../model/biblioteca.model');

let usuarioCreado;
let bibliotecaCreada;
let respuestaRegistro;

Given('que no existe ningún usuario en el sistema', async function () {
    // Verificar que no hay usuarios en la base de datos
    const usuarios = await Usuario.find();
    expect(usuarios).to.have.lengthOf(0);
});

When('registro un nuevo usuario con email {string} y nombre {string}', async function (email, nombre) {
    // Simular el registro de usuario como lo haría el controlador
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    
    const password = 'password123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Crear usuario
    usuarioCreado = new Usuario({
        email,
        nombre,
        password: passwordHash,
        biografia: '',
        telefono: '',
        apiKey,
        fechaCreacion: new Date()
    });

    await usuarioCreado.save();

    // Crear biblioteca para el usuario (como lo hace el controlador)
    bibliotecaCreada = new Biblioteca({
        usuario: usuarioCreado._id,
        cursos: [],
        favoritos: [],
        logros: [],
        ultimaActividad: new Date()
    });
    
    await bibliotecaCreada.save();
});

Then('el usuario debe ser creado exitosamente', function () {
    expect(usuarioCreado).to.not.be.null;
    expect(usuarioCreado._id).to.exist;
});

Then('debe existir una biblioteca asociada al usuario', async function () {
    const biblioteca = await Biblioteca.findOne({ usuario: usuarioCreado._id });
    expect(biblioteca).to.not.be.null;
    expect(biblioteca.usuario.toString()).to.equal(usuarioCreado._id.toString());
});

Then('la biblioteca debe estar inicializada con arrays vacíos', async function () {
    const biblioteca = await Biblioteca.findOne({ usuario: usuarioCreado._id });
    expect(biblioteca.cursos).to.be.an('array').that.is.empty;
    expect(biblioteca.favoritos).to.be.an('array').that.is.empty;
    expect(biblioteca.logros).to.be.an('array').that.is.empty;
});

Then('el usuario debe tener un ID válido', function () {
    expect(usuarioCreado._id).to.exist;
    expect(usuarioCreado._id.toString()).to.match(/^[0-9a-fA-F]{24}$/);
});

Then('la biblioteca debe tener el mismo ID de usuario', async function () {
    const biblioteca = await Biblioteca.findOne({ usuario: usuarioCreado._id });
    expect(biblioteca.usuario.toString()).to.equal(usuarioCreado._id.toString());
});

Then('la biblioteca debe tener cursos vacío', async function () {
    const biblioteca = await Biblioteca.findOne({ usuario: usuarioCreado._id });
    expect(biblioteca.cursos).to.be.an('array').that.is.empty;
});

Then('la biblioteca debe tener favoritos vacío', async function () {
    const biblioteca = await Biblioteca.findOne({ usuario: usuarioCreado._id });
    expect(biblioteca.favoritos).to.be.an('array').that.is.empty;
});

Then('la biblioteca debe tener logros vacío', async function () {
    const biblioteca = await Biblioteca.findOne({ usuario: usuarioCreado._id });
    expect(biblioteca.logros).to.be.an('array').that.is.empty;
});

Then('la biblioteca debe tener fecha de última actividad', async function () {
    const biblioteca = await Biblioteca.findOne({ usuario: usuarioCreado._id });
    expect(biblioteca.ultimaActividad).to.be.a('date');
    expect(biblioteca.ultimaActividad).to.be.at.most(new Date());
});
