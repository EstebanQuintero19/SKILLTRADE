const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
        
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('exchanges');
        
        console.log('\n📋 Índices existentes:');
        const indexes = await collection.indexes();
        indexes.forEach((index, i) => {
            console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
        });
        
        // Eliminar índices problemáticos
        const indicesToDelete = [
            'emisor_1_receptor_1_cursoEmisor_1_cursoReceptor_1_estado_1',
            'unique_pending_exchange'
        ];
        
        for (const indexName of indicesToDelete) {
            try {
                await collection.dropIndex(indexName);
                console.log(`✅ Índice '${indexName}' eliminado`);
            } catch (error) {
                if (error.code === 27) {
                    console.log(`ℹ️ Índice '${indexName}' no existe`);
                } else {
                    console.log(`❌ Error eliminando '${indexName}':`, error.message);
                }
            }
        }
        
        // Recrear índices necesarios
        console.log('\n🔧 Creando nuevos índices...');
        
        // Índices básicos de optimización
        await collection.createIndex({ emisor: 1, estado: 1 });
        console.log('✅ Índice emisor + estado creado');
        
        await collection.createIndex({ receptor: 1, estado: 1 });
        console.log('✅ Índice receptor + estado creado');
        
        await collection.createIndex({ cursoEmisor: 1, estado: 1 });
        console.log('✅ Índice cursoEmisor + estado creado');
        
        await collection.createIndex({ cursoReceptor: 1, estado: 1 });
        console.log('✅ Índice cursoReceptor + estado creado');
        
        // Índice único solo para intercambios pendientes exactamente duplicados
        await collection.createIndex(
            { emisor: 1, receptor: 1, cursoEmisor: 1, cursoReceptor: 1 },
            { 
                unique: true, 
                partialFilterExpression: { estado: 'pendiente' },
                name: 'unique_pending_exchange_v2'
            }
        );
        console.log('✅ Índice único para pendientes creado');
        
        console.log('\n📋 Índices finales:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach((index, i) => {
            console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
        });
        
        console.log('\n🎉 ¡Índices actualizados correctamente!');
        console.log('✅ Ahora los cursos pueden estar en múltiples intercambios simultáneamente');
        console.log('✅ Solo se previenen solicitudes pendientes exactamente duplicadas');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
        process.exit(0);
    }
};

connectDB();
