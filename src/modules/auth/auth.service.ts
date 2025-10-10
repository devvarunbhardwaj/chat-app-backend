import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt"
import { prisma } from '@/config/database';
import { ApiError } from '@/utils/api-error';
import { config } from '@/config/env';
import { Role } from '../../../generated/prisma';


export class AuthService {
  async register(email: string, password: string, name: string, phoneNumber: string) {
    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email: email }, { phoneNumber: phoneNumber }] } });
    if (existingUser) throw ApiError.conflict('Email or phone Number already registered');

    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

    const user = await prisma.user.create({
      data: {
        password: hashedPassword,
        email,
        phoneNumber,
        role: config.admins.includes(email) ? Role.ADMIN : Role.USER,
        name,
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw ApiError.unauthorized('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }
  private generateToken(id: string, email: string, role: string) {
    const options: SignOptions = {
      expiresIn: "15d",
    };
    return jwt.sign({ id, email, role }, config.jwt.secret as string, options);
  }

}
export const authService = new AuthService();
