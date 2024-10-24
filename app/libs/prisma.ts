import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getSessionContext } from "session-context";

export const getPrisma = () => {
  const store = getSessionContext<{ prisma?: PrismaClient; env: Env }>();
  if (!store.prisma) {
    const adapter = new PrismaD1(store.env.DB);
    store.prisma = new PrismaClient({ adapter });
  }
  return store.prisma;
};

export const prisma = new Proxy<PrismaClient>({} as never, {
  get(_target: unknown, props: keyof PrismaClient) {
    return getPrisma()[props];
  },
});
