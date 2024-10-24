# remix-global-prisma

Sample of Remix on Cloudflare Workers using Prisma without passing Context each time.

```ts
const prisma = getPrisma();
const users = await prisma.user.findMany();
```

- Repository  
  https://github.com/SoraKumo001/remix-global-prisma
- Run test  
  https://cloudflare-workers-remix.mofon001.workers.dev/

## Explanation

- app/libs/globalStorage.ts

AsyncLocalStorage allows per-session storage to be created

```ts
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
```

- function/server.ts

Call handler in storage

```ts
import { createRequestHandler, ServerBuild } from "@remix-run/cloudflare";
import * as build from "../build/server";
import { createGlobalStorage } from "~/libs/globalStorage";
import { getLoadContext } from "load-context";

const handler = createRequestHandler(build as unknown as ServerBuild);

const fetch = async (request: Request, env: Env, ctx: ExecutionContext) => {
  const storage = createGlobalStorage();
  return storage.run({}, () => {
    const context = getLoadContext({
      request,
      context: {
        cloudflare: {
          env,
          ctx: {
            waitUntil: ctx.waitUntil.bind(ctx) ?? (() => {}),
            passThroughOnException:
              ctx.passThroughOnException.bind(ctx) ?? (() => {}),
          },
          cf: request.cf as never,
          caches: caches as never,
        },
      },
    });
    return handler(request, context);
  });
};

export default {
  fetch,
};
```

- load-context.ts

Save env in handler

```ts
import { AppLoadContext } from "@remix-run/cloudflare";
import { type PlatformProxy } from "wrangler";
import { getGlobalStore } from "./app/libs/globalStorage";

type Cloudflare = Omit<PlatformProxy<Env>, "dispose">;

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

type GetLoadContext = (args: {
  request: Request;
  context: { cloudflare: Cloudflare };
}) => AppLoadContext;

export const getLoadContext: GetLoadContext = ({ context }) => {
  const store = getGlobalStore();
  store.env = context.cloudflare.env;
  return context;
};
```

- app/libs/prisma.ts

Store and return a PrismaClient instance to store.

```ts
import { PrismaClient } from "@prisma/client";
import { getGlobalStore } from "./globalStorage";
import { PrismaD1 } from "@prisma/adapter-d1";

export const getPrisma = () => {
  const store = getGlobalStore<{ prisma?: PrismaClient; env: Env }>();
  if (!store.prisma) {
    const adapter = new PrismaD1(store.env.DB);
    store.prisma = new PrismaClient({ adapter });
  }
  return store.prisma;
};
```

- app/routes/\_index.tsx

When using Prisma on Remix, you can call it without using a Context value

```tsx
import { useLoaderData } from "@remix-run/react";
import { getPrisma } from "~/libs/getPrisma";

export default function Index() {
  const value = useLoaderData<string>();
  return <div>{value}</div>;
}

export async function loader(): Promise<string> {
  const prisma = getPrisma();
  const users = await prisma.user.findMany();
  return JSON.stringify(users);
}
```

# When using Vite's development mode

- vitePlugin/globalStoragePlugin.ts

```ts
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
```

- vite.config.ts

```ts
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from "./load-context";
import { globalStoragePlugin } from "./vitePlugin/GlobalStoragePlugin";

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy({ getLoadContext }),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
    globalStoragePlugin(),
  ],
});
```
