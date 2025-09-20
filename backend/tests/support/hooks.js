const { Before, After, BeforeAll, AfterAll } = require('@cucumber/cucumber');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const request = require('supertest');

let mongoServer;
let testApp;

BeforeAll(async function () {
  // Configurar base de datos en memoria para pruebas
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Conectar a la base de datos de prueba
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  testApp = request(app);
});

AfterAll(async function () {
  // Limpiar después de todas las pruebas
  await mongoose.disconnect();
  await mongoServer.stop();
});

Before(async function () {
  // Limpiar la base de datos antes de cada escenario
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

After(async function () {
  // Limpiar después de cada escenario si es necesario
  // Aquí podrías agregar limpieza específica si la necesitas
});

// Hacer disponible la app de prueba globalmente
global.testApp = testApp;
global.mongoose = mongoose;
