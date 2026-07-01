/** Validación y formato de RUT chileno (misma lógica que edificio-alcazar). */

/** Formato canónico de almacenamiento y API: `12.345.678-5` */
export const CANONICAL_RUT_PATTERN = /^\d{1,2}(?:\.\d{3}){2}-[\dkK]$/;

export function cleanRut(rut: string): string {
  return rut.replace(/[.-]/g, '').toUpperCase();
}

export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') {
    return false;
  }

  const clean = cleanRut(rut);
  if (clean.length < 2) {
    return false;
  }

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  if (!/^\d+$/.test(body)) {
    return false;
  }

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number.parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const calculatedDv = 11 - (sum % 11);
  let expectedDv: string;

  if (calculatedDv === 11) {
    expectedDv = '0';
  } else if (calculatedDv === 10) {
    expectedDv = 'K';
  } else {
    expectedDv = String(calculatedDv);
  }

  return dv === expectedDv;
}

export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length < 2) {
    return rut;
  }

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
}

export function isCanonicalRutFormat(rut: string): boolean {
  return CANONICAL_RUT_PATTERN.test(rut) && rut === formatRut(rut);
}

/** Valida el RUT y devuelve el formato canónico para guardar o responder. */
export function normalizeRutForStorage(rut: string): string {
  if (!validateRut(rut)) {
    throw new Error('INVALID_RUT');
  }

  return formatRut(rut);
}
