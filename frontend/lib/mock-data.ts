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
};

export type TaskStatus = "done" | "in-progress" | "todo";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  project: string;
  assignee: string;
};

export type CurrentUser = {
  name: string;
  email: string;
  role: "admin" | "member";
};

export const dashboardStats: DashboardStats = {
  totalTasks: 24,
  tasksDone: 12,
  tasksInProgress: 7,
  totalMembers: 8,
  totalProjects: 5,
};

export const projects: Project[] = [
  {
    id: "p1",
    name: "Website Redesign",
    description: "Overhaul the marketing site with a fresh look and improved UX.",
    taskCount: 8,
  },
  {
    id: "p2",
    name: "Mobile App",
    description: "Build the cross-platform mobile companion app.",
    taskCount: 6,
  },
  {
    id: "p3",
    name: "API Integration",
    description: "Connect third-party services and build the REST layer.",
    taskCount: 5,
  },
  {
    id: "p4",
    name: "Analytics Dashboard",
    description: "Real-time metrics and reporting for stakeholders.",
    taskCount: 5,
  },
];

export const recentTasks: Task[] = [
  { id: "t1", title: "Design homepage hero section", status: "done", project: "Website Redesign", assignee: "Alice" },
  { id: "t2", title: "Set up CI/CD pipeline", status: "in-progress", project: "API Integration", assignee: "Bob" },
  { id: "t3", title: "Implement auth flow", status: "in-progress", project: "Mobile App", assignee: "Charlie" },
  { id: "t4", title: "Create chart components", status: "todo", project: "Analytics Dashboard", assignee: "Diana" },
  { id: "t5", title: "Write API documentation", status: "todo", project: "API Integration", assignee: "Eve" },
  { id: "t6", title: "Responsive nav bar", status: "done", project: "Website Redesign", assignee: "Alice" },
];

export const currentUser: CurrentUser = {
  name: "Chad Miller",
  email: "chad@example.com",
  role: "admin",
};
