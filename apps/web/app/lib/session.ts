import "server-only";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";
const FALLBACK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getTokenExpiry(token: string): Date {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      exp?: number;
    };
    if (decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
  } catch {
    // fall through to default below
  }
  return new Date(Date.now() + FALLBACK_MAX_AGE_MS);
}

export async function createSession(accessToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: getTokenExpiry(accessToken),
  });
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
