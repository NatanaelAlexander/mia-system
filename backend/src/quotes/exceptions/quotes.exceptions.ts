import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class CotizacionNoEncontradaException extends AppException {
  constructor() {
    super('Cotización no encontrada', HttpStatus.NOT_FOUND);
  }
}

export class EmisorNoEncontradoException extends AppException {
  constructor() {
    super('Emisor de cotización no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class RepresentanteNoVinculadoException extends AppException {
  constructor() {
    super(
      'El representante legal no está vinculado a esta empresa',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AlcanceCotizacionInvalidoException extends AppException {
  constructor(message = 'El alcance de la cotización no es válido') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class CotizacionNoVisibleClienteException extends AppException {
  constructor() {
    super(
      'La cotización no es visible para el cliente; no se puede generar enlace público',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class EnlaceCotizacionInvalidoException extends AppException {
  constructor(
    message = 'El enlace de la cotización no es válido o ha expirado',
  ) {
    super(message, HttpStatus.GONE);
  }
}

export class SeccionCotizacionVaciaException extends AppException {
  constructor() {
    super(
      'La cotización debe tener al menos un ítem en alguna sección de pagos',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class DocumentoFirmadoYaExisteException extends AppException {
  constructor() {
    super(
      'La cotización ya tiene un documento firmado. Elimínalo antes de subir otro.',
      HttpStatus.CONFLICT,
    );
  }
}

export class DocumentoFirmadoNoEncontradoException extends AppException {
  constructor() {
    super('La cotización no tiene documento firmado', HttpStatus.NOT_FOUND);
  }
}

export class EstadoCotizacionInvalidoException extends AppException {
  constructor(code?: string) {
    super(
      code
        ? `Estado de cotización no válido: ${code}`
        : 'Estado de cotización no válido',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PresetCotizacionNoEncontradoException extends AppException {
  constructor() {
    super('Preset de cotización no encontrado', HttpStatus.NOT_FOUND);
  }
}
