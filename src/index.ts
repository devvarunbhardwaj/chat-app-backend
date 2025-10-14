import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';
import { initializeSocketServer } from './socket/socket.server';

let server: any;
let io: any;

const startServer = async () => {
  try {
    await connectDatabase();

    // Create HTTP server from Express app
    const httpServer = createServer(app);

    //Attach Socket.IO to the HTTP server
    io = await initializeSocketServer(httpServer);
    logger.info('Socket.IO initialized');

    //Start the server
    server = httpServer.listen(config.port, () => {
      logger.info(`
        ✅ Server started successfully!
        Environment: ${config.env}
        HTTP: http://localhost:${config.port}
        WebSocket: ws://localhost:${config.port}
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down...`);

      if (io) {
        io.close(() => logger.info('Socket.IO closed'));
      }

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
      process.exit(1);
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
