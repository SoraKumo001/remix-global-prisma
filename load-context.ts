import { AppLoadContext } from "@remix-run/cloudflare";
import { getSessionContext } from "session-context";
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

const processProxy = new Proxy(process, {
  get(target, name) {
    if (name === "env") {
      const store = getSessionContext<{ env: Env }>();
      return store.env;
    }
    return target[name as keyof typeof target];
  },
});

export const getLoadContext: GetLoadContext = ({ context }) => {
  const store = getSessionContext();
  store.env = context.cloudflare.env;
  if (process !== processProxy) {
    process = processProxy;
  }
  return context;
};
