import app from '@/app';
import { config } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/config/logger';

let server: any;

const startServer = async () => {
  try {
    await connectDatabase();

    server = app.listen(config.port, () => {
      logger.info(`
        Server started successfully!
        Environment: ${config.env}
        URL: http://localhost:${config.port}
        Health check: http://localhost:${config.port}/health
      `);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      if (server) {
        server.close(async () => {
          logger.info('HTTP server closed');
          await disconnectDatabase();
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      throw reason;
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

