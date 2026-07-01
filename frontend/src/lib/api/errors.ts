export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function parseApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const mensaje = (body as { mensaje?: string | string[] }).mensaje;

  if (Array.isArray(mensaje)) {
    return mensaje.join(", ");
  }

  if (typeof mensaje === "string" && mensaje.trim()) {
    return mensaje;
  }

  return fallback;
}
