import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test database connection on startup (non-blocking)
prisma.$connect().catch((err) => {
  console.warn('⚠️  Database connection warning:', err.message);
  console.warn('⚠️  Server will start but database operations may fail.');
  console.warn('⚠️  Make sure DATABASE_URL is set correctly in .env file');
});

export default prisma;
