import "server-only";
import { cache } from "react";
import { getApiClient } from "./api";

export const getCurrentUser = cache(async () => {
  return getApiClient().auth.me();
});

export { hasPermission } from "./permission-labels";
