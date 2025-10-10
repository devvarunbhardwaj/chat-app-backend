export class ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: any;

  constructor(statusCode: number, message: string, data?: T, meta?: any) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data) this.data = data;
    this.meta = meta;
  }

  static success<T>(data: T, message: string = 'Success', meta?: any) {
    return new ApiResponse(200, message, data, meta);
  }

  static created<T>(data: T, message: string = 'Created successfully') {
    return new ApiResponse(201, message, data);
  }

  static noContent(message: string = 'No content') {
    return new ApiResponse(204, message);
  }
}

