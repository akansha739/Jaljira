import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
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
        label: "Active work",
        value: String(activeCount),
        detail: "Open or in progress",
        icon: Clock3,
      },
      {
        label: "Completed",
        value: String(completedCount),
        detail: "Done tasks",
        icon: CheckCircle2,
      },
      {
        label: "Waiting",
        value: String(Math.max(waitingCount, 0)),
        detail: "Todo and queued",
        icon: ClipboardList,
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

  const recentTasks = filteredTasks.slice(0, 4)
  const selectedTask = tasks.find((task) => String(task.id) === updateForm.taskId)

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
      setUpdateFormFromTask(createdTask)
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

      if (assignedTasks[0]) {
        setUpdateFormFromTask(assignedTasks[0])
      }
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
      setUpdateFormFromTask(updatedTask)
      setUpdateFeedback({
        type: "success",
        message: `Task "${updatedTask.title}" updated successfully.`,
      })
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

  function setUpdateFormFromTask(task: Task) {
    setUpdateForm({
      taskId: String(task.id),
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      assignedToId: task.assigned_to_id ? String(task.assigned_to_id) : "",
      updatedById: currentUser?.id ? String(currentUser.id) : "",
    })
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
    <div
      className="app-shell"
      style={{ "--p-density": density } as CSSProperties}
    >
      <aside className="app-sidebar">
        <div className="brand-block">
          <span className="brand-mark">J</span>
          <div>
            <p className="brand-title">Jaljira</p>
            <p className="brand-subtitle">Task operations</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <button
              className={`nav-link ${
                currentPage === item.page ? "nav-link-active" : ""
              }`}
              key={item.page}
              type="button"
              onClick={() => navigateTo(item.page)}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
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
        </div>
      </aside>

      <div className="app-workspace">
        <header className="mobile-nav">
          <div className="brand-block">
            <span className="brand-mark">J</span>
            <p className="brand-title">Jaljira</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigateTo(currentUser ? "profile" : "login")}
          >
            <UserCircle className="size-4" />
            Account
          </Button>
        </header>

        <main className="page-flow">
          <PageHeader
            currentUser={currentUser}
            page={currentPage}
            onCreate={() => navigateTo("create")}
            onLogin={() => navigateTo("login")}
          />

          {currentPage === "dashboard" ? (
            <DashboardPage
              filteredTasks={filteredTasks}
              query={query}
              recentTasks={recentTasks}
              stats={stats}
              tasks={tasks}
              onCreate={() => navigateTo("create")}
              onEdit={(task) => {
                setUpdateFormFromTask(task)
                navigateTo("tasks")
              }}
              onQueryChange={setQuery}
            />
          ) : null}

          {currentPage === "tasks" ? (
            <TasksPage
              assignedFeedback={assignedFeedback}
              assignedUserId={assignedUserId}
              filteredTasks={filteredTasks}
              isLoadingAssignedTasks={isLoadingAssignedTasks}
              isUpdatingTask={isUpdatingTask}
              query={query}
              selectedTask={selectedTask}
              updateFeedback={updateFeedback}
              updateForm={updateForm}
              onAssignedUserIdChange={setAssignedUserId}
              onLoadAssignedTasks={handleLoadAssignedTasks}
              onQueryChange={setQuery}
              onSelectTask={setUpdateFormFromTask}
              onUpdateFormChange={updateFormValue}
              onUpdateTask={handleUpdateTask}
            />
          ) : null}

          {currentPage === "create" ? (
            <CreateTaskPage
              feedback={feedback}
              form={form}
              isSubmitting={isSubmitting}
              onChange={updateCreateForm}
              onSubmit={handleSubmit}
            />
          ) : null}

          {currentPage === "profile" ? (
            <ProfilePage
              currentUser={currentUser}
              density={density}
              onDensityChange={setDensity}
              onLogin={() => navigateTo("login")}
              onLogout={handleLogout}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}

function PageHeader({
  currentUser,
  page,
  onCreate,
  onLogin,
}: {
  currentUser: CurrentUser | null
  page: AppPage
  onCreate: () => void
  onLogin: () => void
}) {
  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">{currentUser ? currentUser.role : "Guest"}</p>
        <h1>{pageLabels[page]}</h1>
        <p>
          {currentUser
            ? `Signed in as ${currentUser.email}`
            : "Sign in to sync task changes with the API."}
        </p>
      </div>
      <div className="header-actions">
        <Button type="button" variant="outline" onClick={onLogin}>
          <LogIn className="size-4" />
          Login
        </Button>
        <Button type="button" onClick={onCreate}>
          <Plus className="size-4" />
          New task
        </Button>
      </div>
    </section>
  )
}

function DashboardPage({
  filteredTasks,
  query,
  recentTasks,
  stats,
  tasks,
  onCreate,
  onEdit,
  onQueryChange,
}: {
  filteredTasks: Task[]
  query: string
  recentTasks: Task[]
  stats: Array<{
    label: string
    value: string
    detail: string
    icon: typeof Clock3
  }>
  tasks: Task[]
  onCreate: () => void
  onEdit: (task: Task) => void
  onQueryChange: (value: string) => void
}) {
  return (
    <div className="dashboard-layout">
      <section className="summary-panel">
        <div className="summary-copy">
          <Badge variant="secondary">{tasks.length} total tasks</Badge>
          <h2>Shape the queue before it shapes the day.</h2>
          <p>
            Keep the working set visible, pull assigned tasks from the API, and
            update ownership without burying the primary list under forms.
          </p>
        </div>
        <div className="summary-actions">
          <Button type="button" onClick={onCreate}>
            <Plus className="size-4" />
            Add task
          </Button>
        </div>
      </section>

      <section className="metrics-strip" aria-label="Task status summary">
        {stats.map((stat) => (
          <div className="metric-tile" key={stat.label}>
            <div>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </div>
            <stat.icon className="size-5" />
            <span>{stat.detail}</span>
          </div>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="task-section">
          <SectionHeading
            detail={`${filteredTasks.length} visible`}
            title="Recent tasks"
          />
          <SearchBox query={query} onQueryChange={onQueryChange} />
          <TaskList tasks={recentTasks} onEdit={onEdit} />
        </div>

        <div className="status-rail">
          <SectionHeading detail="By status" title="Flow" />
          {["Todo", "In Progress", "Done"].map((status) => (
            <div className="status-row" key={status}>
              <span>{status}</span>
              <strong>
                {
                  tasks.filter(
                    (task) => task.status.toLowerCase() === status.toLowerCase()
                  ).length
                }
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function TasksPage({
  assignedFeedback,
  assignedUserId,
  filteredTasks,
  isLoadingAssignedTasks,
  isUpdatingTask,
  query,
  selectedTask,
  updateFeedback,
  updateForm,
  onAssignedUserIdChange,
  onLoadAssignedTasks,
  onQueryChange,
  onSelectTask,
  onUpdateFormChange,
  onUpdateTask,
}: {
  assignedFeedback: Feedback | null
  assignedUserId: string
  filteredTasks: Task[]
  isLoadingAssignedTasks: boolean
  isUpdatingTask: boolean
  query: string
  selectedTask: Task | undefined
  updateFeedback: Feedback | null
  updateForm: UpdateTaskFormState
  onAssignedUserIdChange: (value: string) => void
  onLoadAssignedTasks: (event: FormEvent<HTMLFormElement>) => void
  onQueryChange: (value: string) => void
  onSelectTask: (task: Task) => void
  onUpdateFormChange: <K extends keyof UpdateTaskFormState>(
    key: K,
    value: UpdateTaskFormState[K]
  ) => void
  onUpdateTask: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="tasks-layout">
      <section className="task-section">
        <div className="section-toolbar">
          <SectionHeading
            detail={`${filteredTasks.length} matching`}
            title="Task queue"
          />
          <SearchBox query={query} onQueryChange={onQueryChange} />
        </div>
        <TaskList tasks={filteredTasks} onEdit={onSelectTask} />
      </section>

      <aside className="work-panel">
        <section className="panel-section">
          <SectionHeading detail="GET /tasks/assigned/{user_id}" title="Assigned" />
          <form className="compact-form" onSubmit={onLoadAssignedTasks}>
            <Field label="User ID">
              <Input
                required
                inputMode="numeric"
                value={assignedUserId}
                onChange={(event) =>
                  onAssignedUserIdChange(event.target.value)
                }
                placeholder="2"
              />
            </Field>
            {assignedFeedback ? (
              <FeedbackMessage feedback={assignedFeedback} />
            ) : null}
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
              {isLoadingAssignedTasks ? "Loading..." : "Load assigned"}
            </Button>
          </form>
        </section>

        <section className="panel-section">
          <SectionHeading
            detail={selectedTask ? `Task #${selectedTask.id}` : "Select a task"}
            title="Update"
          />
          <UpdateTaskForm
            feedback={updateFeedback}
            form={updateForm}
            isUpdatingTask={isUpdatingTask}
            onChange={onUpdateFormChange}
            onSubmit={onUpdateTask}
          />
        </section>
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
      <section className="form-intro">
        <Badge variant="secondary">POST /tasks</Badge>
        <h2>Give the task enough shape to move.</h2>
        <p>
          Keep creation focused: title and owner first, detail second. The form
          sits beside guidance instead of becoming another identical card.
        </p>
      </section>

      <form className="task-form" onSubmit={onSubmit}>
        <Field label="Title">
          <Input
            required
            value={form.title}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="Enter task title"
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Enter task description"
          />
        </Field>
        <div className="form-grid">
          <Field label="Status">
            <Input
              value={form.status}
              onChange={(event) => onChange("status", event.target.value)}
              placeholder="open"
            />
          </Field>
          <Field label="Created By ID">
            <Input
              required
              inputMode="numeric"
              value={form.createdById}
              onChange={(event) => onChange("createdById", event.target.value)}
              placeholder="1"
            />
          </Field>
          <Field label="Assigned To ID">
            <Input
              inputMode="numeric"
              value={form.assignedToId}
              onChange={(event) => onChange("assignedToId", event.target.value)}
              placeholder="2"
            />
          </Field>
        </div>
        {feedback ? <FeedbackMessage feedback={feedback} /> : null}
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
          <h2>{currentUser?.email ?? "Guest workspace"}</h2>
          <p>
            {currentUser
              ? `User ${currentUser.id} · ${currentUser.role}`
              : "Login to use protected task endpoints."}
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
        <SectionHeading
          detail="Live-mode density param"
          title="Layout density"
        />
        <div className="density-control">
          <span>Packed</span>
          <Slider
            aria-label="Density"
            max={1.4}
            min={0.6}
            step={0.05}
            value={[density]}
            onValueChange={(value) => onDensityChange(value[0] ?? 1)}
          />
          <span>Airy</span>
        </div>
        <p>
          Current density: <strong>{density.toFixed(2)}</strong>
        </p>
      </section>
    </div>
  )
}

function UpdateTaskForm({
  feedback,
  form,
  isUpdatingTask,
  onChange,
  onSubmit,
}: {
  feedback: Feedback | null
  form: UpdateTaskFormState
  isUpdatingTask: boolean
  onChange: <K extends keyof UpdateTaskFormState>(
    key: K,
    value: UpdateTaskFormState[K]
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="compact-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <Field label="Task ID">
          <Input
            required
            inputMode="numeric"
            value={form.taskId}
            onChange={(event) => onChange("taskId", event.target.value)}
            placeholder="1"
          />
        </Field>
        <Field label="Updated By ID">
          <Input
            required
            inputMode="numeric"
            value={form.updatedById}
            onChange={(event) => onChange("updatedById", event.target.value)}
            placeholder="1"
          />
        </Field>
      </div>
      <Field label="Title">
        <Input
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Updated title"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Updated description"
        />
      </Field>
      <div className="form-grid">
        <Field label="Status">
          <Input
            value={form.status}
            onChange={(event) => onChange("status", event.target.value)}
            placeholder="open"
          />
        </Field>
        <Field label="Assigned To ID">
          <Input
            inputMode="numeric"
            value={form.assignedToId}
            onChange={(event) => onChange("assignedToId", event.target.value)}
            placeholder="2"
          />
        </Field>
      </div>
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}
      <Button className="w-full" disabled={isUpdatingTask} type="submit">
        {isUpdatingTask ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {isUpdatingTask ? "Updating..." : "Update task"}
      </Button>
    </form>
  )
}

function TaskList({
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
        <p>No tasks match this view.</p>
      </div>
    )
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <article className="task-row" key={task.id}>
          <div className="task-main">
            <p>
              Task #{task.id}
              {task.assigned_to_id ? ` · assigned to ${task.assigned_to_id}` : ""}
              {task.created_by_id ? ` · created by ${task.created_by_id}` : ""}
            </p>
            <h2>{task.title}</h2>
            {task.description ? <span>{task.description}</span> : null}
          </div>
          <div className="task-meta">
            <Badge variant="secondary">{task.status}</Badge>
            {task.priority ? <Badge>{task.priority}</Badge> : null}
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => onEdit(task)}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          </div>
        </article>
      ))}
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
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search tasks"
      />
    </label>
  )
}

function SectionHeading({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  )
}

function Field({
  children,
  label,
}: {
  children: ReactNode
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
