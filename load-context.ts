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

export const getLoadContext: GetLoadContext = ({ context }) => {
  const store = getSessionContext();
  store.env = context.cloudflare.env;
  // set process.env to the value of store.env
  if (!Object.getOwnPropertyDescriptor(process, "env")?.get) {
    Object.defineProperty(process, "env", {
      get() {
        return store.env;
      },
    });
  }
  return context;
};
