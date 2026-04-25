import { type FormEvent, useState } from "react"
import { ArrowLeft, LoaderCircle, LogIn, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiRequest } from "@/lib/api"

type AuthMode = "login" | "register"

type AuthFormState = {
  email: string
  password: string
  role: string
}

type LoginPageProps = {
  onAuthenticated: () => void
  onBackToTasks: () => void
}

function LoginPage({ onAuthenticated, onBackToTasks }: LoginPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [authForm, setAuthForm] = useState<AuthFormState>({
    email: "",
    password: "",
    role: "developer",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  function updateAuthForm<K extends keyof AuthFormState>(
    key: K,
    value: AuthFormState[K]
  ) {
    setAuthForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function switchAuthMode(mode: AuthMode) {
    setAuthMode(mode)
    setFeedback(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    setIsSubmitting(true)

    try {
      const endpoint =
        authMode === "register" ? "/users/register" : "/users/login"
      const response = await apiRequest(endpoint, {
        auth: false,
        method: "POST",
        body: JSON.stringify(
          authMode === "register"
            ? {
                email: authForm.email,
                password_hash: authForm.password,
                role: authForm.role,
              }
            : {
                email: authForm.email,
                password: authForm.password,
              }
        ),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          payload?.detail ||
            (authMode === "register" ? "Failed to register user" : "Login failed")
        )
      }

      if (authMode === "login") {
        localStorage.setItem("access_token", payload.access_token)
        localStorage.setItem("current_user", JSON.stringify(payload.user))
        onAuthenticated()
        return
      }

      setAuthForm((current) => ({
        ...current,
        password: "",
      }))
      setAuthMode("login")
      setFeedback({
        type: "success",
        message: payload?.message || "User registered successfully. Please login.",
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
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-8">
        <Button
          className="mb-6 w-fit"
          type="button"
          variant="ghost"
          onClick={onBackToTasks}
        >
          <ArrowLeft className="size-4" />
          Task Manager
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{authMode === "register" ? "Register" : "Login"}</CardTitle>
            <CardDescription>
              {authMode === "register"
                ? "Create your account to start using the task manager."
                : "Sign in to continue to your tasks."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-2 rounded-md border p-1">
              <Button
                type="button"
                variant={authMode === "login" ? "default" : "ghost"}
                onClick={() => switchAuthMode("login")}
              >
                <LogIn className="size-4" />
                Login
              </Button>
              <Button
                type="button"
                variant={authMode === "register" ? "default" : "ghost"}
                onClick={() => switchAuthMode("register")}
              >
                <UserPlus className="size-4" />
                Register
              </Button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  required
                  type="email"
                  value={authForm.email}
                  onChange={(event) =>
                    updateAuthForm("email", event.target.value)
                  }
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  required
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    updateAuthForm("password", event.target.value)
                  }
                  placeholder="Enter password"
                />
              </div>

              {authMode === "register" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input
                    value={authForm.role}
                    onChange={(event) =>
                      updateAuthForm("role", event.target.value)
                    }
                    placeholder="developer"
                  />
                </div>
              ) : null}

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
                ) : authMode === "register" ? (
                  <UserPlus className="size-4" />
                ) : (
                  <LogIn className="size-4" />
                )}
                {isSubmitting
                  ? "Submitting..."
                  : authMode === "register"
                    ? "Register"
                    : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
