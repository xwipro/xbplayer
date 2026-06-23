import React, { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"

interface MessageProps {
  text: string
  type: "success" | "error"
  duration?: number
  onClose?: () => void
}

function Message({ text, type, duration = 3000, onClose }: MessageProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        onClose?.()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`fixed top-[15%] left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-md shadow-lg min-w-[280px] max-w-[500px] border ${
          type === "success"
            ? "bg-[var(--el-color-success-light-9)] border-[var(--el-color-success-light-6)]"
            : "bg-[var(--el-color-danger-light-9)] border-[var(--el-color-danger-light-6)]"
        }`}
      >
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
            type === "success"
              ? "bg-[var(--el-color-success)] text-white"
              : "bg-[var(--el-color-danger)] text-white"
          }`}
        >
          {type === "success" ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12l5 5L20 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
        <span className={`text-sm ${type === "success" ? "text-[var(--el-color-success)]" : "text-[var(--el-color-danger)]"}`}>{text}</span>
      </div>
    </div>
  )
}

interface ShowMessageOptions {
  text: string
  type: "success" | "error"
  duration?: number
}

let messageContainer: HTMLDivElement | null = null
let messageKey = 0

export function showMessage({ text, type, duration }: ShowMessageOptions) {
  if (!messageContainer) {
    messageContainer = document.createElement("div")
    messageContainer.id = "xbplayer-message-container"
    document.body.appendChild(messageContainer)
  }

  const key = messageKey++
  const container = messageContainer

  const handleClose = () => {
    const element = container.querySelector(`[data-message-key="${key}"]`)
    if (element) {
      element.remove()
    }
  }

  const wrapper = document.createElement("div")
  wrapper.setAttribute("data-message-key", String(key))

  const root = document.createElement("div")
  wrapper.appendChild(root)
  container.appendChild(wrapper)

  const reactRoot = createRoot(root)
  reactRoot.render(
    React.createElement(Message, { text, type, duration, onClose: handleClose })
  )
}

export default Message
