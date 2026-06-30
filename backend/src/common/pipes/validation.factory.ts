import { BadRequestException, ValidationError } from '@nestjs/common';

function mensajesValidacion(errors: ValidationError[]): string[] {
  const mensajes: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      mensajes.push(...Object.values(error.constraints));
    }

    if (error.children?.length) {
      mensajes.push(...mensajesValidacion(error.children));
    }
  }

  return mensajes;
}

export function factoryValidacion(errors: ValidationError[]): BadRequestException {
  const mensaje = mensajesValidacion(errors);

  return new BadRequestException({
    statusCode: 400,
    mensaje: mensaje.length > 0 ? mensaje : 'Datos de entrada inválidos',
  });
}
