// Configuración básica para pruebas
process.env.NODE_ENV = 'test';

// Configuración de la base de datos
process.env.MONGODB_URI = 'mongodb://localhost:27017/skilltrade-test';

// Configuración de autenticación
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1h';

// Deshabilitar logs en pruebas
process.env.DISABLE_LOGS = 'true';

// Configuración global de Chai
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
chai.should();

global.expect = chai.expect;
