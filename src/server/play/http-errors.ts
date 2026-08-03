import "server-only";
import { ForbiddenError, UnauthorizedError } from "@/server/session";

/* DAL xatolarini HTTP holatiga oʻgirish — ikkala play endpoint uchun
   bitta joyda. Nomaʼlum xato HECH QACHON mijozga batafsil chiqmaydi:
   ichki xabar 500 ostida umumlashtiriladi. */

export function errorStatus(err: unknown): number {
  if (err instanceof UnauthorizedError) return 401;
  if (err instanceof ForbiddenError) return 403;
  return 500;
}

export function errorBody(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return { ok: false, error: "unauthorized", message: err.message };
  }
  if (err instanceof ForbiddenError) {
    return { ok: false, error: "forbidden", message: err.message };
  }
  return { ok: false, error: "server_error", message: "Xatolik yuz berdi" };
}
