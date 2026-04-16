require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./logger');
const eventRoutes = require('./routes/events');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/bitacora';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.info('Health check realizado');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  logger.warn(`Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.message}`);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('Conexión a MongoDB establecida');
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Servidor iniciado en puerto ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`Fallo en conexión a base de datos: ${err.message}`);
    process.exit(1);
  });

module.exports = app;
