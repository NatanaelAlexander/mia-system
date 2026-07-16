import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class TicketNoEncontradoException extends AppException {
  constructor() {
    super('Ticket no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class EstadoTicketNoEncontradoException extends AppException {
  constructor() {
    super('Estado de ticket no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class PrioridadTicketNoEncontradaException extends AppException {
  constructor() {
    super('Prioridad de ticket no encontrada', HttpStatus.NOT_FOUND);
  }
}

export class CategoriaTicketNoEncontradaException extends AppException {
  constructor() {
    super('Categoría de ticket no encontrada', HttpStatus.NOT_FOUND);
  }
}

export class EstadoPagoNoEncontradoException extends AppException {
  constructor() {
    super('Estado de pago no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class AsignadoTicketInvalidoException extends AppException {
  constructor() {
    super(
      'Solo se pueden asignar admins o superadmins activos',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ComentarioTicketNoEncontradoException extends AppException {
  constructor() {
    super('Comentario de ticket no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class ArchivoYaVinculadoAlTicketException extends AppException {
  constructor() {
    super('El archivo ya está vinculado a este ticket', HttpStatus.CONFLICT);
  }
}

export class VinculoTicketArchivoNoEncontradoException extends AppException {
  constructor() {
    super('Vínculo ticket-archivo no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class VinculoComentarioArchivoNoEncontradoException extends AppException {
  constructor() {
    super('Vínculo comentario-archivo no encontrado', HttpStatus.NOT_FOUND);
  }
}
