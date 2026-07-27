import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const CACHE_VERSION = "v1";
export const STORAGE_KEY = "EL_BANNAWY_QUERY_CACHE";

const PERSIST_ALLOW_LIST = new Set([
  "curriculum",
  "curriculum-stages",
  "stages",
  "admin-academic-years",
  "platform-active-context",
  "lesson-summary",
  "lesson-vocabulary",
]);

export function shouldPersist(queryKey: unknown): boolean {
  const key = queryKey as string[];
  if (key.length === 0) return false;
  const first = key[0] as string;
  return PERSIST_ALLOW_LIST.has(first);
}

export function createPersister() {
  if (typeof window === "undefined") return null;
  return createSyncStoragePersister({
    storage: window.localStorage,
    key: STORAGE_KEY,
  });
}

export function clearPersistedCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
