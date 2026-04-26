import { LoaderCircle, Plus } from "lucide-react"

import { FeedbackMessage } from "@/components/tasks/feedback-message"
import { Field } from "@/components/tasks/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Feedback, TaskFormState, TaskFormSubmit } from "@/types/tasks"

export function CreateTaskPage({
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
  onSubmit: TaskFormSubmit
}) {
  return (
    <div className="create-layout">
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
