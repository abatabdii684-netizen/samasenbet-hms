/**
 * Database Configuration
 * Prisma Client Singleton
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e) => {
        logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
      });
    }

    prisma.$on('error', (e) => {
      logger.error('Prisma error:', e);
    });

    prisma.$on('warn', (e) => {
      logger.warn('Prisma warning:', e);
    });
  }
  return prisma;
};

const connectDB = async () => {
  const client = getPrismaClient();
  await client.$connect();
  return client;
};

const disconnectDB = async () => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

module.exports = {
  getPrismaClient,
  connectDB,
  disconnectDB,
  get prisma() {
    return getPrismaClient();
  },
};
