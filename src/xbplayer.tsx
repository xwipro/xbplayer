import { createRoot, type Root } from "react-dom/client"
import App from "./App"
import "./index.css"

export interface XbPlayerOptions {
  container?: string | HTMLElement
  src?: string
  isLive?: boolean
}

export class XbPlayer {
  private _root: Root | null = null
  private _container: HTMLElement | null = null
  private _src: string = ""
  private _isLive: boolean = false
  private _destroyed = false

  constructor(options?: XbPlayerOptions) {
    const { container, src, isLive } = options || {}

    if (typeof container === "string") {
      this._container = document.querySelector<HTMLElement>(container) || null
      if (!this._container) {
        console.warn(`[XbPlayer] 未找到容器: ${container}`)
      }
    } else if (container instanceof HTMLElement) {
      this._container = container
    }

    if (!this._container) {
      this._container = document.createElement("div")
      this._container.style.width = "100%"
      this._container.style.height = "100%"
      document.body.appendChild(this._container)
    }

    this._root = createRoot(this._container)

    if (src) {
      this._src = src
    }

    if (isLive) {
      this._isLive = isLive
    }

    this._render()
  }

  private _render() {
    if (!this._root || this._destroyed) return
    this._root.render(<App v_url={this._src} isLive={this._isLive} />)
  }

  get src(): string {
    return this._src
  }

  set src(url: string) {
    this._src = url || ""
    this._render()
  }

  get isLive(): boolean {
    return this._isLive
  }

  set isLive(value: boolean) {
    this._isLive = value
    this._render()
  }

  destroy() {
    if (this._destroyed) return
    this._destroyed = true
    this._root?.unmount()
    this._root = null
    this._container = null
  }
}

if (typeof window !== "undefined") {
  (window as any).XbPlayer = XbPlayer
}
