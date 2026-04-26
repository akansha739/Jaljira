import { ClipboardList, LayoutDashboard, LogIn, Plus, UserCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { AppPage, CurrentUser } from "@/types/tasks"

const navigationItems = [
  { page: "dashboard" as const, icon: LayoutDashboard, label: "Dashboard" },
  { page: "tasks" as const, icon: ClipboardList, label: "Tasks" },
  { page: "create" as const, icon: Plus, label: "New Task" },
  { page: "profile" as const, icon: UserCircle, label: "Profile" },
]

export function AppSidebar({
  currentPage,
  currentUser,
  onNavigate,
}: {
  currentPage: AppPage
  currentUser: CurrentUser | null
  onNavigate: (page: AppPage) => void
}) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="brand-block">
          <span className="brand-mark">J</span>
          <div>
            <p className="brand-title">Jaljira</p>
            <p className="brand-subtitle">Tasks</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => onNavigate(item.page)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {currentUser ? (
          <div className="user-summary">
            <span className="user-avatar">{currentUser.email.charAt(0)}</span>
            <div>
              <p>{currentUser.email}</p>
              <span>{currentUser.role}</span>
            </div>
          </div>
        ) : (
          <Button type="button" onClick={() => onNavigate("login")}>
            <LogIn className="size-4" />
            Login
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
