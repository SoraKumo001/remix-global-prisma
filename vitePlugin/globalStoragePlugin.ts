import { Plugin } from "vite";
import { AsyncLocalStorage } from "node:async_hooks";

export const globalStoragePlugin = (): Plugin => {
  const storage = new AsyncLocalStorage();
  return {
    name: "global-storage",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((_req, _res, next) => {
        (
          globalThis as typeof globalThis & { __storage: typeof storage }
        ).__storage = storage;
        return storage.run({}, () => {
          next();
        });
      });
    },
  };
};
