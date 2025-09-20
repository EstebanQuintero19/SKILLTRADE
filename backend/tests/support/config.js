// Configuración para pruebas con Cucumber
module.exports = {
  // Configuración de base de datos para pruebas
  testDatabase: {
    uri: 'mongodb://localhost:27017/skilltrade_test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // Configuración de la aplicación para pruebas
  testApp: {
    port: 3001,
    env: 'test'
  },

  // Timeouts para las pruebas
  timeouts: {
    step: 30000,    // 30 segundos por paso
    scenario: 60000, // 1 minuto por escenario
    feature: 300000  // 5 minutos por feature
  },

  // Configuración de reportes
  reports: {
    json: 'reports/cucumber_report.json',
    html: 'reports/cucumber_report.html',
    junit: 'reports/cucumber_report.xml'
  }
};
