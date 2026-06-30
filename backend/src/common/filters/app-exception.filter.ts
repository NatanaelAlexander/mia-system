import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';
import { ErrorResponse } from '../exceptions/app.exception';

function extraerMensaje(body: string | object): string | string[] {
  if (typeof body === 'string') {
    return body;
  }

  if ('mensaje' in body && body.mensaje) {
    return body.mensaje as string | string[];
  }

  if ('message' in body && body.message) {
    return body.message as string | string[];
  }

  return 'Ocurrió un error';
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ThrottlerException) {
      response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        mensaje: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
      } satisfies ErrorResponse);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const payload: ErrorResponse = {
        statusCode: status,
        mensaje: extraerMensaje(body),
      };

      response.status(status).json(payload);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje: 'Error interno del servidor',
    } satisfies ErrorResponse);
  }
}
