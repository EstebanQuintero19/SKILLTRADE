const logger = require('fs');

exports.generateLog = (filename, logData) => {
 logger.appendFile(filename, logData, (err) => {
    if (err) throw err;
    console.log('Log generado exitosamente');
    }
 );   
};