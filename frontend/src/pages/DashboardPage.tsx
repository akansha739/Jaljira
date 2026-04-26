import { SearchBox } from "@/components/tasks/search-box"
import { TaskTable } from "@/components/tasks/task-table"
import type { Task } from "@/types/tasks"

export function DashboardPage({
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
