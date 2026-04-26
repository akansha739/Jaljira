import { LoaderCircle, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Feedback, TaskFormSubmit, UpdateTaskFormState } from "@/types/tasks"
import { FeedbackMessage } from "./feedback-message"
import { Field } from "./field"
import { TaskChat } from "./task-chat"

export function EditTaskDialog({
  feedback,
  form,
  isOpen,
  isUpdating,
  onChange,
  onOpenChange,
  onSubmit,
}: {
  feedback: Feedback | null
  form: UpdateTaskFormState
  isOpen: boolean
  isUpdating: boolean
  onChange: <K extends keyof UpdateTaskFormState>(
    key: K,
    value: UpdateTaskFormState[K]
  ) => void
  onOpenChange: (open: boolean) => void
  onSubmit: TaskFormSubmit
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task #{form.taskId}</DialogDescription>
        </DialogHeader>
        <form className="compact-form" onSubmit={onSubmit}>
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(event) => onChange("title", event.target.value)}
              placeholder="Task title"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Task description"
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
            <Field label="Assigned To">
              <Input
                inputMode="numeric"
                value={form.assignedToId}
                onChange={(event) => onChange("assignedToId", event.target.value)}
                placeholder="User ID"
              />
            </Field>
          </div>
          {feedback && <FeedbackMessage feedback={feedback} />}
          <Button className="w-full" disabled={isUpdating} type="submit">
            {isUpdating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isUpdating ? "Updating..." : "Update task"}
          </Button>
        </form>
        {form.taskId ? <TaskChat taskId={form.taskId} /> : null}
      </DialogContent>
    </Dialog>
  )
}
