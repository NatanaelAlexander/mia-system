import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class AssetNoEncontradoException extends AppException {
  constructor() {
    super('Archivo no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class R2NoConfiguradoException extends AppException {
  constructor() {
    super(
      'Almacenamiento R2 no está configurado. Revisa las variables R2_* en .env',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class ArchivoRequeridoException extends AppException {
  constructor() {
    super('Debes enviar un archivo en el campo file', HttpStatus.BAD_REQUEST);
  }
}
