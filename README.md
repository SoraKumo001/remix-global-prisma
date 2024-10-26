# remix-global-prisma

Sample of Remix on Cloudflare Workers using Prisma without passing Context each time.

```ts
const users = await prisma.user.findMany();
```

- Repository  
  https://github.com/SoraKumo001/remix-global-prisma
- Run test  
  https://cloudflare-workers-remix.mofon001.workers.dev/

## Example

- vite.config.ts

Enabling SessionContext in Vite development mode.

```js
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from "./load-context";
import { sessionContextPlugin } from "session-context/vite";

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
    // Middleware to add 'runSession'
    sessionContextPlugin(),
  ],
});
```

- functions/server.ts

Enable SessionContext during Production runtime.

```ts
import { createRequestHandler, ServerBuild } from "@remix-run/cloudflare";
import * as build from "../build/server";
import { getLoadContext } from "../load-context";
import { runSession } from "session-context";

const handler = createRequestHandler(build as unknown as ServerBuild);

const fetch = async (request: Request, env: Env, ctx: ExecutionContext) => {
  return runSession(() => {
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

Enabling `process.env` to be used within a session

```ts
import { AppLoadContext } from "@remix-run/cloudflare";
import { setProcessEnv } from "session-context";
import { type PlatformProxy } from "wrangler";

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
  // Enable context.cloudflare.env in process.env
  setProcessEnv(context.cloudflare.env);
  return context;
};
```

- app/libs/prisma.ts

Make a PrismaClient instance available in the session with the name prisma

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getSessionContext } from "session-context";

export const getPrisma = () => {
  const store = getSessionContext<{ prisma?: PrismaClient }>();
  if (!store.prisma) {
    const adapter = new PrismaD1((process.env as unknown as Env).DB);
    store.prisma = new PrismaClient({ adapter });
  }
  return store.prisma;
};

export const prisma = new Proxy<PrismaClient>({} as never, {
  get(_target: unknown, props: keyof PrismaClient) {
    return getPrisma()[props];
  },
});
```

- app/routes/\_index.tsx

Examples of prisma usage

```tsx
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/libs/prisma";

export default function Index() {
  const value = useLoaderData<string>();
  return <div>{value}</div>;
}

export async function loader(): Promise<string> {
  //You can directly use the PrismaClient instance received from the module
  const users = await prisma.user.findMany();
  return JSON.stringify(users);
}
```

- wrangler.toml

Enable `nodejs_compat`.

```toml
#:schema node_modules/wrangler/config-schema.json
name = "xxxxx"
compatibility_date = "2024-09-25"
compatibility_flags = ["nodejs_compat"]
main = "./functions/server.ts"
assets = { directory = "./build/client" }
minify = true

[observability]
enabled = true

[[d1_databases]]
binding = "xxx"
database_name = "xxxx"
database_id = "xxxxxx"
```
