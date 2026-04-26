import type { AppPage, CurrentUser, Task, UpdateTaskFormState } from "@/types/tasks"

export const initialTasks: Task[] = [
  {
    id: "TASK-101",
    title: "Create dashboard layout",
    status: "In Progress",
    priority: "High",
  },
  {
    id: "TASK-102",
    title: "Design login page",
    status: "Todo",
    priority: "Medium",
  },
  {
    id: "TASK-103",
    title: "Connect task API",
    status: "Todo",
    priority: "High",
  },
  {
    id: "TASK-104",
    title: "Test task filters",
    status: "Done",
    priority: "Low",
  },
]

export const emptyUpdateForm: UpdateTaskFormState = {
  taskId: "",
  title: "",
  description: "",
  status: "",
  assignedToId: "",
  updatedById: "",
}

export const pageLabels: Record<AppPage, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  create: "New Task",
  profile: "Profile",
  login: "Login",
}

export const pagePaths: Record<AppPage, string> = {
  dashboard: "/",
  tasks: "/tasks",
  create: "/tasks/new",
  profile: "/profile",
  login: "/login",
}

export function getStoredUser() {
  const storedUser = localStorage.getItem("current_user")
  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as CurrentUser
  } catch {
    return null
  }
}

export function getPageFromPath(pathname: string): AppPage {
  if (pathname === "/login") {
    return "login"
  }
  if (pathname === "/tasks") {
    return "tasks"
  }
  if (pathname === "/tasks/new") {
    return "create"
  }
  if (pathname === "/profile") {
    return "profile"
  }
  return "dashboard"
}

export function normalizeTask(payload: Task): Task {
  return {
    id: payload.id,
    title: payload.title,
    status: payload.status,
    description: payload.description,
    assigned_to_id: payload.assigned_to_id,
    created_by_id: payload.created_by_id,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
    priority: payload.priority ?? "API",
  }
}
