import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/auth-roles";

/* Client tomonda auth: login/register formalar, chiqish tugmasi.
   baseURL berilmaydi — joriy origin ishlatiladi.
   adminClient — typed `authClient.admin.*` + sessiyada
   `impersonatedBy`/`user.role` tiplari uchun. */

export const authClient = createAuthClient({
  plugins: [adminClient({ ac, roles })],
});
