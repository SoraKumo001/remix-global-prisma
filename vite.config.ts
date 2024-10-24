import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from "./load-context";
import { globalStoragePlugin } from "./vitePlugin/globalStoragePlugin";

export default defineConfig({
  ssr: {
    target: "webworker",
    resolve: {
      conditions: ["worker", "workerd", "browser"],
    },
  },
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
