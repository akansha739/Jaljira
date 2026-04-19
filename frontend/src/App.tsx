import { type FormEvent, useMemo, useState } from "react"
import { CheckCircle2, Clock3, FolderKanban, LoaderCircle, Plus } from "lucide-react"

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

type Task = {
  id: number | string
  title: string
  status: string
  priority: string
  description?: string | null
}

type TaskFormState = {
  title: string
  description: string
  status: string
  createdById: string
  assignedToId: string
}

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
).trim()

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

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [form, setForm] = useState<TaskFormState>({
    title: "",
    description: "",
    status: "open",
    createdById: "",
    assignedToId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
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

  function updateForm<K extends keyof TaskFormState>(
    key: K,
    value: TaskFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const response = await fetch(`${apiBaseUrl}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      setTasks((current) => [
        {
          id: payload.id,
          title: payload.title,
          status: payload.status,
          priority: "New",
          description: payload.description,
        },
        ...current,
      ])

      setForm({
        title: "",
        description: "",
        status: "open",
        createdById: "",
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

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Task Manager
            </h1>
          </div>
          <Button disabled>
            <Plus className="size-4" />
            Add Task
          </Button>
        </header>

        <section className="mb-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
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
                    onChange={(event) => updateForm("title", event.target.value)}
                    placeholder="Enter task title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Enter task description"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Input
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value)}
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
                        updateForm("createdById", event.target.value)
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
                        updateForm("assignedToId", event.target.value)
                      }
                      placeholder="2"
                    />
                  </div>
                </div>

                {feedback ? (
                  <div
                    className={`rounded-md border px-3 py-2 text-sm ${
                      feedback.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                    }`}
                  >
                    {feedback.message}
                  </div>
                ) : null}

                <Button className="w-full" disabled={isSubmitting} type="submit">
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
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>
                    New tasks created from the form will appear here.
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
                          {task.id}
                        </p>
                        <h2 className="text-base font-medium">{task.title}</h2>
                        {task.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{task.status}</Badge>
                        <Badge>{task.priority}</Badge>
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

export default App
