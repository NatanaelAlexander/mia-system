import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  statusCode: number;
  mensaje: string | string[];
}

export class AppException extends HttpException {
  constructor(mensaje: string, status: HttpStatus) {
    super({ statusCode: status, mensaje }, status);
  }
}
