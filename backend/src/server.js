/**
 * YOHANNES FANTAYE METASEBIYA GENERAL HOSPITAL PLC
 * Hospital Management System — Main Server Entry Point
 */

require('dotenv').config();

const app = require('./app');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 5000;
const APP_NAME = process.env.APP_NAME || 'YFM General Hospital PLC';

// Graceful shutdown handler
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    logger.info('Database connection established.');

    const server = app.listen(PORT, () => {
      logger.info(`${APP_NAME} API running on port ${PORT} [${process.env.NODE_ENV}]`);
    });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
