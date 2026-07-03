import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

/* Better Auth catch-all: /api/auth/* (sign-in, sign-up, session, ...) */

export const { GET, POST } = toNextJsHandler(auth.handler);
