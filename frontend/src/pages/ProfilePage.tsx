import { LogIn, LogOut, UserCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { CurrentUser } from "@/types/tasks"

export function ProfilePage({
  currentUser,
  density,
  onDensityChange,
  onLogin,
  onLogout,
}: {
  currentUser: CurrentUser | null
  density: number
  onDensityChange: (value: number) => void
  onLogin: () => void
  onLogout: () => void
}) {
  return (
    <div className="profile-layout">
      <section className="identity-panel">
        <UserCircle className="size-10" />
        <div>
          <h2>{currentUser?.email ?? "Guest"}</h2>
          <p>
            {currentUser
              ? `${currentUser.role} · User ${currentUser.id}`
              : "Login to access protected features"}
          </p>
        </div>
        <Button type="button" onClick={currentUser ? onLogout : onLogin}>
          {currentUser ? (
            <LogOut className="size-4" />
          ) : (
            <LogIn className="size-4" />
          )}
          {currentUser ? "Logout" : "Login"}
        </Button>
      </section>

      <section className="settings-panel">
        <h3>Layout Density</h3>
        <div className="density-control">
          <span>Compact</span>
          <Slider
            aria-label="Density"
            max={1.4}
            min={0.6}
            step={0.05}
            value={[density]}
            onValueChange={(value) => onDensityChange(value[0] ?? 1)}
          />
          <span>Spacious</span>
        </div>
        <p>
          <strong>{density.toFixed(2)}</strong>
        </p>
      </section>
    </div>
  )
}
