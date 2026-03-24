export type DashboardStats = {
  totalTasks: number;
  tasksDone: number;
  tasksInProgress: number;
  totalMembers: number;
  totalProjects: number;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  completedTaskCount: number;
};

export type TaskStatus = "done" | "in-progress" | "todo";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  project: string;
  assignee: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  deadline: string;
  status: TaskStatus;
  project: string;
  assignee: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  memberTitle: MemberTitle;
};

export type TaskMember = {
  id: string;
  name: string;
  avatarFallback: string;
};

export type MemberTitle =
  | ""
  | "Designer"
  | "Project Manager"
  | "Engineer"
  | "QA Engineer"
  | "Product Manager"
  | "DevOps Engineer";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  memberTitle: MemberTitle;
};

export type DashboardPayload = {
  stats: DashboardStats;
  projects: Project[];
  recentTasks: Task[];
};
