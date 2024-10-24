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
