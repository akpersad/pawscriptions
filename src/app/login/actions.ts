"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!process.env.APP_PASSWORD) {
    return { error: "Server is missing APP_PASSWORD." };
  }
  if (password !== process.env.APP_PASSWORD) {
    return { error: "Wrong passphrase." };
  }

  const token = await createSessionToken();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);

  redirect(next.startsWith("/") ? next : "/");
}
