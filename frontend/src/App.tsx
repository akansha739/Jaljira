import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  ClipboardList,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  UserCircle,
} from "lucide-react"

import LoginPage from "@/pages/LoginPage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { apiRequest } from "@/lib/api"

type AppPage = "dashboard" | "tasks" | "create" | "profile" | "login"

type CurrentUser = {
  id: number
  email: string
  role: string
}

type Task = {
  id: number | string
  title: string
  status: string
  priority?: string
  description?: string | null
  assigned_to_id?: number | null
  created_by_id?: number | null
  created_at?: string
  updated_at?: string
}

type TaskFormState = {
  title: string
  description: string
  status: string
  createdById: string
  assignedToId: string
}

type UpdateTaskFormState = {
  taskId: string
  title: string
  description: string
  status: string
  assignedToId: string
  updatedById: string
}

type Feedback = {
  type: "success" | "error"
  message: string
}

const initialTasks: Task[] = [
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

const emptyUpdateForm: UpdateTaskFormState = {
  taskId: "",
  title: "",
  description: "",
  status: "",
  assignedToId: "",
  updatedById: "",
}

const pageLabels: Record<AppPage, string> = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  create: "New Task",
  profile: "Profile",
  login: "Login",
}

const pagePaths: Record<AppPage, string> = {
  dashboard: "/",
  tasks: "/tasks",
  create: "/tasks/new",
  profile: "/profile",
  login: "/login",
}

