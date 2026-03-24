"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { label: "Members", href: "/dashboard/members", icon: Users },
] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
      <nav className="relative mx-auto flex min-h-14 max-w-6xl items-center gap-2 px-4 py-2 md:px-6">
        <div className="flex min-w-0 flex-1 justify-start">
          <Link
            href="/dashboard"
            className="text-base font-bold tracking-tight"
          >
            TaskManager
          </Link>
        </div>

        <ul className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex min-w-0 flex-1 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex max-w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2 py-1.5 text-left outline-none",
                "ring-offset-background hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "data-[state=open]:bg-accent/50"
              )}
            >
              <Avatar size="lg" className="shrink-0">
                <AvatarFallback className="text-sm">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 max-w-[10rem] flex-1 flex-col items-start sm:max-w-none">
                <span className="block w-full truncate text-xs font-medium leading-tight">
                  {currentUser.name}
                </span>
                <span className="block w-full truncate text-[11px] leading-tight text-muted-foreground">
                  {currentUser.email}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="bottom"
              sideOffset={6}
              alignOffset={0}
              className="min-w-0 p-0.5"
            >
              <DropdownMenuItem
                variant="destructive"
                className="gap-1.5 py-1 pl-2 pr-2 text-xs [&_svg]:size-3.5"
                onSelect={() => {
                  router.push("/login");
                }}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
}
