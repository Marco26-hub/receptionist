export class ValidationError extends Error {}

export function requiredText(value: unknown, label: string, maxLength = 200) {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${label} è obbligatorio`);
  return value.trim().slice(0, maxLength);
}

export function optionalText(value: unknown, maxLength = 500) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

export function validEmail(value: unknown) {
  const email = requiredText(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Email non valida");
  return email;
}

export async function readJson(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) throw new ValidationError("Formato richiesta non valido");
  return request.json() as Promise<Record<string, unknown>>;
}

export function jsonError(error: unknown) {
  const known = error instanceof ValidationError;
  return Response.json({ ok: false, error: known ? error.message : "Si è verificato un errore" }, { status: known ? 400 : 500 });
}

