import { AsyncLocalStorage } from "node:async_hooks";
export const getGlobalStore = <T extends Record<string, unknown>>() => {
  const store = (
    globalThis as typeof globalThis & {
      __storage: AsyncLocalStorage<Record<string, unknown>>;
    }
  ).__storage.getStore();
  if (!store) {
    throw new Error("Global store is not initialized");
  }
  return store as T;
};
export const createGlobalStorage = () => {
  const global = globalThis as typeof globalThis & {
    __storage: AsyncLocalStorage<Record<string, unknown>>;
  };
  if (!global.__storage) {
    global.__storage = new AsyncLocalStorage<Record<string, unknown>>();
  }
  return global.__storage;
};
