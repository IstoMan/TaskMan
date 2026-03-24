import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { UserProvider } from "@/lib/user-context";
import type { CurrentUser } from "@/lib/types";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:9090";

async function requireAuth(): Promise<CurrentUser> {
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

  const payload = (await response.json()) as { user: CurrentUser };
  return payload.user;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <UserProvider user={user}>
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </UserProvider>
  );
}
