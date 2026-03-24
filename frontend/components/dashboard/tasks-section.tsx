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
      <Card className="gap-0 py-0">
        <CardHeader className="rounded-none border-b px-6 py-3">
          <div className="grid grid-cols-[minmax(0,1fr)_6rem_7rem_5rem] items-center gap-4 text-xs font-medium text-muted-foreground">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Task
            </CardTitle>
            <span className="flex h-6 items-center justify-center text-center">Status</span>
            <span className="flex h-6 items-center justify-center text-center">Project</span>
            <span className="flex h-6 items-center justify-center text-center">Assignee</span>
          </div>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="grid h-12 grid-cols-[minmax(0,1fr)_6rem_7rem_5rem] items-center gap-4 px-6 text-sm"
            >
              <span className="truncate font-medium leading-5">
                {task.title}
              </span>
              <span className="flex items-center justify-center">
                <Badge variant={statusVariant[task.status]}>
                  {statusLabel[task.status]}
                </Badge>
              </span>
              <span className="flex w-full items-center justify-center truncate text-center text-muted-foreground leading-5">
                {task.project}
              </span>
              <span className="flex w-full items-center justify-center truncate text-center text-muted-foreground leading-5">
                {task.assignee}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