const navigationItems = [
  { page: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
  { page: "tasks" as const, icon: ClipboardList, label: "Tasks" },
  { page: "create" as const, icon: Plus, label: "New Task" },
  { page: "profile" as const, icon: UserCircle, label: "Profile" },
]

function getStoredUser() {
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

function getPageFromPath(pathname: string): AppPage {
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

function normalizeTask(payload: Task): Task {
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

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() =>
    getStoredUser()
  )
  const [currentPage, setCurrentPage] = useState<AppPage>(() =>
    getPageFromPath(window.location.pathname)
  )
  const [density, setDensity] = useState(1)
  const [query, setQuery] = useState("")
  const [assignedUserId, setAssignedUserId] = useState(() =>
    currentUser?.id ? String(currentUser.id) : ""
  )
  const [form, setForm] = useState<TaskFormState>({
    title: "",
    description: "",
    status: "open",
    createdById: currentUser?.id ? String(currentUser.id) : "",
    assignedToId: "",
  })
  const [updateForm, setUpdateForm] = useState<UpdateTaskFormState>({
    ...emptyUpdateForm,
    updatedById: currentUser?.id ? String(currentUser.id) : "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAssignedTasks, setIsLoadingAssignedTasks] = useState(false)
  const [isUpdatingTask, setIsUpdatingTask] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [assignedFeedback, setAssignedFeedback] = useState<Feedback | null>(null)
  const [updateFeedback, setUpdateFeedback] = useState<Feedback | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const stats = useMemo(() => {
    const completedCount = tasks.filter((task) =>
      ["done", "completed"].includes(task.status.toLowerCase())
    ).length
    const activeCount = tasks.filter((task) =>
      ["in progress", "in_progress", "open", "working"].includes(
        task.status.toLowerCase()
      )
    ).length
    const waitingCount = tasks.length - completedCount - activeCount

    return [
      {
        label: "Active",
        value: String(activeCount),
      },
      {
        label: "Completed",
        value: String(completedCount),
      },
      {
        label: "Waiting",
        value: String(Math.max(waitingCount, 0)),
      },
    ]
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return tasks
    }

    return tasks.filter((task) =>
      [task.id, task.title, task.status, task.priority, task.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    )
  }, [query, tasks])

  useEffect(() => {
    function handlePopState() {
      setCurrentPage(getPageFromPath(window.location.pathname))
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  function navigateTo(page: AppPage) {
    window.history.pushState(null, "", pagePaths[page])
    setCurrentPage(page)
  }

  function handleAuthenticated() {
    const user = getStoredUser()
    setCurrentUser(user)

    if (user?.id) {
      const userId = String(user.id)
      setAssignedUserId(userId)
      updateFormValue("updatedById", userId)
      updateCreateForm("createdById", userId)
    }

    navigateTo("dashboard")
  }

  function handleLogout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("current_user")
    setCurrentUser(null)
    navigateTo("login")
  }

  function updateCreateForm<K extends keyof TaskFormState>(
    key: K,
    value: TaskFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateFormValue<K extends keyof UpdateTaskFormState>(
    key: K,
    value: UpdateTaskFormState[K]
  ) {
    setUpdateForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const response = await apiRequest("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          status: form.status,
          created_by_id: Number(form.createdById),
          assigned_to_id: form.assignedToId ? Number(form.assignedToId) : null,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.detail || "Failed to create task")
      }

      const createdTask = normalizeTask(payload)
      setTasks((current) => [createdTask, ...current])
      setForm({
        title: "",
        description: "",
        status: "open",
        createdById: currentUser?.id ? String(currentUser.id) : "",
        assignedToId: "",
      })
      setFeedback({
        type: "success",
        message: `Task "${payload.title}" created successfully.`,
      })
      navigateTo("tasks")
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLoadAssignedTasks(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoadingAssignedTasks(true)
    setAssignedFeedback(null)

    try {
      const response = await apiRequest(`/tasks/assigned/${assignedUserId}`)
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.detail || "Failed to load assigned tasks")
      }

      const assignedTasks = payload.map(normalizeTask)
      setTasks(assignedTasks)
      setAssignedFeedback({
        type: "success",
        message: `Loaded ${assignedTasks.length} assigned task(s).`,
      })
    } catch (error) {
      setAssignedFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setIsLoadingAssignedTasks(false)
    }
  }

  async function handleUpdateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUpdatingTask(true)
    setUpdateFeedback(null)

    try {
      const response = await apiRequest(`/tasks/${updateForm.taskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: updateForm.title || undefined,
          description: updateForm.description || null,
          status: updateForm.status || undefined,
          assigned_to_id: updateForm.assignedToId
            ? Number(updateForm.assignedToId)
            : null,
          updated_by_id: Number(updateForm.updatedById),
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.detail || "Failed to update task")
      }

      const updatedTask = normalizeTask(payload)
      setTasks((current) =>
        current.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      )
      setUpdateFeedback({
        type: "success",
        message: `Task updated successfully.`,
      })
      setTimeout(() => setEditDialogOpen(false), 1000)
    } catch (error) {
      setUpdateFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    } finally {
      setIsUpdatingTask(false)
    }
  }

  function openEditDialog(task: Task) {
    setUpdateForm({
      taskId: String(task.id),
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      assignedToId: task.assigned_to_id ? String(task.assigned_to_id) : "",
      updatedById: currentUser?.id ? String(currentUser.id) : "",
    })
    setUpdateFeedback(null)
    setEditDialogOpen(true)
  }

  if (currentPage === "login") {
    return (
      <LoginPage
        onAuthenticated={handleAuthenticated}
        onBackToTasks={() => navigateTo("dashboard")}
      />
    )
  }

  return (
    <SidebarProvider>
      <div
        className="app-shell"
        style={{ "--p-density": density } as CSSProperties}
      >
        <Sidebar>
          <SidebarHeader>
            <div className="brand-block">
              <span className="brand-mark">J</span>
              <div>
                <p className="brand-title">Jaljira</p>
                <p className="brand-subtitle">Tasks</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.page}>
                      <SidebarMenuButton
                        isActive={currentPage === item.page}
                        onClick={() => navigateTo(item.page)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            {currentUser ? (
              <div className="user-summary">
                <span className="user-avatar">{currentUser.email.charAt(0)}</span>
                <div>
                  <p>{currentUser.email}</p>
                  <span>{currentUser.role}</span>
                </div>
              </div>
            ) : (
              <Button type="button" onClick={() => navigateTo("login")}>
                <LogIn className="size-4" />
                Login
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="page-flow">
          <header className="page-header">
            <h1>{pageLabels[currentPage]}</h1>
            <div className="header-actions">
              {!currentUser && (
                <Button type="button" variant="outline" onClick={() => navigateTo("login")}>
                  <LogIn className="size-4" />
                  Login
                </Button>
              )}
              <Button type="button" onClick={() => navigateTo("create")}>
                <Plus className="size-4" />
                New task
              </Button>
            </div>
          </header>

          {currentPage === "dashboard" && (
            <DashboardPage
              filteredTasks={filteredTasks}
              query={query}
              stats={stats}
              onEdit={openEditDialog}
              onQueryChange={setQuery}
            />
          )}

          {currentPage === "tasks" && (
            <TasksPage
              assignedFeedback={assignedFeedback}
              assignedUserId={assignedUserId}
              filteredTasks={filteredTasks}
              isLoadingAssignedTasks={isLoadingAssignedTasks}
              query={query}
              onAssignedUserIdChange={setAssignedUserId}
              onEdit={openEditDialog}
              onLoadAssignedTasks={handleLoadAssignedTasks}
              onQueryChange={setQuery}
            />
          )}

          {currentPage === "create" && (
            <CreateTaskPage
              feedback={feedback}
              form={form}
              isSubmitting={isSubmitting}
              onChange={updateCreateForm}
              onSubmit={handleSubmit}
            />
          )}

          {currentPage === "profile" && (
            <ProfilePage
              currentUser={currentUser}
              density={density}
              onDensityChange={setDensity}
              onLogin={() => navigateTo("login")}
              onLogout={handleLogout}
            />
          )}
        </main>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task #{updateForm.taskId}
              </DialogDescription>
            </DialogHeader>
            <form className="compact-form" onSubmit={handleUpdateTask}>
              <Field label="Title">
                <Input
                  value={updateForm.title}
                  onChange={(e) => updateFormValue("title", e.target.value)}
                  placeholder="Task title"
                />
              </Field>
              <Field label="Description">
                <Textarea
                  value={updateForm.description}
                  onChange={(e) => updateFormValue("description", e.target.value)}
                  placeholder="Task description"
                />
              </Field>
              <div className="form-grid">
                <Field label="Status">
                  <Input
                    value={updateForm.status}
                    onChange={(e) => updateFormValue("status", e.target.value)}
                    placeholder="open"
                  />
                </Field>
                <Field label="Assigned To">
                  <Input
                    inputMode="numeric"
                    value={updateForm.assignedToId}
                    onChange={(e) => updateFormValue("assignedToId", e.target.value)}
                    placeholder="User ID"
                  />
                </Field>
              </div>
              {updateFeedback && <FeedbackMessage feedback={updateFeedback} />}
              <Button className="w-full" disabled={isUpdatingTask} type="submit">
                {isUpdatingTask ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {isUpdatingTask ? "Updating..." : "Update task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  )
}

function DashboardPage({
  filteredTasks,
  query,
  stats,
  onEdit,
  onQueryChange,
}: {
  filteredTasks: Task[]
  query: string
  stats: Array<{
    label: string
    value: string
  }>
  onEdit: (task: Task) => void
  onQueryChange: (value: string) => void
}) {
  return (
    <div className="dashboard-layout">
      <section className="metrics-strip">
        {stats.map((stat, index) => (
          <div className="metric-tile" data-tone={index} key={stat.label}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </section>

      <section className="task-section">
        <div className="section-toolbar">
          <div className="section-copy">
            <h2>Recent Tasks</h2>
            <p>The latest items, ready to scan and edit without extra clutter.</p>
          </div>
          <SearchBox query={query} onQueryChange={onQueryChange} />
        </div>
        <TaskTable tasks={filteredTasks.slice(0, 5)} onEdit={onEdit} />
      </section>
    </div>
  )
}

function TasksPage({
  assignedFeedback,
  assignedUserId,
  filteredTasks,
  isLoadingAssignedTasks,
  query,
  onAssignedUserIdChange,
  onEdit,
  onLoadAssignedTasks,
  onQueryChange,
}: {
  assignedFeedback: Feedback | null
  assignedUserId: string
  filteredTasks: Task[]
  isLoadingAssignedTasks: boolean
  query: string
  onAssignedUserIdChange: (value: string) => void
  onEdit: (task: Task) => void
  onLoadAssignedTasks: (event: FormEvent<HTMLFormElement>) => void
  onQueryChange: (value: string) => void
}) {
  return (
    <div className="tasks-layout">
      <section className="task-section">
        <div className="section-toolbar">
          <h2>All Tasks</h2>
          <SearchBox query={query} onQueryChange={onQueryChange} />
        </div>
        <TaskTable tasks={filteredTasks} onEdit={onEdit} />
      </section>

      <aside className="work-panel">
        <h3>Load Assigned Tasks</h3>
        <form className="compact-form" onSubmit={onLoadAssignedTasks}>
          <Field label="User ID">
            <Input
              required
              inputMode="numeric"
              value={assignedUserId}
              onChange={(e) => onAssignedUserIdChange(e.target.value)}
              placeholder="2"
            />
          </Field>
          {assignedFeedback && <FeedbackMessage feedback={assignedFeedback} />}
          <Button
            className="w-full"
            disabled={isLoadingAssignedTasks}
            type="submit"
            variant="secondary"
          >
            {isLoadingAssignedTasks ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {isLoadingAssignedTasks ? "Loading..." : "Load"}
          </Button>
        </form>
      </aside>
    </div>
  )
}

function CreateTaskPage({
  feedback,
  form,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  feedback: Feedback | null
  form: TaskFormState
  isSubmitting: boolean
  onChange: <K extends keyof TaskFormState>(
    key: K,
    value: TaskFormState[K]
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="create-layout">
      <form className="task-form" onSubmit={onSubmit}>
        <Field label="Title">
          <Input
            required
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="Enter task title"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Enter task description"
          />
        </Field>
        <div className="form-grid">
          <Field label="Status">
            <Input
              value={form.status}
              onChange={(e) => onChange("status", e.target.value)}
              placeholder="open"
            />
          </Field>
          <Field label="Created By ID">
            <Input
              required
              inputMode="numeric"
              value={form.createdById}
              onChange={(e) => onChange("createdById", e.target.value)}
              placeholder="1"
            />
          </Field>
          <Field label="Assigned To ID">
            <Input
              inputMode="numeric"
              value={form.assignedToId}
              onChange={(e) => onChange("assignedToId", e.target.value)}
              placeholder="2"
            />
          </Field>
        </div>
        {feedback && <FeedbackMessage feedback={feedback} />}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {isSubmitting ? "Creating..." : "Create task"}
        </Button>
      </form>
    </div>
  )
}

function ProfilePage({
  currentUser,
  density,
  onDensityChange,
  onLogin,
  onLogout,
}: {
  currentUser: CurrentUser | null
  density: number
  onDensityChange: (value: number) => void
  onLogin: () => void
  onLogout: () => void
}) {
  return (
    <div className="profile-layout">
      <section className="identity-panel">
        <UserCircle className="size-10" />
        <div>
          <h2>{currentUser?.email ?? "Guest"}</h2>
          <p>
            {currentUser
              ? `${currentUser.role} · User ${currentUser.id}`
              : "Login to access protected features"}
          </p>
        </div>
        <Button type="button" onClick={currentUser ? onLogout : onLogin}>
          {currentUser ? (
            <LogOut className="size-4" />
          ) : (
            <LogIn className="size-4" />
          )}
          {currentUser ? "Logout" : "Login"}
        </Button>
      </section>

      <section className="settings-panel">
        <h3>Layout Density</h3>
        <div className="density-control">
          <span>Compact</span>
          <Slider
            aria-label="Density"
            max={1.4}
            min={0.6}
            step={0.05}
            value={[density]}
            onValueChange={(value) => onDensityChange(value[0] ?? 1)}
          />
          <span>Spacious</span>
        </div>
        <p>
          <strong>{density.toFixed(2)}</strong>
        </p>
      </section>
    </div>
  )
}

function TaskTable({
  tasks,
  onEdit,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
}) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <ClipboardList className="size-5" />
        <p>No tasks found</p>
      </div>
    )
  }

  return (
    <div className="table-container">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.id}</TableCell>
              <TableCell>{task.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{task.status}</Badge>
              </TableCell>
              <TableCell>
                {task.priority && <Badge>{task.priority}</Badge>}
              </TableCell>
              <TableCell>{task.assigned_to_id || "-"}</TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => onEdit(task)}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function SearchBox({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (value: string) => void
}) {
  return (
    <label className="search-box">
      <Search className="size-4" />
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search tasks"
      />
    </label>
  )
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <label className="field-stack">
      <span>{label}</span>
      {children}
    </label>
  )
}

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  return (
    <div className={`feedback-message feedback-${feedback.type}`}>
      {feedback.message}
    </div>
  )
}

export default App
