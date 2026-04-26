import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { LoaderCircle, MessageCircle, Send, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getWebSocketUrl } from "@/lib/api"
import type { ChatMessage } from "@/types/tasks"

type ConnectionState = "idle" | "connecting" | "connected" | "closed"

export function TaskChat({ taskId }: { taskId: string }) {
  const connectionRef = useRef<WebSocket | null>(null)
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState("")

  const canConnect = useMemo(() => /^\d+$/.test(taskId), [taskId])

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token")
    let socket: WebSocket | null = null

    if (!accessToken || !canConnect) {
      window.setTimeout(() => setConnectionState("closed"), 0)
      return
    }

    const connectionTimer = window.setTimeout(() => {
      setConnectionState("connecting")
      setMessages([])

      socket = new WebSocket(
        getWebSocketUrl(
          `/ws/tasks/${taskId}/chat?token=${encodeURIComponent(accessToken)}`
        )
      )
      connectionRef.current = socket

      socket.onopen = () => setConnectionState("connected")
      socket.onclose = () => {
        if (connectionRef.current === socket) {
          setConnectionState("closed")
          connectionRef.current = null
        }
      }
      socket.onerror = () => setConnectionState("closed")
      socket.onmessage = (event) => {
        setMessages((current) => [...current, JSON.parse(event.data)])
      }
    }, 100)

    return () => {
      window.clearTimeout(connectionTimer)
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close()
      }
      if (connectionRef.current === socket) {
        connectionRef.current = null
      }
    }
  }, [canConnect, taskId])

  function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = messageText.trim()
    if (!content || connectionRef.current?.readyState !== WebSocket.OPEN) {
      return
    }

    connectionRef.current.send(JSON.stringify({ content }))
    setMessageText("")
  }

  return (
    <section className="task-chat">
      <div className="task-chat-header">
        <div>
          <h3>Task Chat</h3>
          <p>
            {connectionState === "connected"
              ? "Live connection active"
              : "Chat connects after login on saved API tasks"}
          </p>
        </div>
        {connectionState === "connecting" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : connectionState === "connected" ? (
          <MessageCircle className="size-4" />
        ) : (
          <WifiOff className="size-4" />
        )}
      </div>

      <div className="task-chat-messages" aria-live="polite">
        {messages.length ? (
          messages.map((message) => (
            <article className="task-chat-message" key={message.id}>
              <div>
                <strong>{message.author_email}</strong>
                <time dateTime={message.created_at}>
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p>{message.content}</p>
            </article>
          ))
        ) : (
          <div className="task-chat-empty">
            <MessageCircle className="size-4" />
            <span>No chat messages yet.</span>
          </div>
        )}
      </div>

      <form className="task-chat-form" onSubmit={handleSendMessage}>
        <Input
          disabled={connectionState !== "connected"}
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          placeholder="Write a message"
        />
        <Button
          disabled={connectionState !== "connected" || !messageText.trim()}
          size="icon"
          type="submit"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </section>
  )
}
