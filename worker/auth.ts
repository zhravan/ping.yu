import { betterAuth } from "better-auth";
import type { Env } from "./types";

export function createAuth(env: Env) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
  });
}

export async function getSession(
  request: Request,
  env: Env,
) {
  const auth = createAuth(env);

  return auth.api.getSession({
    headers: request.headers,
  });
}
