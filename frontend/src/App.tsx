import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from "react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog"
import LoginPage from "@/pages/LoginPage"
import { SidebarProvider } from "@/components/ui/sidebar"
import { apiRequest } from "@/lib/api"
import {
  emptyUpdateForm,
  getPageFromPath,
  getStoredUser,
  initialTasks,
  normalizeTask,
  pagePaths,
} from "@/lib/tasks"
import { CreateTaskPage } from "@/pages/CreateTaskPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { TasksPage } from "@/pages/TasksPage"
import type {
  AppPage,
  CurrentUser,
  Feedback,
  Task,
  TaskFormState,
  UpdateTaskFormState,
} from "@/types/tasks"

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
        <AppSidebar
          currentPage={currentPage}
          currentUser={currentUser}
          onNavigate={navigateTo}
        />

        <main className="page-flow">
          <PageHeader
            currentPage={currentPage}
            currentUser={currentUser}
            onNavigate={navigateTo}
          />

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

        <EditTaskDialog
          feedback={updateFeedback}
          form={updateForm}
          isOpen={editDialogOpen}
          isUpdating={isUpdatingTask}
          onChange={updateFormValue}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleUpdateTask}
        />
      </div>
    </SidebarProvider>
  )
}

export default App
