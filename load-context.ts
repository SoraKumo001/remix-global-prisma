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
