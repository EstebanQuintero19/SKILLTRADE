 /* eslint-disable no-unused-vars */
 const {exec} = require('child_process');
 require('dotenv').config(); 
 
 exports.backupDatabase = async () => {
     const dbName = 'skilltrade';
     const outputPath = './backup';
 
     const command = `mongodump --uri "${process.env.MONGO_URI}" --out ${outputPath} --gzip`;
 
     await exec(command, (error, stdout, stderr) => {
         if (error) {
             console.error(`Error en el respaldo: ${error.message}`);
             return;
         }
         console.log(`Respaldo completado con éxito ${stdout}`);
     });
 };