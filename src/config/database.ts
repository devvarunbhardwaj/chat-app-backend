import { PrismaClient } from '../../generated/prisma';
import { logger } from './logger';
import { config } from './env';

const prismaClientSingleton = () => {
  return new PrismaClient({ log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'] });

};
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (config.isDevelopment) globalThis.prisma = prisma;

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

