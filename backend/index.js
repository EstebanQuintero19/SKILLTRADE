require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const routes = require('./routes');
const mongoose = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connection.on('connected', () => {
    console.log('Conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Error de conexión a MongoDB:', err);
});

// API routes
app.use('/api', routes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'SKILLTRADE API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Error interno del servidor',
        error: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Ruta no encontrada' 
    });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API REST corriendo en el puerto: ${PORT}`);
    console.log(`Endpoint base: http://localhost:${PORT}/api`);
});


