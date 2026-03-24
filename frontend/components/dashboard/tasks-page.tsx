"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { CalendarDays, Circle, CircleCheckBig, Plus } from "lucide-react";
import {
  createTask,
  getProjects,
  getTaskMembers,
  getTasks,
  updateTask as updateTaskRequest,
} from "@/lib/api";
import type { Project, ProjectTask, TaskMember } from "@/lib/types";
import { useUser } from "@/lib/user-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EditableField = "title" | "description" | "assigneeId" | "deadline";

function padTimeValue(value: number) {
  return `${value}`.padStart(2, "0");
}

function toDateTimeLocalValue(date: Date, time: string) {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number.parseInt(hoursRaw ?? "", 10);
  const minutes = Number.parseInt(minutesRaw ?? "", 10);
  const validHours = Number.isNaN(hours) ? 9 : hours;
  const validMinutes = Number.isNaN(minutes) ? 0 : minutes;

  const local = new Date(date);
  local.setHours(validHours, validMinutes, 0, 0);

  return `${local.getFullYear()}-${padTimeValue(local.getMonth() + 1)}-${padTimeValue(
    local.getDate()
  )}T${padTimeValue(local.getHours())}:${padTimeValue(local.getMinutes())}`;
}

function parseDeadlineValue(value: string) {
  if (!value) {
    return { date: undefined as Date | undefined, time: "09:00" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return { date: undefined as Date | undefined, time: "09:00" };
  }

  return {
    date: parsed,
    time: `${padTimeValue(parsed.getHours())}:${padTimeValue(parsed.getMinutes())}`,
  };
}

function formatDeadline(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function TasksPageContent() {
  const user = useUser();
  const isAdmin = user.role === "admin";

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [editingField, setEditingField] = useState<{
    taskId: string;
    field: EditableField;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const otherProjects = useMemo(
    () => projects.filter((project) => project.id !== selectedProjectId),
    [projects, selectedProjectId]
  );

  const visibleTasks = tasks;

  const updateTaskLocal = (taskId: string, patch: Partial<ProjectTask>) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    );
  };

  useEffect(() => {
    if (!isAdmin) {
      const loadMemberTasks = async () => {
        try {
          const loadedTasks = await getTasks();
          setTasks(loadedTasks);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load your tasks";
          setError(message);
        }
      };
      void loadMemberTasks();
      return;
    }

    const loadInitialData = async () => {
      try {
        const [loadedProjects, loadedMembers] = await Promise.all([
          getProjects(),
          getTaskMembers(),
        ]);
        setProjects(loadedProjects);
        setTaskMembers(loadedMembers);
        setSelectedProjectId((current) => current || loadedProjects[0]?.id || "");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load tasks page data";
        setError(message);
      }
    };

    void loadInitialData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !selectedProjectId) {
      return;
    }

    const loadTasks = async () => {
      try {
        const loadedTasks = await getTasks(selectedProjectId);
        setTasks(loadedTasks);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load project tasks";
        setError(message);
      }
    };

    void loadTasks();
  }, [isAdmin, selectedProjectId]);

  const persistTask = async (taskId: string, patch: Parameters<typeof updateTaskRequest>[1]) => {
    try {
      const updatedTask = await updateTaskRequest(taskId, patch);
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save task changes";
      setError(message);
    }
  };

  const addTask = async () => {
    if (!selectedProjectId) {
      setError("Select a project before adding tasks.");
      return;
    }

    try {
      const createdTask = await createTask({
        title: "New task",
        description: "Click Description to add task details.",
        projectId: selectedProjectId,
        assigneeId: taskMembers[0]?.id,
        deadline: "",
        status: "todo",
      });

      setTasks((current) => [createdTask, ...current]);
      setEditingField({ taskId: createdTask.id, field: "title" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create a task";
      setError(message);
    }
  };

  const toggleDone = (task: ProjectTask) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    updateTaskLocal(task.id, { status: nextStatus });
    void persistTask(task.id, { status: nextStatus });
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Tasks assigned to you across all projects.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          ) : null}
        </header>

        <section className="grid gap-4">
          {visibleTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No tasks assigned to you yet.
              </CardContent>
            </Card>
          ) : (
            visibleTasks.map((task) => (
              <Card key={task.id} className={task.status === "done" ? "opacity-60" : ""}>
                <CardHeader className="gap-3 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className={task.status === "done" ? "line-through" : ""}>
                        {task.title}
                      </CardTitle>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {task.project ? (
                        <Badge variant="secondary">{task.project}</Badge>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant={task.status === "done" ? "default" : "secondary"}
                        className={
                          task.status === "done"
                            ? ""
                            : "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30"
                        }
                        onClick={() => toggleDone(task)}
                      >
                        {task.status === "done" ? (
                          <>
                            <CircleCheckBig className="size-4" />
                            Done
                          </>
                        ) : (
                          <>
                            <Circle className="size-4" />
                            Mark done
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <CardDescription>Description</CardDescription>
                    <p className="text-sm text-foreground">
                      {task.description || "No description."}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <CardDescription>Deadline</CardDescription>
                      <p className="text-sm text-foreground">
                        {formatDeadline(task.deadline)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger
              className="h-auto w-fit border-0 bg-transparent p-0 text-xl font-semibold tracking-normal shadow-none hover:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent [&_[data-slot=select-value]]:text-xl [&_[data-slot=select-value]]:font-semibold [&_[data-slot=select-value]]:tracking-normal"
            >
              <SelectValue placeholder="Project Tasks">
                {selectedProject?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              sideOffset={8}
              className="min-w-[var(--radix-select-trigger-width)] p-0"
            >
              {otherProjects.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">
                  No other projects to switch to.
                </div>
              ) : (
                otherProjects.map((project, index) => (
                  <Fragment key={project.id}>
                    {index > 0 ? <SelectSeparator className="my-0" /> : null}
                    <SelectItem
                      value={project.id}
                      className="rounded-none py-2.5 pr-3 pl-3 text-base font-medium tracking-normal focus:rounded-none"
                      textValue={project.name}
                    >
                      {project.name}
                    </SelectItem>
                  </Fragment>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {selectedProject?.description ?? "Manage project tasks."}
          </p>
          {error ? (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          ) : null}
        </div>
        <Button type="button" onClick={() => void addTask()} disabled={!selectedProjectId}>
          <Plus />
          Add task
        </Button>
      </header>

      <section className="grid gap-4">
        {visibleTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No tasks yet for this project. Add your first task.
            </CardContent>
          </Card>
        ) : (
          visibleTasks.map((task) => {
            const member = taskMembers.find((item) => item.id === task.assigneeId);
            const isEditing = (field: EditableField) =>
              editingField?.taskId === task.id && editingField?.field === field;

            return (
              <Card key={task.id}>
                <CardHeader className="gap-3 border-b">
                  {isEditing("title") ? (
                    <Input
                      value={task.title}
                      onChange={(event) =>
                        updateTaskLocal(task.id, { title: event.target.value })
                      }
                      onBlur={() => {
                        setEditingField(null);
                        void persistTask(task.id, { title: task.title });
                      }}
                      onFocus={(event) => event.currentTarget.select()}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="-mx-1 w-full rounded-md px-1 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      onClick={() => setEditingField({ taskId: task.id, field: "title" })}
                    >
                      <CardTitle>{task.title}</CardTitle>
                    </button>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <CardDescription>Description</CardDescription>
                    {isEditing("description") ? (
                      <textarea
                        value={task.description}
                        onChange={(event) =>
                          updateTaskLocal(task.id, { description: event.target.value })
                        }
                        onBlur={() => {
                          setEditingField(null);
                          void persistTask(task.id, { description: task.description });
                        }}
                        onFocus={(event) => event.currentTarget.select()}
                        autoFocus
                        rows={3}
                        className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    ) : (
                      <button
                        type="button"
                        className="-mx-1 w-full rounded-md px-1 text-left text-sm text-foreground transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                        onClick={() => setEditingField({ taskId: task.id, field: "description" })}
                      >
                        {task.description}
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <CardDescription>Assigned member</CardDescription>
                      {isEditing("assigneeId") ? (
                        <Select
                          value={task.assigneeId}
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingField(null);
                            }
                          }}
                          onValueChange={(value) => {
                            updateTaskLocal(task.id, { assigneeId: value });
                            void persistTask(task.id, { assigneeId: value });
                            setEditingField(null);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            {taskMembers.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <button
                          type="button"
                          className="-mx-1 flex w-full items-center gap-2 rounded-md px-1 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                          onClick={() => setEditingField({ taskId: task.id, field: "assigneeId" })}
                        >
                          <Avatar size="sm">
                            <AvatarFallback>{member?.avatarFallback ?? "NA"}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">
                            {member?.name ?? "Unassigned"}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <CardDescription>Deadline</CardDescription>
                      {isEditing("deadline") ? (
                        <Popover
                          open
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingField(null);
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start font-normal"
                            >
                              <CalendarDays className="size-4" />
                              {task.deadline ? formatDeadline(task.deadline) : "Select deadline"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={parseDeadlineValue(task.deadline).date}
                              onSelect={(selectedDate) => {
                                if (!selectedDate) {
                                  updateTaskLocal(task.id, { deadline: "" });
                                  void persistTask(task.id, { deadline: "" });
                                  return;
                                }

                                const current = parseDeadlineValue(task.deadline);
                                const nextDeadline = toDateTimeLocalValue(
                                  selectedDate,
                                  current.time
                                );

                                updateTaskLocal(task.id, {
                                  deadline: nextDeadline,
                                });

                                void persistTask(task.id, {
                                  deadline: nextDeadline,
                                });

                              }}
                              initialFocus
                            />
                            <div className="border-t p-3">
                              <label className="space-y-1 text-sm">
                                <span className="text-muted-foreground">Time</span>
                                <Input
                                  type="time"
                                  value={parseDeadlineValue(task.deadline).time}
                                  onChange={(event) => {
                                    const current = parseDeadlineValue(task.deadline);
                                    const baseDate = current.date ?? new Date();
                                    const nextDeadline = toDateTimeLocalValue(
                                      baseDate,
                                      event.target.value
                                    );

                                    updateTaskLocal(task.id, {
                                      deadline: nextDeadline,
                                    });

                                    void persistTask(task.id, {
                                      deadline: nextDeadline,
                                    });
                                  }}
                                />
                              </label>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <button
                          type="button"
                          className="-mx-1 w-full rounded-md px-1 text-left text-sm text-foreground transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                          onClick={() => setEditingField({ taskId: task.id, field: "deadline" })}
                        >
                          {formatDeadline(task.deadline)}
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
