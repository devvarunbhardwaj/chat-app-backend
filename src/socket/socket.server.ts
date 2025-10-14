import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
// import { config } from "@/config/env";
import { logger } from "@/config/logger";
//
//
// export function initializeSocketServer(httpServer: HTTPServer) {
//   const io = new Server(httpServer, {
//     cors: {
//       origin: config.cors.origin,
//       methods: ["GET", "POST"]
//     },
//   });
//
//   io.on("connection", (socket: Socket) => {
//     logger.info(`🟢 User connected: (${socket.id})`);
//     socket.on('chat message', (msg) => {
//       logger.info('message: ' + msg);
//       io.emit('chat message', msg);
//     });
//
//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//     });
//   });
//
//   logger.info("✅ Socket.IO server ready");
//   return io;
// }


export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Temporarily use "*" for testing
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'] // Explicitly allow both
  });

  // Add connection error logging
  io.engine.on("connection_error", (err) => {
    logger.error("Connection error:", err);
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`🟢 User connected: ${socket.id}`);

    socket.on('chat message', (msg) => {
      logger.info('📨 Message received: ' + msg);
      io.emit('chat message', msg);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`🔴 User disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info("✅ Socket.IO server ready");
  return io;
}
