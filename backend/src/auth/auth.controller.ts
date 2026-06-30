import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { ErrorResponseDto } from '../common/exceptions/app.exception';
import { AuthenticatedOnly } from './decorators/authorize.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AuthOkResponseDto,
  AuthTokensResponseDto,
} from './dto/responses/auth-response.dto';
import { SessionClientContext } from './types/refresh-session.types';

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Credenciales por body (nunca por URL). Rate limit: 5 intentos por minuto por IP. ' +
      'Emite access + refresh; el refresh queda registrado en servidor para revocación.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({ type: ErrorResponseDto })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(
      dto.email,
      dto.password,
      this.clientContext(request),
    );
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Renovar tokens',
    description:
      'Intercambia un refresh token válido por un par nuevo (rotación). ' +
      'El refresh anterior queda revocado en servidor.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(
      dto.refreshToken,
      this.clientContext(request),
    );
  }

  @Public()
  @Post('logout')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Revoca el refresh token en servidor. Idempotente: responde ok aunque el token ya esté inválido. ' +
      'El cliente debe borrar access y refresh localmente.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ type: AuthOkResponseDto })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @AuthenticatedOnly()
  @Post('logout-all')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cerrar sesión en todos los dispositivos',
    description:
      'Revoca todas las sesiones refresh del usuario autenticado. ' +
      'Requiere access token válido.',
  })
  @ApiOkResponse({ type: AuthOkResponseDto })
  logoutAll(@CurrentUser('sub') userId: string) {
    return this.authService.logoutAll(userId);
  }

  private clientContext(request: Request): SessionClientContext {
    return {
      userAgent: request.headers['user-agent'] ?? null,
      ipAddress: request.ip ?? null,
    };
  }
}
