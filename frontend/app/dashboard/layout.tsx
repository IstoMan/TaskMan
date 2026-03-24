import { Navbar } from "@/components/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
