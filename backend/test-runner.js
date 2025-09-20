const { validarContrasena } = require('./utils/validadores');

// Funciones de prueba
const tests = [
  {
    name: 'Contraseña válida',
    password: 'Contraseña123!',
    expected: { valida: true }
  },
  {
    name: 'Contraseña muy corta',
    password: 'Corta1!',
    expected: { 
      valida: false,
      message: 'al menos 8 caracteres'
    }
  },
  {
    name: 'Falta mayúscula',
    password: 'contraseña123!',
    expected: {
      valida: false,
      message: 'mayúscula'
    }
  },
  {
    name: 'Falta minúscula',
    password: 'CONTRASEÑA123!',
    expected: {
      valida: false,
      message: 'minúscula'
    }
  },
  {
    name: 'Falta número',
    password: 'Contraseña!',
    expected: {
      valida: false,
      message: 'número'
    }
  },
  {
    name: 'Falta carácter especial',
    password: 'Contraseña123',
    expected: {
      valida: false,
      message: 'carácter especial'
    }
  }
];

// Ejecutar pruebas
console.log('=== Iniciando pruebas de validación de contraseñas ===\n');

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`Prueba ${index + 1}: ${test.name}`);
  console.log(`Contraseña: "${test.password}"`);
  
  try {
    const result = validarContrasena(test.password);
    
    if (test.expected.valida === result.valida && 
        (!test.expected.message || result.mensaje.includes(test.expected.message))) {
      console.log('✅ Éxito');
      passed++;
    } else {
      console.log('❌ Falló');
      console.log(`  Esperado: ${JSON.stringify(test.expected)}`);
      console.log(`  Obtenido: ${JSON.stringify(result)}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ Error en la prueba');
    console.log(`  Error: ${error.message}`);
    failed++;
  }
  
  console.log('');
});

// Mostrar resumen
console.log('=== Resumen ===');
console.log(`Pruebas pasadas: ${passed}`);
console.log(`Pruebas fallidas: ${failed}`);
console.log(`Total: ${tests.length}`);

process.exit(failed > 0 ? 1 : 0);
