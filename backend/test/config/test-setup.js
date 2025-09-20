// Configuración para pruebas de integración
process.env.NODE_ENV = 'test';

// Configuración de la base de datos de prueba
process.env.MONGODB_URI = 'mongodb://localhost:27017/skilltrade-test';

// Configuración de autenticación para pruebas
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '1h';

// Configuración de correo para pruebas
process.env.EMAIL_SERVICE = 'gmail';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test-password';

// Deshabilitar logs en pruebas
process.env.DISABLE_LOGS = 'true';
