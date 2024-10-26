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
