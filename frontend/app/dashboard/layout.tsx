import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex row-auto min-h-screen justify-between bg-zinc-50 dark:bg-zinc-950 px">
      <div>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </div>
      <div className="w-full max-w-sm mx-auto">{children}</div>
    </main>
  );
}
