import { useLoaderData } from "@remix-run/react";
// import { getPrisma } from "~/libs/getPrisma";
import { prisma } from "~/libs/getPrisma";

export default function Index() {
  const value = useLoaderData<string>();
  return <div>{value}</div>;
}

export async function loader(): Promise<string> {
  // const prisma = getPrisma();
  const users = await prisma.user.findMany();
  return JSON.stringify(users);
}
