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
