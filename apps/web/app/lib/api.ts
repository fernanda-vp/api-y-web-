import "server-only";
import { createApiClient } from "@intranet/api-client";
import { getSessionToken } from "./session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function getApiClient() {
  return createApiClient({
    baseURL: API_URL,
    getToken: async () => (await getSessionToken()) ?? null,
  });
}

export function getAnonymousApiClient() {
  return createApiClient({ baseURL: API_URL });
}
