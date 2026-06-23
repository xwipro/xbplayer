import { useState, useRef, useEffect } from "react";
import XbIcon from "./xbicon";

/**
 * 设置全屏函数
 * @returns void
 */
const setFullScreen = () => {
    const fullscreenEl = document.fullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement;

    if (fullscreenEl) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
        } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
        }
    } else {
        const playerRoot = document.querySelector(".xbplayer-root") as HTMLElement;
        const target = playerRoot || document.documentElement;
        
        if (target.requestFullscreen) {
            target.requestFullscreen();
        } else if ((target as any).mozRequestFullScreen) {
            (target as any).mozRequestFullScreen();
        } else if ((target as any).webkitRequestFullScreen) {
            (target as any).webkitRequestFullScreen();
        } else if ((target as any).msRequestFullscreen) {
            (target as any).msRequestFullscreen();
        }
    }
}

/**
 * 包装 onClick 处理器，阻止事件冒泡
 * @param handler 原始处理器
 * @returns 包装后的处理器
 */
const stopPropagation = (handler: () => void) => {
    return (e: React.MouseEvent) => {
        e.stopPropagation();
        handler();
    };
}

type vidInfo = {
    currentTime: string
    duration: string
    currentPercent: number
    bufferedPercent: number
    isPlaying: boolean
}

interface videoControlProps {
    vidInfo: vidInfo
    togglePlay: () => void
    onSeek: (percent: number) => void
    onSeekStart?: () => void
    onSeekEnd?: () => void
    onVolumeChange?: (volume: number) => void
    onMutedChange?: (muted: boolean) => void
    onTogglePictureInPicture?: () => void
    visible?: boolean
    isLive?: boolean
}


const VOLUME_KEY = "xbplayer_volume";
const DEFAULT_VOLUME = 0.7;

function readVolumeFromStorage(): number {
    try {
        const raw = localStorage.getItem(VOLUME_KEY);
        if (raw === null) return DEFAULT_VOLUME;
        const n = parseFloat(raw);
        if (isNaN(n) || n < 0 || n > 1) return DEFAULT_VOLUME;
        return n;
    } catch {
        return DEFAULT_VOLUME;
    }
}

function writeVolumeToStorage(v: number) {
    try {
        localStorage.setItem(VOLUME_KEY, String(v));
    } catch { /* ignore */ }
}

