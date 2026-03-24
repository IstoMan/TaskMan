import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Task, TaskStatus } from "@/lib/types";

const statusVariant: Record<TaskStatus, "default" | "secondary" | "outline"> = {
  done: "default",
  "in-progress": "secondary",
  todo: "outline",
};

const statusLabel: Record<TaskStatus, string> = {
  done: "Done",
  "in-progress": "In Progress",
  todo: "To Do",
};

export function TasksSection({ tasks }: { tasks: Task[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Recent Tasks</h2>
      <Card>
        <CardHeader className="border-b">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 text-xs font-medium text-muted-foreground">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Task
            </CardTitle>
            <span className="w-24 text-center">Status</span>
            <span className="w-28 text-center">Project</span>
            <span className="w-20 text-center">Assignee</span>
          </div>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 text-sm"
            >
              <span className="truncate font-medium">{task.title}</span>
              <span className="flex w-24 justify-center">
                <Badge variant={statusVariant[task.status]}>
                  {statusLabel[task.status]}
                </Badge>
              </span>
              <span className="w-28 truncate text-center text-muted-foreground">
                {task.project}
              </span>
              <span className="w-20 truncate text-center text-muted-foreground">
                {task.assignee}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
