import { assertValidUpload } from './upload-validation.util';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

describe('upload-validation.util', () => {
  describe('assertValidUpload', () => {
    it('acepta PDF válido', () => {
      expect(() =>
        assertValidUpload({
          originalName: 'contrato.pdf',
          mimeType: 'application/pdf',
          size: 1024,
        }),
      ).not.toThrow();
    });

    it('acepta imagen por prefijo MIME', () => {
      expect(() =>
        assertValidUpload({
          originalName: 'foto.png',
          mimeType: 'image/png',
          size: 2048,
        }),
      ).not.toThrow();
    });

    it('rechaza archivo vacío', () => {
      expect(() =>
        assertValidUpload({
          originalName: 'vacio.pdf',
          mimeType: 'application/pdf',
          size: 0,
        }),
      ).toThrow('ARCHIVO_VACIO');
    });

    it('rechaza archivo demasiado grande', () => {
      expect(() =>
        assertValidUpload({
          originalName: 'grande.pdf',
          mimeType: 'application/pdf',
          size: MAX_UPLOAD_BYTES + 1,
        }),
      ).toThrow('ARCHIVO_DEMASIADO_GRANDE');
    });

    it('rechaza extensión bloqueada', () => {
      expect(() =>
        assertValidUpload({
          originalName: 'malware.exe',
          mimeType: 'application/octet-stream',
          size: 100,
        }),
      ).toThrow('TIPO_ARCHIVO_NO_PERMITIDO');
    });

    it('rechaza MIME no permitido', () => {
      expect(() =>
        assertValidUpload({
          originalName: 'script.wasm',
          mimeType: 'application/wasm',
          size: 100,
        }),
      ).toThrow('TIPO_ARCHIVO_NO_PERMITIDO');
    });
  });
});
