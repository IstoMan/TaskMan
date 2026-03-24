import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { TasksSection } from "@/components/dashboard/tasks-section";
import {
  dashboardStats,
  projects,
  recentTasks,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your workspace activity.
        </p>
      </div>

      <StatsCards stats={dashboardStats} />
      <ProjectsSection projects={projects} />
      <TasksSection tasks={recentTasks} />
    </div>
  );
}
