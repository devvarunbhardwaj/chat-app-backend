import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
// import { config } from "@/config/env";
import { logger } from "@/config/logger";
import { socketAuthMiddleware } from "./middleware/socket-auth.middleware";
import type { AuthenticatedSocket } from "@/types/socket";

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],

    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    allowUpgrades: true
  });

  io.use(socketAuthMiddleware);

  io.engine.on("connection_error", (err) => logger.error("Connection error:", err));

  io.on("connection", (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(authSocket.user?.email);

  });

  logger.info("✅ Socket.IO server ready");
  return io;
}

