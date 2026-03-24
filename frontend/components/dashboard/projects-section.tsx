import { FolderKanban } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";

function getCompletionPercent(project: Project): number {
  if (project.taskCount <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, (project.completedTaskCount / project.taskCount) * 100)
  );
}

export function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="size-4 text-muted-foreground" />
                  <CardTitle>{project.name}</CardTitle>
                </div>
                <Badge variant="secondary">
                  {project.completedTaskCount}/{project.taskCount} completed
                </Badge>
              </div>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${getCompletionPercent(project)}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