export default function XbControl({vidInfo, togglePlay, onSeek, onSeekStart, onSeekEnd, onVolumeChange, onMutedChange, onTogglePictureInPicture, visible = true, isLive = false}: videoControlProps) {
    const [volume, setVolume] = useState(readVolumeFromStorage());
    const [lastVolume, setLastVolume] = useState(readVolumeFromStorage());
    const [isMuted, setIsMuted] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekingPercent, setSeekingPercent] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const progressRef = useRef<HTMLDivElement | null>(null);
    const volumeRef = useRef<HTMLDivElement | null>(null);
    const isDraggingRef = useRef(false);
    const isVolDraggingRef = useRef(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const displayPercent = isSeeking ? seekingPercent : vidInfo.currentPercent;
    const progressPercent = displayPercent * 100 + "%";
    const bufferedPercent = (vidInfo.bufferedPercent || 0) * 100 + "%";
    const displayVolume = isMuted ? 0 : volume;
    const displayVolumePercent = displayVolume * 100 + "%";

    const isVisible = visible && showControls;

    // 启动隐藏计时器
    const startHideTimer = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    // 清除隐藏计时器
    const clearHideTimer = () => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    };

    useEffect(() => {
        return () => clearHideTimer();
    }, []);

    const handleMouseMove = () => {
        setShowControls(true);
        startHideTimer();
    };

    const handleMouseLeave = () => {
        setShowControls(false);
        clearHideTimer();
    };

    const handleControlMouseEnter = () => {
        clearHideTimer();
    };

    const handleControlMouseLeave = () => {
        startHideTimer();
    };

    const calcPercent = (clientX: number): number => {
        const el = progressRef.current;
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const percent = (clientX - rect.left) / rect.width;
        return Math.min(Math.max(percent, 0), 1);
    };

    const calcVolumePercent = (clientX: number): number => {
        const el = volumeRef.current;
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const percent = (clientX - rect.left) / rect.width;
        return Math.min(Math.max(percent, 0), 1);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;
        setIsSeeking(true);
        if (onSeekStart) onSeekStart();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const percent = calcPercent(e.clientX);
        setSeekingPercent(percent);
        onSeek(percent);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        const percent = calcPercent(e.clientX);
        setSeekingPercent(percent);
        onSeek(percent);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        isDraggingRef.current = false;
        setIsSeeking(false);
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        if (onSeekEnd) onSeekEnd();
    };

    const applyVolume = (v: number) => {
        setVolume(v);
        writeVolumeToStorage(v);
        if (onVolumeChange) onVolumeChange(v);
    };

    const setMutedWithNotify = (muted: boolean) => {
        setIsMuted(muted);
        if (onMutedChange) onMutedChange(muted);
    };

    const handleVolDown = (e: React.PointerEvent<HTMLDivElement>) => {
        isVolDraggingRef.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const percent = calcVolumePercent(e.clientX);
        setMutedWithNotify(percent === 0);
        applyVolume(percent);
    };

    const handleVolMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isVolDraggingRef.current) return;
        const percent = calcVolumePercent(e.clientX);
        setMutedWithNotify(percent === 0);
        applyVolume(percent);
    };

    const handleVolUp = (e: React.PointerEvent<HTMLDivElement>) => {
        isVolDraggingRef.current = false;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const toggleMute = () => {
        if (isMuted) {
            const target = lastVolume > 0 ? lastVolume : readVolumeFromStorage();
            const next = target > 0 ? target : DEFAULT_VOLUME;
            setMutedWithNotify(false);
            applyVolume(next);
        } else {
            if (volume > 0) {
                setLastVolume(volume);
            }
            setMutedWithNotify(true);
        }
    };

    return (
        <div
            className="absolute inset-0 z-10"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={togglePlay}
        >
            {isLive && (
                <div className="absolute top-5 left-5 z-20 flex items-center gap-[.3rem] text-[.7rem] text-[var(--color-white)] whitespace-nowrap select-none tracking-widest">
                    <i className="block w-[.5rem] h-[.5rem] rounded-full bg-[var(--color-red)] animate-pulse"></i>
                    直播
                </div>
            )}
            <div
                className={`absolute bottom-0 left-0 w-full transition-transform duration-300 ease-in-out ${isVisible ? "translate-y-0" : "translate-y-full pointer-events-none"}`}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={handleControlMouseEnter}
                onMouseLeave={handleControlMouseLeave}
            >
                {!isLive && (
                    <div
                        className="xbplayer-wrap flex items-center h-[1rem] w-full group"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        <div ref={progressRef} className="w-full relative h-[.18rem] bg-[#ffffff33] mx-5">
                            <div className="absolute left-0 top-0 bottom-0 h-full bg-[#ffffff66] transition-all duration-500 ease" style={{width: bufferedPercent}}></div>
                            <div className="absolute left-0 top-0 bottom-0 h-full bg-[var(--color-primary)]" style={{ width: progressPercent }}>
                                <span className="block w-[.68rem] h-[.68rem] rounded-full absolute top-0 right-[.31rem] mt-[-.25rem] mr-[-.63rem] scale-0 transition-all duration-300 ease-in-out bg-[var(--color-primary)] group-hover:scale-100"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center w-full h-[3rem] px-5">
                    <div className="flex gap-4 items-center">
                        <XbIcon className="opacity-80 hover:opacity-100 transition-all duration-200 " size="1rem" color="var(--color-white)" name={vidInfo.isPlaying ? "pause" : "play"} onClick={togglePlay} />
                        <div className="flex items-center gap-3 group">
                            <XbIcon className="opacity-80 hover:opacity-100 transition-all duration-200 " size="1rem" color="var(--color-white)" name={(isMuted || volume === 0) ? "mute" : "volumn"} onClick={toggleMute} />
                            <div
                                ref={volumeRef}
                                className="w-0 h-[.18rem] relative group-hover:w-[2.8rem] bg-white/60 transition-all duration-300 ease-in-out"
                                onPointerDown={handleVolDown}
                                onPointerMove={handleVolMove}
                                onPointerUp={handleVolUp}
                                onPointerCancel={handleVolUp}
                            >
                                <div className="absolute left-0 top-0 bottom-0 h-full bg-[var(--color-primary)]" style={{ width: displayVolumePercent }}>
                                    <span className="block w-[.68rem] h-[.68rem] rounded-full absolute top-0 right-[.31rem] mt-[-.25rem] mr-[-.63rem] scale-0 transition-all duration-300 ease-in-out bg-[var(--color-primary)] group-hover:scale-100"></span>
                                </div>
                            </div>
                        </div>
                        {!isLive && (
                            <span className="xbplayer-time opacity-90 flex gap-2 whitespace-nowrap select-none text-sm text-[var(--color-white)] tracking-wider">
                                <span>{vidInfo.currentTime}</span>/
                                <span>{vidInfo.duration}</span>
                            </span>
                        )}
                    </div>
                    <span className="flex flex-1"></span>
                    <div className="flex items-center gap-5">
                        <XbIcon className="opacity-80 hover:opacity-100 transition-all duration-200 " size="1rem" color="var(--color-white)" name="setting" />
                        <XbIcon className="opacity-80 hover:opacity-100 transition-all duration-200 " size="1.3rem" color="var(--color-white)" name="picinpic" onClick={stopPropagation(() => onTogglePictureInPicture?.())} />
                        <XbIcon className="opacity-80 hover:opacity-100 transition-all duration-200 " size="1rem" color="var(--color-white)" name="fullscreen" onClick={stopPropagation(setFullScreen)} />
                    </div>
                </div>
            </div>
        </div>
    )
}