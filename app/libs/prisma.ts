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

// Create a proxy that returns a PrismaClient instance on SessionContext with the variable name prisma
export const prisma = new Proxy<PrismaClient>({} as never, {
  get(_target: unknown, props: keyof PrismaClient) {
    return getPrisma()[props];
  },
});
