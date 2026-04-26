import { LogIn, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { pageLabels } from "@/lib/tasks"
import type { AppPage, CurrentUser } from "@/types/tasks"

export function PageHeader({
  currentPage,
  currentUser,
  onNavigate,
}: {
  currentPage: AppPage
  currentUser: CurrentUser | null
  onNavigate: (page: AppPage) => void
}) {
  return (
    <header className="page-header">
      <h1>{pageLabels[currentPage]}</h1>
      <div className="header-actions">
        {!currentUser && (
          <Button type="button" variant="outline" onClick={() => onNavigate("login")}>
            <LogIn className="size-4" />
            Login
          </Button>
        )}
        <Button type="button" onClick={() => onNavigate("create")}>
          <Plus className="size-4" />
          New task
        </Button>
      </div>
    </header>
  )
}
