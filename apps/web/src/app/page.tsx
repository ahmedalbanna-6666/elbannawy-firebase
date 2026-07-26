import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage(): Promise<React.ReactNode> {
  const store = await cookies();
  redirect(store.has("auth_token") ? "/dashboard" : "/login");
}
