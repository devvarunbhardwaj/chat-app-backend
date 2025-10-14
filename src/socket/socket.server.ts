import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "@/config/env";
import { logger } from "@/config/logger";

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: "ADMIN" | "USER";
    name: string;
  };
}


export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors.origin,
      // credentials: true,
    },
    // pingTimeout: 60000,
    // pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    logger.info(`🟢 User connected: (${socket.id})`);
  });

  logger.info("✅ Socket.IO server ready");
  return io;
}
