import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';

export class CredencialesInvalidasException extends AppException {
  constructor() {
    super('Correo o contraseña incorrectos', HttpStatus.UNAUTHORIZED);
  }
}

export class RefreshTokenInvalidoException extends AppException {
  constructor() {
    super('Sesión inválida o expirada', HttpStatus.UNAUTHORIZED);
  }
}

export class TokenAccesoInvalidoException extends AppException {
  constructor() {
    super('Token de acceso inválido o expirado', HttpStatus.UNAUTHORIZED);
  }
}

export class AccesoSuperficieDenegadoException extends AppException {
  constructor() {
    super('No tienes acceso a esta sección', HttpStatus.FORBIDDEN);
  }
}

export class PermisoDenegadoException extends AppException {
  constructor() {
    super('No tienes permiso para realizar esta acción', HttpStatus.FORBIDDEN);
  }
}

export class PermisosDesactualizadosException extends AppException {
  constructor() {
    super(
      'Tus permisos cambiaron. Renueva la sesión con POST /api/auth/refresh',
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class UsuarioSinPermisosException extends AppException {
  constructor() {
    super(
      'Tu usuario no tiene permisos asignados. Contacta al administrador.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class RutaSinAutorizacionException extends AppException {
  constructor() {
    super(
      'Ruta API sin configuración de autorización. Contacta al administrador.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class RutaSinPermisoConfiguradoException extends AppException {
  constructor() {
    super(
      'Esta ruta no tiene permisos configurados. Contacta al administrador.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AuthNoConfiguradoException extends AppException {
  constructor() {
    super(
      'Autenticación no configurada en el servidor',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
