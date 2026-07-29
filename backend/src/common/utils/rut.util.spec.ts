import {
  cleanRut,
  formatRut,
  isCanonicalRutFormat,
  normalizeRutForStorage,
  validateRut,
} from './rut.util';

describe('rut.util', () => {
  describe('cleanRut', () => {
    it('elimina puntos y guión y pasa a mayúsculas', () => {
      expect(cleanRut('12.345.678-k')).toBe('12345678K');
    });

    it('deja intacto un RUT ya limpio', () => {
      expect(cleanRut('12345678K')).toBe('12345678K');
    });
  });

  describe('validateRut', () => {
    it('acepta RUT válido con formato canónico', () => {
      expect(validateRut('12.345.678-5')).toBe(true);
    });

    it('acepta RUT válido sin formato', () => {
      expect(validateRut('123456785')).toBe(true);
    });

    it('acepta RUT con dígito verificador K', () => {
      expect(validateRut('1.000.005-K')).toBe(true);
    });

    it('rechaza RUT con DV incorrecto', () => {
      expect(validateRut('12.345.678-0')).toBe(false);
    });

    it('rechaza string vacío o no string', () => {
      expect(validateRut('')).toBe(false);
      expect(validateRut(null as unknown as string)).toBe(false);
    });

    it('rechaza body no numérico', () => {
      expect(validateRut('12.345.67A-5')).toBe(false);
    });
  });

  describe('formatRut', () => {
    it('formatea a canónico con puntos y guión', () => {
      expect(formatRut('123456785')).toBe('12.345.678-5');
    });

    it('devuelve el input si es demasiado corto', () => {
      expect(formatRut('1')).toBe('1');
    });
  });

  describe('isCanonicalRutFormat', () => {
    it('acepta formato canónico válido', () => {
      expect(isCanonicalRutFormat('12.345.678-5')).toBe(true);
    });

    it('rechaza RUT válido pero sin formato canónico', () => {
      expect(isCanonicalRutFormat('123456785')).toBe(false);
    });
  });

  describe('normalizeRutForStorage', () => {
    it('devuelve formato canónico para RUT válido', () => {
      expect(normalizeRutForStorage('123456785')).toBe('12.345.678-5');
    });

    it('lanza INVALID_RUT si el RUT es inválido', () => {
      expect(() => normalizeRutForStorage('12.345.678-0')).toThrow('INVALID_RUT');
    });
  });
});
