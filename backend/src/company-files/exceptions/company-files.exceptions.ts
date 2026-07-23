import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class CarpetaNoEncontradaException extends AppException {
  constructor() {
    super('Carpeta no encontrada', HttpStatus.NOT_FOUND);
  }
}

export class CarpetaNombreDuplicadoException extends AppException {
  constructor() {
    super('Ya existe una carpeta con ese nombre en esta ubicación', HttpStatus.CONFLICT);
  }
}

export class NombreCarpetaInvalidoException extends AppException {
  constructor() {
    super('El nombre de la carpeta no es válido', HttpStatus.BAD_REQUEST);
  }
}

export class ArchivoEmpresaNoEncontradoException extends AppException {
  constructor() {
    super('Archivo no encontrado en el drive de la empresa', HttpStatus.NOT_FOUND);
  }
}

export class EmpresaDriveNoEncontradaException extends AppException {
  constructor() {
    super('Empresa no encontrada', HttpStatus.NOT_FOUND);
  }
}
