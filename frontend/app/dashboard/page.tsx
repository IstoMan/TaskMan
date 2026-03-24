"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { TasksSection } from "@/components/dashboard/tasks-section";
import { getDashboard } from "@/lib/api";
import type { DashboardPayload } from "@/lib/types";

const EMPTY_DASHBOARD: DashboardPayload = {
  stats: {
    totalTasks: 0,
    tasksDone: 0,
    tasksInProgress: 0,
    totalMembers: 0,
    totalProjects: 0,
  },
  projects: [],
  recentTasks: [],
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload>(EMPTY_DASHBOARD);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const payload = await getDashboard();
        setDashboard(payload);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(message);
      }
    };

    void loadDashboard();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your workspace activity.
        </p>
        {error ? (
          <p className="mt-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <StatsCards stats={dashboard.stats} />
      <ProjectsSection projects={dashboard.projects} />
      <TasksSection tasks={dashboard.recentTasks} />
    </div>
  );
}
