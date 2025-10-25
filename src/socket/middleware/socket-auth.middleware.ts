import { Socket } from "socket.io";
// import { ExtendedError } from "socket.io/dist/namespace";
import jwt from "jsonwebtoken";
import { config } from "@/config/env";
import { logger } from "@/config/logger";
import type { JwtPayload, AuthenticatedSocket } from "@/types/socket";

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
      socket.handshake.query?.token;

    if (!token) {
      logger.warn(`Socket connection rejected: No token provided`, {
        socketId: socket.id,
        ip: socket.handshake.address
      });
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    if (!decoded.id || !decoded.email || !decoded.role) {
      logger.warn(`Socket connection rejected: Invalid token payload`, {
        socketId: socket.id,
        payload: decoded
      });
      return next(new Error("Authentication error: Invalid token payload"));
    }

    (socket as AuthenticatedSocket).user = decoded;

    logger.info(`Socket authenticated successfully`, {
      socketId: socket.id,
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`Socket connection rejected: Invalid token`, {
        socketId: socket.id,
        error: error.message
      });
      return next(new Error("Authentication error: Invalid token"));
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn(`Socket connection rejected: Token expired`, {
        socketId: socket.id,
        expiredAt: error.expiredAt
      });
      return next(new Error("Authentication error: Token expired"));
    }

    logger.error(`Socket authentication error`, {
      socketId: socket.id,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return next(new Error("Authentication error: Internal server error"));
  }
};
