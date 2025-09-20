// Prueba de verificación de Mocha
console.log('Iniciando prueba de Mocha...');

// Verificar que Mocha está disponible
if (typeof describe === 'function' && typeof it === 'function') {
  console.log('Mocha está funcionando correctamente!');
  console.log('Versión de Node.js:', process.version);
  console.log('Versión de Mocha:', require('mocha/package.json').version);
  
  // Ejecutar una prueba simple
  describe('Prueba de verificación', function() {
    it('debería pasar esta prueba', function() {
      if (1 + 1 === 2) {
        console.log('✓ La prueba pasó correctamente');
      } else {
        throw new Error('La prueba falló');
      }
    });
  });
} else {
  console.error('ERROR: Mocha no se está cargando correctamente');
  console.error('describe está definido:', typeof describe);
  console.error('it está definido:', typeof it);
  process.exit(1);
}
