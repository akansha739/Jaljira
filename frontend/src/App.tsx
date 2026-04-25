import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  LoaderCircle,
  LogIn,
  Pencil,
  Plus,
  RefreshCw,
  Save,
} from "lucide-react"

import LoginPage from "@/pages/LoginPage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiRequest } from "@/lib/api"

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
  const [currentPage, setCurrentPage] = useState<"tasks" | "login">(() =>
    window.location.pathname === "/login" ? "login" : "tasks"
  )
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
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [assignedFeedback, setAssignedFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [updateFeedback, setUpdateFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const stats = useMemo(() => {
    const completedCount = tasks.filter((task) =>
      ["done", "completed"].includes(task.status.toLowerCase())
    ).length
    const inProgressCount = tasks.filter((task) =>
      ["in progress", "in_progress", "open", "working"].includes(
        task.status.toLowerCase()
      )
    ).length

    return [
      { label: "Total Tasks", value: String(tasks.length) },
      { label: "In Progress", value: String(inProgressCount) },
      { label: "Completed", value: String(completedCount) },
    ]
  }, [tasks])

  useEffect(() => {
    function handlePopState() {
      setCurrentPage(window.location.pathname === "/login" ? "login" : "tasks")
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  function navigateTo(page: "tasks" | "login") {
    const path = page === "login" ? "/login" : "/"
    window.history.pushState(null, "", path)
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

    navigateTo("tasks")
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
        onBackToTasks={() => navigateTo("tasks")}
      />
    )
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Task Manager
            </h1>
            {currentUser ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Logged in as {currentUser.email} · user id {currentUser.id}
              </p>
            ) : null}
          </div>
          <Button type="button" onClick={() => navigateTo("login")}>
            <LogIn className="size-4" />
            Login / Register
          </Button>
        </header>

        <section className="mb-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Task</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      required
                      value={form.title}
                      onChange={(event) =>
                        updateCreateForm("title", event.target.value)
                      }
                      placeholder="Enter task title"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={form.description}
                      onChange={(event) =>
                        updateCreateForm("description", event.target.value)
                      }
                      placeholder="Enter task description"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Input
                      value={form.status}
                      onChange={(event) =>
                        updateCreateForm("status", event.target.value)
                      }
                      placeholder="open"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Created By ID</label>
                      <Input
                        required
                        inputMode="numeric"
                        value={form.createdById}
                        onChange={(event) =>
                          updateCreateForm("createdById", event.target.value)
                        }
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assigned To ID</label>
                      <Input
                        inputMode="numeric"
                        value={form.assignedToId}
                        onChange={(event) =>
                          updateCreateForm("assignedToId", event.target.value)
                        }
                        placeholder="2"
                      />
                    </div>
                  </div>

                  {feedback ? <FeedbackMessage feedback={feedback} /> : null}

                  <Button
                    className="w-full"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {isSubmitting ? "Creating..." : "Create Task"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Tasks</CardTitle>
                <CardDescription>
                  Uses GET /tasks/assigned/{"{user_id}"}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleLoadAssignedTasks}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User ID</label>
                    <Input
                      required
                      inputMode="numeric"
                      value={assignedUserId}
                      onChange={(event) => setAssignedUserId(event.target.value)}
                      placeholder="2"
                    />
                  </div>

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
                    {isLoadingAssignedTasks ? "Loading..." : "Load Assigned"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update Task</CardTitle>
                <CardDescription>Only creator or assignee can update.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleUpdateTask}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Task ID</label>
                      <Input
                        required
                        inputMode="numeric"
                        value={updateForm.taskId}
                        onChange={(event) =>
                          updateFormValue("taskId", event.target.value)
                        }
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Updated By ID</label>
                      <Input
                        required
                        inputMode="numeric"
                        value={updateForm.updatedById}
                        onChange={(event) =>
                          updateFormValue("updatedById", event.target.value)
                        }
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={updateForm.title}
                      onChange={(event) =>
                        updateFormValue("title", event.target.value)
                      }
                      placeholder="Updated title"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={updateForm.description}
                      onChange={(event) =>
                        updateFormValue("description", event.target.value)
                      }
                      placeholder="Updated description"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Input
                        value={updateForm.status}
                        onChange={(event) =>
                          updateFormValue("status", event.target.value)
                        }
                        placeholder="open"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assigned To ID</label>
                      <Input
                        inputMode="numeric"
                        value={updateForm.assignedToId}
                        onChange={(event) =>
                          updateFormValue("assignedToId", event.target.value)
                        }
                        placeholder="2"
                      />
                    </div>
                  </div>

                  {updateFeedback ? (
                    <FeedbackMessage feedback={updateFeedback} />
                  ) : null}

                  <Button
                    className="w-full"
                    disabled={isUpdatingTask}
                    type="submit"
                  >
                    {isUpdatingTask ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {isUpdatingTask ? "Updating..." : "Update Task"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="mb-6">
              <Input className="max-w-md" placeholder="Search tasks..." />
            </div>

            <section className="mb-8 grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium">
                      {stat.label}
                    </CardTitle>
                    {stat.label === "Total Tasks" ? (
                      <FolderKanban className="size-4 text-muted-foreground" />
                    ) : stat.label === "In Progress" ? (
                      <Clock3 className="size-4 text-muted-foreground" />
                    ) : (
                      <CheckCircle2 className="size-4 text-muted-foreground" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    Load assigned tasks, then choose one to update.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Task #{task.id}
                          {task.assigned_to_id
                            ? ` · assigned to ${task.assigned_to_id}`
                            : ""}
                          {task.created_by_id
                            ? ` · created by ${task.created_by_id}`
                            : ""}
                        </p>
                        <h2 className="text-base font-medium">{task.title}</h2>
                        {task.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{task.status}</Badge>
                        {task.priority ? <Badge>{task.priority}</Badge> : null}
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => setUpdateFormFromTask(task)}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </div>
        </section>
      </div>
    </div>
  )
}

function FeedbackMessage({
  feedback,
}: {
  feedback: { type: "success" | "error"; message: string }
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        feedback.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
      }`}
    >
      {feedback.message}
    </div>
  )
}

export default App
