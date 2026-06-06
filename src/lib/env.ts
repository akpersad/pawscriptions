/** Read a required env var, throwing a clear error if missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** The IANA timezone all dose times are interpreted in. */
export function appTimezone(): string {
  return process.env.APP_TIMEZONE || "America/Toronto";
}
