import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class UsuarioNoEncontradoException extends AppException {
  constructor() {
    super('Usuario no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class EmailUsuarioDuplicadoException extends AppException {
  constructor() {
    super('Ya existe un usuario con ese correo', HttpStatus.CONFLICT);
  }
}

export class RolNoEncontradoException extends AppException {
  constructor() {
    super('Rol no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class CargoNoEncontradoException extends AppException {
  constructor() {
    super('Cargo no encontrado', HttpStatus.NOT_FOUND);
  }
}

export class VinculoUsuarioEmpresaNoEncontradoException extends AppException {
  constructor() {
    super('El usuario no está vinculado a esa empresa', HttpStatus.NOT_FOUND);
  }
}

export class ContrasenaActualIncorrectaException extends AppException {
  constructor() {
    super('La contraseña actual no es correcta', HttpStatus.UNAUTHORIZED);
  }
}

export class NoPuedesDesactivarTuCuentaException extends AppException {
  constructor() {
    super('No puedes desactivar tu propia cuenta', HttpStatus.BAD_REQUEST);
  }
}

export class SoloPuedesModificarTuPerfilException extends AppException {
  constructor() {
    super(
      'Solo puedes modificar los datos de tu propio usuario',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class SoloClientesPuedenVincularseEmpresaException extends AppException {
  constructor() {
    super(
      'Solo los usuarios con rol cliente pueden vincularse a una empresa',
      HttpStatus.BAD_REQUEST,
    );
  }
}
