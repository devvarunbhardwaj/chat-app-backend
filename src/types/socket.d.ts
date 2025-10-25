import { Socket } from "socket.io";

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}
