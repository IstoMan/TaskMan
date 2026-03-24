"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject as updateProjectRequest,
} from "@/lib/api";
import type { Project } from "@/lib/types";
import { useUser } from "@/lib/user-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EditableField = "name" | "description";

export function ProjectsPageContent() {
  const user = useUser();
  const isAdmin = user.role === "admin";

  const [projects, setProjects] = useState<Project[]>([]);
  const [editingField, setEditingField] = useState<{
    projectId: string;
    field: EditableField;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await getProjects();
        setProjects(loaded);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load projects";
        setError(message);
      }
    };

    void load();
  }, []);

  const updateProjectLocal = (projectId: string, patch: Partial<Project>) => {
    setProjects((current) =>
      current.map((p) => (p.id === projectId ? { ...p, ...patch } : p))
    );
  };

  const persistProject = async (
    projectId: string,
    patch: { name?: string; description?: string }
  ) => {
    try {
      const updated = await updateProjectRequest(projectId, patch);
      setProjects((current) =>
        current.map((p) => (p.id === projectId ? updated : p))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save project changes";
      setError(message);
    }
  };

  const handleCreate = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError("Project name cannot be empty.");
      return;
    }

    try {
      const created = await createProject({
        name: trimmedName,
        description: newDescription.trim(),
      });
      setProjects((current) => [created, ...current]);
      setNewName("");
      setNewDescription("");
      setIsCreating(false);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create project";
      setError(message);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects((current) => current.filter((p) => p.id !== projectId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete project";
      setError(message);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Manage your projects. Each project can have many tasks."
              : "All projects in the workspace."}
          </p>
          {error ? (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          ) : null}
        </div>
        {isAdmin ? (
          <Button
            type="button"
            onClick={() => {
              setIsCreating(true);
              setError(null);
            }}
          >
            <Plus />
            New project
          </Button>
        ) : null}
      </header>

      {isAdmin && isCreating ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Create a new project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1">
              <CardDescription>Name</CardDescription>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Project name"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <CardDescription>Description</CardDescription>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Short project description"
                rows={2}
                className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => void handleCreate()}>
                Create
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setNewName("");
                  setNewDescription("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        {projects.length === 0 && !isCreating ? (
          <Card className="sm:col-span-2">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No projects yet. Create your first project.
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const isEditing = (field: EditableField) =>
              isAdmin &&
              editingField?.projectId === project.id &&
              editingField?.field === field;

            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <FolderKanban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      {isEditing("name") ? (
                        <Input
                          value={project.name}
                          onChange={(e) =>
                            updateProjectLocal(project.id, {
                              name: e.target.value,
                            })
                          }
                          onBlur={() => {
                            setEditingField(null);
                            void persistProject(project.id, {
                              name: project.name,
                            });
                          }}
                          onFocus={(e) => e.currentTarget.select()}
                          autoFocus
                          className="h-auto py-0 text-base font-semibold"
                        />
                      ) : isAdmin ? (
                        <button
                          type="button"
                          className="-mx-1 min-w-0 flex-1 rounded-md px-1 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                          onClick={() =>
                            setEditingField({
                              projectId: project.id,
                              field: "name",
                            })
                          }
                        >
                          <CardTitle>{project.name}</CardTitle>
                        </button>
                      ) : (
                        <CardTitle>{project.name}</CardTitle>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary">
                        {project.taskCount} tasks
                      </Badge>
                      {isAdmin ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => void handleDelete(project.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {isEditing("description") ? (
                    <textarea
                      value={project.description}
                      onChange={(e) =>
                        updateProjectLocal(project.id, {
                          description: e.target.value,
                        })
                      }
                      onBlur={() => {
                        setEditingField(null);
                        void persistProject(project.id, {
                          description: project.description,
                        });
                      }}
                      onFocus={(e) => e.currentTarget.select()}
                      autoFocus
                      rows={2}
                      className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  ) : isAdmin ? (
                    <button
                      type="button"
                      className="-mx-1 w-full rounded-md px-1 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      onClick={() =>
                        setEditingField({
                          projectId: project.id,
                          field: "description",
                        })
                      }
                    >
                      <CardDescription>
                        {project.description || "Click to add a description"}
                      </CardDescription>
                    </button>
                  ) : (
                    <CardDescription>
                      {project.description || "No description."}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(8, project.taskCount * 10))}%`,
                      }}
                    />
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
