import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class ProyectoNoEncontradoException extends AppException {
  constructor() {
    super('Proyecto no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class ArchivoYaVinculadoAlProyectoException extends AppException {
  constructor() {
    super('El archivo ya está vinculado a este proyecto', HttpStatus.CONFLICT);
  }
}

export class VinculoProyectoArchivoNoEncontradoException extends AppException {
  constructor() {
    super('Vínculo proyecto-archivo no encontrado', HttpStatus.NOT_FOUND);
  }
}
