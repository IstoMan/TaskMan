import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:9090";

export default async function Home() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("Authorization")?.value;

  if (!authToken) {
    redirect("/login");
  }

  const response = await fetch(`${backendUrl}/api/users/me`, {
    method: "GET",
    headers: {
      Cookie: `Authorization=${authToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    redirect("/login");
  }

  redirect("/dashboard");
}
