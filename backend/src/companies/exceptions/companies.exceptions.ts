import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class EmpresaNoEncontradaException extends AppException {
  constructor() {
    super('Empresa no encontrada', HttpStatus.NOT_FOUND);
  }
}

export class RepresentanteLegalNoEncontradoException extends AppException {
  constructor() {
    super('Representante legal no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class VinculoEmpresaRepresentanteNoEncontradoException extends AppException {
  constructor() {
    super('Vínculo empresa-representante no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class RutEmpresaDuplicadoException extends AppException {
  constructor() {
    super('Ya existe una empresa con ese RUT', HttpStatus.CONFLICT);
  }
}

export class RepresentanteYaVinculadoException extends AppException {
  constructor() {
    super(
      'El representante ya está vinculado a esta empresa',
      HttpStatus.CONFLICT,
    );
  }
}
