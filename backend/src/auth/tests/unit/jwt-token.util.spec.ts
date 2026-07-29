import {
  accessTokenSignOptions,
  accessTokenVerifyOptions,
  assertAccessTokenPayload,
  assertRefreshTokenPayload,
  isUuidV4,
  JWT_ALGORITHM,
  parseBearerToken,
  refreshTokenSignOptions,
  refreshTokenVerifyOptions,
} from '../../jwt-token.util';
import {
  RefreshTokenInvalidoException,
  TokenAccesoInvalidoException,
} from '../../exceptions/auth.exceptions';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const SESSION_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('jwt-token.util', () => {
  describe('isUuidV4', () => {
    it('acepta UUID v4 válido', () => {
      expect(isUuidV4(USER_ID)).toBe(true);
    });

    it('rechaza valores no UUID v4', () => {
      expect(isUuidV4('not-a-uuid')).toBe(false);
      expect(isUuidV4(null)).toBe(false);
      expect(isUuidV4(123)).toBe(false);
    });
  });

  describe('sign/verify options', () => {
    it('configura access con HS256', () => {
      expect(accessTokenSignOptions('secret', '15m')).toEqual({
        secret: 'secret',
        expiresIn: '15m',
        algorithm: JWT_ALGORITHM,
      });
      expect(accessTokenVerifyOptions('secret')).toEqual({
        secret: 'secret',
        algorithms: [JWT_ALGORITHM],
      });
    });

    it('configura refresh con HS256', () => {
      expect(refreshTokenSignOptions('secret', '7d')).toEqual({
        secret: 'secret',
        expiresIn: '7d',
        algorithm: JWT_ALGORITHM,
      });
      expect(refreshTokenVerifyOptions('secret')).toEqual({
        secret: 'secret',
        algorithms: [JWT_ALGORITHM],
      });
    });
  });

  describe('parseBearerToken', () => {
    it('extrae el token del header Bearer', () => {
      expect(parseBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    });

    it('rechaza header ausente o mal formado', () => {
      expect(() => parseBearerToken(undefined)).toThrow(TokenAccesoInvalidoException);
      expect(() => parseBearerToken('Basic xyz')).toThrow(TokenAccesoInvalidoException);
      expect(() => parseBearerToken('Bearer ')).toThrow(TokenAccesoInvalidoException);
      expect(() => parseBearerToken('Bearer   ')).toThrow(TokenAccesoInvalidoException);
    });
  });

  describe('assertAccessTokenPayload', () => {
    it('acepta payload de access válido', () => {
      expect(() =>
        assertAccessTokenPayload({
          sub: USER_ID,
          type: 'access',
          permVersion: 1,
        }),
      ).not.toThrow();
    });

    it('rechaza payload inválido', () => {
      expect(() => assertAccessTokenPayload(null)).toThrow(TokenAccesoInvalidoException);
      expect(() =>
        assertAccessTokenPayload({ sub: USER_ID, type: 'refresh', permVersion: 1 }),
      ).toThrow(TokenAccesoInvalidoException);
      expect(() =>
        assertAccessTokenPayload({ sub: 'bad', type: 'access', permVersion: 1 }),
      ).toThrow(TokenAccesoInvalidoException);
      expect(() =>
        assertAccessTokenPayload({ sub: USER_ID, type: 'access', permVersion: '1' }),
      ).toThrow(TokenAccesoInvalidoException);
    });
  });

  describe('assertRefreshTokenPayload', () => {
    it('acepta payload de refresh válido', () => {
      expect(() =>
        assertRefreshTokenPayload({
          sub: USER_ID,
          sid: SESSION_ID,
          type: 'refresh',
        }),
      ).not.toThrow();
    });

    it('rechaza payload inválido', () => {
      expect(() => assertRefreshTokenPayload(null)).toThrow(RefreshTokenInvalidoException);
      expect(() =>
        assertRefreshTokenPayload({
          sub: USER_ID,
          sid: SESSION_ID,
          type: 'access',
        }),
      ).toThrow(RefreshTokenInvalidoException);
      expect(() =>
        assertRefreshTokenPayload({
          sub: USER_ID,
          sid: 'bad',
          type: 'refresh',
        }),
      ).toThrow(RefreshTokenInvalidoException);
    });
  });
});
