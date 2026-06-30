/** Validación y formato de RUT chileno (misma lógica que edificio-alcazar). */

export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') {
    return false;
  }

  const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();
  if (cleanRut.length < 2) {
    return false;
  }

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

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
  const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();
  if (cleanRut.length < 2) {
    return rut;
  }

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
}
