import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pawscriptions_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year — it's a private household app

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("Missing required environment variable: SESSION_SECRET");
  return new TextEncoder().encode(s);
}

/** Create a signed session token after a successful passphrase check. */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ ok: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

/** Verify a session token. Edge-runtime safe (used in middleware). */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
