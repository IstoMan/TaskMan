import {
  ClipboardList,
  CheckCircle2,
  Users,
  FolderKanban,
  Loader,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/mock-data";

type StatItem = {
  label: string;
  value: number;
  icon: React.ReactNode;
};

function buildStats(stats: DashboardStats): StatItem[] {
  return [
    {
      label: "Total Tasks",
      value: stats.totalTasks,
      icon: <ClipboardList className="size-5 text-muted-foreground" />,
    },
    {
      label: "Tasks Done",
      value: stats.tasksDone,
      icon: <CheckCircle2 className="size-5 text-emerald-500" />,
    },
    {
      label: "In Progress",
      value: stats.tasksInProgress,
      icon: <Loader className="size-5 text-amber-500" />,
    },
    {
      label: "Members",
      value: stats.totalMembers,
      icon: <Users className="size-5 text-muted-foreground" />,
    },
    {
      label: "Projects",
      value: stats.totalProjects,
      icon: <FolderKanban className="size-5 text-muted-foreground" />,
    },
  ];
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const items = buildStats(stats);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold tracking-tight">
                {item.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
