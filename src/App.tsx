import XbControl from "./components/xbcontrol"
import { showMessage } from "./components/message"
import { useEffect, useMemo, useRef, useState } from "react"
import Hls from "hls.js"
import FlvJs from "flv.js"

interface AppProps {
  v_url?: string
  isLive?: boolean
}

const DEFAULT_SRC = ""

function isM3u8(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url)
}

function isFlv(url: string): boolean {
  return /\.flv(\?|$)/i.test(url)
}

function formatVideoTime(seconds: number): string {
  if(isNaN(seconds) || seconds <= 0) return "00:00"
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (num: number) => num.toString().padStart(2, "0")
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
  return `${pad(minutes)}:${pad(secs)}`
}

function readInitialVolume(): number {
  try {
    const raw = localStorage.getItem("xbplayer_volume");
    if (raw === null) return 0.7;
    const n = parseFloat(raw);
    if (isNaN(n) || n < 0 || n > 1) return 0.7;
    return n;
  } catch {
    return 0.7;
  }
}

export default function App({ v_url, isLive = false }: AppProps) {
  const src = v_url && v_url.trim() !== "" ? v_url : DEFAULT_SRC

  const vidRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const flvRef = useRef<FlvJs.Player | null>(null)
  const isSeekingRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  const VidInfo = useMemo(() => ({
    currentTime: formatVideoTime(currentTime),
    duration: formatVideoTime(duration),
    currentPercent: duration ? currentTime / duration : 0,
    bufferedPercent: duration ? bufferedEnd / duration : 0,
    isPlaying: isPlaying,
  }), [currentTime, duration, bufferedEnd, isPlaying])

  const seekTo = (percent: number) => {
    const video = vidRef.current
    if (!video || !video.duration) return
    const clamped = Math.min(Math.max(percent, 0), 1)
    video.currentTime = clamped * video.duration
    setCurrentTime(video.currentTime)
  }

  const onSeekStart = () => {
    isSeekingRef.current = true
  }

  const onSeekEnd = () => {
    isSeekingRef.current = false
  }

  const onVolumeChange = (volume: number) => {
    const video = vidRef.current
    if (video) video.volume = Math.min(Math.max(volume, 0), 1)
  }

  const onMutedChange = (muted: boolean) => {
    const video = vidRef.current
    if (video) video.muted = muted
  }

  const togglePlay = () => {
    const video = vidRef.current
    if (!video) return
    try {
      if (video.paused) {
        video.play().catch(() => {
          showMessage({ text: "播放失败", type: "error", duration: 3000 })
        })
      } else {
        video.pause()
      }
    } catch {
      showMessage({ text: "播放失败", type: "error", duration: 3000 })
    }
  }

  const togglePictureInPicture = async () => {
    const video = vidRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        if (video.readyState < 2) {
          video.load()
        }
        await video.requestPictureInPicture()
      } else {
        showMessage({ text: "画中画不支持", type: "error", duration: 3000 })
      }
    } catch {
      showMessage({ text: "画中画失败", type: "error", duration: 3000 })
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return
      }
      e.preventDefault()
      togglePlay()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (!vidRef) return
    const video = vidRef.current
    if (!video) return

    video.volume = readInitialVolume()
    video.muted = false

    let destroySource: (() => void) | null = null
    const isM3u8Source = isM3u8(src)
    const isFlvSource = isFlv(src)
    const canNativePlay = video.canPlayType("application/vnd.apple.mpegurl") !== ""

    if (isFlvSource && FlvJs.isSupported()) {
      const flvPlayer = FlvJs.createPlayer({
        type: "flv",
        url: src,
      })
      flvRef.current = flvPlayer
      flvPlayer.attachMediaElement(video)
      flvPlayer.load()

      destroySource = () => {
        flvPlayer.pause()
        flvPlayer.unload()
        flvPlayer.detachMediaElement()
        flvPlayer.destroy()
      }
    } else if (isM3u8Source && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)

      destroySource = () => {
        hls.stopLoad()
        hls.detachMedia()
        hls.destroy()
      }
    } else if (isM3u8Source && canNativePlay) {
      video.src = src
      destroySource = () => {
        video.removeAttribute("src")
        video.load()
      }
    } else {
      video.src = src
      destroySource = () => {
        video.removeAttribute("src")
        video.load()
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      if (isSeekingRef.current) return
      setCurrentTime(video.currentTime)
    }

    const handleProgress = () => {
      if (video.buffered.length > 0 && video.duration) {
        setBufferedEnd(video.buffered.end(video.buffered.length - 1))
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = () => {
      setIsLoaded(false)
      showMessage({ text: "加载失败", type: "error", duration: 3000 })
    }
    const handleLoadedData = () => {
      setIsLoaded(true)
      showMessage({ text: "加载成功", type: "success", duration: 2000 })
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("progress", handleProgress)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("error", handleError)
    video.addEventListener("loadeddata", handleLoadedData)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("progress", handleProgress)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("error", handleError)
      video.removeEventListener("loadeddata", handleLoadedData)
      if (destroySource) destroySource()
      if (hlsRef.current) {
        hlsRef.current = null
      }
      if (flvRef.current) {
        flvRef.current = null
      }
    }
  }, [src])

  return (
    <div className="w-full h-full relative xbplayer-root bg-black">
      <video ref={vidRef} className="w-full h-full object-cover"></video>
      <div className="absolute z-10 w-full h-full top-0 left-0" onClick={togglePlay}>
        <div onClick={(e) => e.stopPropagation()}>
          <XbControl
            vidInfo={VidInfo}
            togglePlay={togglePlay}
            onSeek={seekTo}
            onSeekStart={onSeekStart}
            onSeekEnd={onSeekEnd}
            onVolumeChange={onVolumeChange}
            onMutedChange={onMutedChange}
            onTogglePictureInPicture={togglePictureInPicture}
            isLive={isLive}
            visible={isLoaded}
          />
        </div>
      </div>
    </div>
  )
}
