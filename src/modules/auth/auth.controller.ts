import type { Request, Response } from 'express';
import { authService } from './auth.service';
import { catchAsync } from '../../utils/catch-async';
import { ApiResponse } from '../../utils/api-response';

export class AuthController {
  register = catchAsync(async (req: Request, res: Response) => {
    const { email, password, name, phoneNumber } = req.body;
    const result = await authService.register(email, password, name, phoneNumber);

    const response = ApiResponse.created(result, 'User registered successfully');
    res.status(response.statusCode).json(response);
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    const response = ApiResponse.success(result, 'Login successful');
    res.status(response.statusCode).json(response);
  });

  me = catchAsync(async (req: Request, res: Response) => {
    const response = ApiResponse.success(req.user, 'User profile retrieved');
    res.status(response.statusCode).json(response);
  });
}

export const authController = new AuthController();
