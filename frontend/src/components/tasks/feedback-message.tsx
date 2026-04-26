import type { Feedback } from "@/types/tasks"

export function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  return (
    <div className={`feedback-message feedback-${feedback.type}`}>
      {feedback.message}
    </div>
  )
}
