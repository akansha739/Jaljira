import { LoaderCircle, RefreshCw } from "lucide-react"

import { FeedbackMessage } from "@/components/tasks/feedback-message"
import { Field } from "@/components/tasks/field"
import { SearchBox } from "@/components/tasks/search-box"
import { TaskTable } from "@/components/tasks/task-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Feedback, Task, TaskFormSubmit } from "@/types/tasks"

export function TasksPage({
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
  onLoadAssignedTasks: TaskFormSubmit
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
              onChange={(event) => onAssignedUserIdChange(event.target.value)}
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
