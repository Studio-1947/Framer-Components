import * as React from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
import ReactPlayer from "https://cdn.skypack.dev/react-player@2.16.0"

// Add proper types for TypeScript
interface Props {
    inputType: "File" | "Url"
    url: string
    urlInput: string
    poster: string
    autoPlay: boolean
    loop: boolean
    muted: boolean
    radius: number
    primaryColor: string
}

export default function MediaPlayer(props: Props) {
    const {
        inputType,
        url,
        urlInput,
        poster,
        autoPlay,
        loop,
        muted,
        radius,
        primaryColor,
    } = props

    const playerRef = React.useRef<ReactPlayer>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [playing, setPlaying] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [currentTime, setCurrentTime] = React.useState("0:00")
    const [duration, setDuration] = React.useState("0:00")
    const [isHovered, setIsHovered] = React.useState(false)
    const [volume, setVolume] = React.useState(muted ? 0 : 1)
    const [isMuted, setIsMuted] = React.useState(muted)
    const [isFullscreen, setIsFullscreen] = React.useState(false)

    // Determine effective URL
    const effectiveUrl = inputType === "File" ? url : urlInput

    // Handle initial props
    React.useEffect(() => {
        setIsMuted(muted)
        setVolume(muted ? 0 : 1)
    }, [muted])

    React.useEffect(() => {
        if (autoPlay && (RenderTarget.current() === RenderTarget.preview || RenderTarget.current() === RenderTarget.export)) {
            setPlaying(true)
        }
    }, [autoPlay])


    const togglePlay = () => {
        setPlaying(!playing)
    }

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60)
        const seconds = Math.floor(timeInSeconds % 60)
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
    }

    const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
        if (!playing && !isHovered) return // Optional optimization
        setProgress(state.played * 100)
        setCurrentTime(formatTime(state.playedSeconds))
    }

    const handleDuration = (duration: number) => {
        setDuration(formatTime(duration))
    }

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current) return
        const bounds = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - bounds.left
        const percentage = x / bounds.width
        playerRef.current.seekTo(percentage, "fraction")
        setProgress(percentage * 100) // Instant update
    }

    const toggleMute = () => {
        const newMute = !isMuted
        setIsMuted(newMute)
        setVolume(newMute ? 0 : 1)
    }

    const toggleFullscreen = () => {
        if (!containerRef.current) return
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch((err: any) => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`)
            })
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    React.useEffect(() => {
        const handleFSChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener("fullscreenchange", handleFSChange)
        return () => document.removeEventListener("fullscreenchange", handleFSChange)
    }, [])

    // Default placeholder
    if (!effectiveUrl) {
        return (
            <div style={{
                width: "100%", height: "100%", borderRadius: radius,
                backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#888", flexDirection: "column", gap: 10
            }}>
                <PlayIcon size={40} opacity={0.3} />
                <span>Select a video source</span>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                borderRadius: isFullscreen ? 0 : radius,
                overflow: "hidden",
                backgroundColor: "#000",
                fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <ReactPlayer
                ref={playerRef}
                url={effectiveUrl}
                playing={playing}
                loop={loop}
                muted={isMuted}
                volume={volume}
                width="100%"
                height="100%"
                style={{ objectFit: "cover" }}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onEnded={() => setPlaying(false)}
                onError={(e) => console.error("ReactPlayer Error:", e)}
                // Config for local files to accept poster
                config={{
                    file: {
                        attributes: {
                            poster: poster,
                            style: { objectFit: "cover", width: "100%", height: "100%" }
                        }
                    }
                }}
            />

            {/* Click overlay to toggle play (invisible) */}
            <div
                onClick={togglePlay}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
            />

            {/* Controls Overlay */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "20px",
                    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    opacity: isHovered || !playing ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: isHovered || !playing ? "auto" : "none",
                    zIndex: 2,
                }}
            >
                {/* Progress Bar */}
                <div
                    style={{
                        width: "100%",
                        height: "4px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: "2px",
                        cursor: "pointer",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                    }}
                    onClick={handleSeek}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${progress}%`,
                            backgroundColor: primaryColor,
                            borderRadius: "2px",
                            position: "relative",
                        }}
                    >
                        <div style={{
                            position: "absolute",
                            right: "-6px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            backgroundColor: "#fff",
                            boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                            opacity: isHovered ? 1 : 0,
                            transition: "opacity 0.2s",
                        }} />
                    </div>
                </div>

                {/* Bottom Row controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <button onClick={togglePlay} style={btnStyle}>
                            {playing ? <PauseIcon /> : <PlayIcon />}
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <button onClick={toggleMute} style={btnStyle}>
                                {isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
                            </button>
                        </div>

                        <span style={{ fontSize: "12px", fontWeight: 500, opacity: 0.9 }}>
                            {currentTime} / {duration}
                        </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <button onClick={toggleFullscreen} style={btnStyle}>
                            {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Play overlay when paused */}
            {!playing && (
                <div style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    zIndex: 1,
                }}>
                    <div style={{
                        width: "60px", height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(0,0,0,0.4)",
                        backdropFilter: "blur(10px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                        <PlayIcon size={24} />
                    </div>
                </div>
            )}
        </div>
    )
}

const btnStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    opacity: 0.9,
    transition: "opacity 0.2s",
}

/* Icons */
const PlayIcon = ({ size = 20, opacity = 1 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ opacity }}>
        <path d="M8 5v14l11-7z" />
    </svg>
)

const PauseIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
)

const VolumeIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
)

const MuteIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
)

const MaximizeIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
)

const MinimizeIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
    </svg>
)


MediaPlayer.defaultProps = {
    inputType: "File" as const,
    url: "",
    urlInput: "",
    autoPlay: false,
    loop: false,
    muted: false,
    radius: 12,
    primaryColor: "#0099ff",
}

addPropertyControls(MediaPlayer, {
    inputType: {
        title: "Input Type",
        type: ControlType.SegmentedEnum,
        options: ["File", "Url"],
        defaultValue: "File",
    },
    url: {
        title: "Source",
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov"],
        description: "Upload or select a video file",
        hidden: (props) => props.inputType === "Url",
    },
    urlInput: {
        title: "Url",
        type: ControlType.String,
        defaultValue: "",
        placeholder: "https://www.youtube.com/...",
        hidden: (props) => props.inputType === "File",
    },
    poster: {
        title: "Poster",
        type: ControlType.File,
        allowedFileTypes: ["png", "jpg", "jpeg", "webp"],
        description: "Thumbnail image",
    },
    autoPlay: {
        title: "Auto Play",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    loop: {
        title: "Loop",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    muted: {
        title: "Muted",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    radius: {
        title: "Radius",
        type: ControlType.Number,
        min: 0,
        max: 50,
        defaultValue: 12,
    },
    primaryColor: {
        title: "Accent",
        type: ControlType.Color,
        defaultValue: "#0099ff",
    },
})
