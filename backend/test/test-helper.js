const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Cargar configuración de pruebas
require('./config/test-setup');

let mongoServer;

// Configuración global de pruebas
global.beforeAll(async () => {
  // Configurar servidor de MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Conectar a la base de datos
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
});

// Limpiar datos después de cada prueba
global.afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
    } catch (error) {
      console.error(`Error al limpiar la colección ${key}:`, error);
    }
  }
});

// Desconectar después de todas las pruebas
global.afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Funciones de ayuda para pruebas
const testHelpers = {
  // Limpiar la base de datos
  clearDatabase: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        await collections[key].deleteMany({});
      } catch (error) {
        console.error(`Error al limpiar la colección ${key}:`, error);
      }
    }
  },
  
  // Crear un usuario de prueba
  createTestUser: async (userData = {}) => {
    const User = require('../model/usuario.model');
    const defaultUser = {
      nombre: 'Usuario de Prueba',
      email: 'test@example.com',
      password: 'Clave123!',
      rol: 'usuario',
      ...userData
    };
    
    if (defaultUser.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      defaultUser.password = await bcrypt.hash(defaultUser.password, salt);
    }
    
    return await User.create(defaultUser);
  },
  
  // Obtener token de autenticación
  getAuthToken: async (user) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: user._id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
  }
};

module.exports = testHelpers;
