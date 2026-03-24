import type {
  CurrentUser,
  DashboardPayload,
  DashboardStats,
  Member,
  MemberTitle,
  Project,
  ProjectTask,
  Task,
  TaskMember,
  TaskStatus,
} from "@/lib/types";

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

type RawTask = {
  id: string;
  title: string;
  description: string;
  project_id: string;
  assignee_id: string;
  deadline: string;
  status: string;
  project: string;
  assignee: string;
};

type RawProject = {
  id: string;
  name: string;
  description: string;
  task_count: number;
  completed_task_count: number;
};

type RawUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  member_title: string;
};

type RawDashboard = {
  stats: {
    total_tasks: number;
    tasks_done: number;
    tasks_in_progress: number;
    total_members: number;
    total_projects: number;
  };
  projects: RawProject[];
  recent_tasks: RawTask[];
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function mapStatus(raw: string): TaskStatus {
  if (raw === "done" || raw === "in-progress" || raw === "todo") {
    return raw;
  }

  if (raw === "completed") {
    return "done";
  }

  if (raw === "pending") {
    return "todo";
  }

  return "todo";
}

function toProject(raw: RawProject): Project {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    taskCount: raw.task_count,
    completedTaskCount: raw.completed_task_count,
  };
}

function toTask(raw: RawTask): Task {
  return {
    id: raw.id,
    title: raw.title,
    status: mapStatus(raw.status),
    project: raw.project,
    assignee: raw.assignee,
  };
}

function toProjectTask(raw: RawTask): ProjectTask {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    projectId: raw.project_id,
    assigneeId: raw.assignee_id,
    deadline: raw.deadline,
    status: mapStatus(raw.status),
    project: raw.project,
    assignee: raw.assignee,
  };
}

function mapMemberTitle(raw: string): MemberTitle {
  switch (raw) {
    case "Designer":
    case "Project Manager":
    case "Engineer":
    case "QA Engineer":
    case "Product Manager":
    case "DevOps Engineer":
      return raw;
    default:
      return "";
  }
}

function toMember(raw: RawUser): Member {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    memberTitle: mapMemberTitle(raw.member_title),
  };
}

async function apiRequest<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
    ...options,
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }
    const message = payload?.error ?? payload?.message ?? response.statusText;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204 || response.status === 202) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function getDashboard(): Promise<DashboardPayload> {
  const raw = await apiRequest<RawDashboard>("/dashboard");

  const stats: DashboardStats = {
    totalTasks: raw.stats.total_tasks,
    tasksDone: raw.stats.tasks_done,
    tasksInProgress: raw.stats.tasks_in_progress,
    totalMembers: raw.stats.total_members,
    totalProjects: raw.stats.total_projects,
  };

  return {
    stats,
    projects: raw.projects.map(toProject),
    recentTasks: raw.recent_tasks.map(toTask),
  };
}

export async function getProjects(): Promise<Project[]> {
  const payload = await apiRequest<{ projects: RawProject[] }>("/projects");
  return payload.projects.map(toProject);
}

export async function createProject(input: {
  name: string;
  description: string;
}): Promise<Project> {
  const payload = await apiRequest<{ project: RawProject }>("/projects", {
    method: "POST",
    body: input,
  });
  return toProject(payload.project);
}

export async function updateProject(
  projectId: string,
  patch: { name?: string; description?: string }
): Promise<Project> {
  const payload = await apiRequest<{ project: RawProject }>(
    `/projects/${projectId}`,
    {
      method: "PATCH",
      body: patch,
    }
  );
  return toProject(payload.project);
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiRequest(`/projects/${projectId}`, { method: "DELETE" });
}

export async function createTask(input: {
  title: string;
  description: string;
  projectId: string;
  assigneeId?: string;
  deadline?: string;
  status?: TaskStatus;
}): Promise<ProjectTask> {
  const payload = await apiRequest<{ task: RawTask }>("/tasks", {
    method: "POST",
    body: {
      title: input.title,
      description: input.description,
      project_id: input.projectId,
      assignee_id: input.assigneeId ?? "",
      deadline: input.deadline ?? "",
      status: input.status ?? "todo",
    },
  });
  return toProjectTask(payload.task);
}

export async function getTasks(projectId?: string): Promise<ProjectTask[]> {
  const search = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";
  const payload = await apiRequest<{ tasks: RawTask[] }>(`/tasks${search}`);
  return payload.tasks.map(toProjectTask);
}

export async function updateTask(
  taskId: string,
  patch: {
    title?: string;
    description?: string;
    projectId?: string;
    assigneeId?: string;
    deadline?: string;
    status?: TaskStatus;
  }
): Promise<ProjectTask> {
  const payload = await apiRequest<{ task: RawTask }>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: {
      title: patch.title,
      description: patch.description,
      project_id: patch.projectId,
      assignee_id: patch.assigneeId,
      deadline: patch.deadline,
      status: patch.status,
    },
  });
  return toProjectTask(payload.task);
}

export async function getTaskMembers(): Promise<TaskMember[]> {
  const payload = await apiRequest<{ users: RawUser[] }>("/users");
  return payload.users.map((user) => ({
    id: user.id,
    name: user.name,
    avatarFallback: user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  }));
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const payload = await apiRequest<{ user: RawUser }>("/users/me");
  return toMember(payload.user);
}

export async function getMembers(memberTitle?: MemberTitle): Promise<Member[]> {
  const search = memberTitle
    ? `?member_title=${encodeURIComponent(memberTitle)}`
    : "";
  const payload = await apiRequest<{ users: RawUser[] }>(`/members${search}`);
  return payload.users.map(toMember);
}

export async function updateMemberTitle(
  memberId: string,
  memberTitle: MemberTitle
): Promise<Member> {
  const payload = await apiRequest<{ user: RawUser }>(
    `/members/${memberId}/title`,
    {
      method: "PATCH",
      body: { member_title: memberTitle },
    }
  );
  return toMember(payload.user);
}

export async function logout(): Promise<void> {
  await apiRequest<{ message: string }>("/users/logout", {
    method: "POST",
  });
}
