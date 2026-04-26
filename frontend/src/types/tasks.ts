import type { FormEvent } from "react"

export type AppPage = "dashboard" | "tasks" | "create" | "profile" | "login"

export type CurrentUser = {
  id: number
  email: string
  role: string
}

export type Task = {
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

export type TaskFormState = {
  title: string
  description: string
  status: string
  createdById: string
  assignedToId: string
}

export type UpdateTaskFormState = {
  taskId: string
  title: string
  description: string
  status: string
  assignedToId: string
  updatedById: string
}

export type Feedback = {
  type: "success" | "error"
  message: string
}

export type TaskFormSubmit = (event: FormEvent<HTMLFormElement>) => void
