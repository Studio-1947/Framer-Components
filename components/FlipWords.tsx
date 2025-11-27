import React, { useState, useEffect, useRef, useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"

// #region Type Definitions
interface FlipWordsProps {
    words: string[]
    duration: number
    textBefore?: string
    textAfter?: string
    styling: {
        font: {
            fontFamily: string
            fontWeight: string | number
            fontStyle: string
        }
        fontSize: number
        color: string
        backgroundColor: string
        lineHeight: number
        letterSpacing: number
        borderRadius: number
        padding: number
        margin: number
        enableMobileResponsive: boolean
        alignment: "left" | "center" | "right"
    }
    highlight: {
        enableHighlight: boolean
        highlightColor: string
        highlightFontWeight: string
        highlightFontSize: number
        highlightFontSizeMode?: "inherit" | "custom"
        highlightBackgroundColor: string
        highlightBorderRadius: number
        highlightPadding: number
        highlightMargin: number
    }
    animation: {
        animationType: "fade" | "slide" | "flip" | "bounce" | "scale" | "rotate" | "zoom" | "tilt"
        animationDuration: number
        animationEasing: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear"
        pauseOnHover: boolean
        randomOrder: boolean
    }
}
// #endregion

// #region Animation Keyframes
const getAnimationKeyframes = (animationType: string) => {
    switch (animationType) {
        case "fade":
            return `
                @keyframes flipWordsFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes flipWordsFadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-10px); }
                }
            `
        case "slide":
            return `
                @keyframes flipWordsSlideIn {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes flipWordsSlideOut {
                    from { opacity: 1; transform: translateX(0); }
                    to { opacity: 0; transform: translateX(-30px); }
                }
            `
        case "flip":
            return `
                @keyframes flipWordsFlipIn {
                    from { opacity: 0; transform: rotateX(90deg); }
                    to { opacity: 1; transform: rotateX(0deg); }
                }
                @keyframes flipWordsFlipOut {
                    from { opacity: 1; transform: rotateX(0deg); }
                    to { opacity: 0; transform: rotateX(-90deg); }
                }
            `
        case "bounce":
            return `
                @keyframes flipWordsBounceIn {
                    0% { opacity: 0; transform: scale(0.3) translateY(50px); }
                    50% { opacity: 1; transform: scale(1.05) translateY(-10px); }
                    70% { transform: scale(0.98) translateY(0); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes flipWordsBounceOut {
                    0% { opacity: 1; transform: scale(1) translateY(0); }
                    30% { transform: scale(1.05) translateY(-10px); }
                    100% { opacity: 0; transform: scale(0.3) translateY(50px); }
                }
            `
        case "scale":
            return `
                @keyframes flipWordsScaleIn {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes flipWordsScaleOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.5); }
                }
            `
        case "rotate":
            return `
                @keyframes flipWordsRotateIn {
                    from { opacity: 0; transform: rotateZ(-90deg); }
                    to { opacity: 1; transform: rotateZ(0deg); }
                }
                @keyframes flipWordsRotateOut {
                    from { opacity: 1; transform: rotateZ(0deg); }
                    to { opacity: 0; transform: rotateZ(90deg); }
                }
            `
        case "zoom":
            return `
                @keyframes flipWordsZoomIn {
                    from { opacity: 0; transform: scale(0.2); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes flipWordsZoomOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.2); }
                }
            `
        case "tilt":
            return `
                @keyframes flipWordsTiltIn {
                    from { opacity: 0; transform: translateY(10px) rotateZ(-10deg); }
                    to { opacity: 1; transform: translateY(0) rotateZ(0deg); }
                }
                @keyframes flipWordsTiltOut {
                    from { opacity: 1; transform: translateY(0) rotateZ(0deg); }
                    to { opacity: 0; transform: translateY(-10px) rotateZ(10deg); }
                }
            `
        default:
            return `
                @keyframes flipWordsFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes flipWordsFadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-10px); }
                }
            `
    }
}
// #endregion

export default function FlipWords(props: FlipWordsProps) {
    // #region State and Refs
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const componentRef = useRef<HTMLDivElement>(null)
    const [shuffledIndices, setShuffledIndices] = useState<number[]>([])
    // #endregion

    // Font resolution
    const font = props.styling.font || { fontFamily: "Inter", fontWeight: 600 }
    const resolvedFontFamily = font.fontFamily

    // Merge animation defaults with incoming props to ensure valid values when only type is set via controls
    const anim = {
        animationType: (props.animation?.animationType ?? "fade") as FlipWordsProps["animation"]["animationType"],
        animationDuration: props.animation?.animationDuration ?? 600,
        animationEasing: (props.animation?.animationEasing ?? "ease-in-out") as FlipWordsProps["animation"]["animationEasing"],
        pauseOnHover: props.animation?.pauseOnHover ?? true,
        randomOrder: props.animation?.randomOrder ?? false,
    }

    // #region Word Selection Logic
    const getNextWordIndex = useCallback(() => {
        if (anim.randomOrder) {
            if (shuffledIndices.length === 0 || shuffledIndices.length === 1) {
                // Create new shuffled array excluding current word to avoid immediate repeat
                const availableIndices = props.words
                    .map((_, i) => i)
                    .filter(i => i !== currentWordIndex)
                const newShuffled = [...availableIndices].sort(() => Math.random() - 0.5)
                setShuffledIndices(newShuffled)
                return newShuffled[0] || 0
            } else {
                // Use next from shuffled array
                const nextIndex = shuffledIndices[0]
                setShuffledIndices(prev => prev.slice(1))
                return nextIndex
            }
        } else {
            // Sequential order
            return (currentWordIndex + 1) % props.words.length
        }
    }, [currentWordIndex, props.words.length, anim.randomOrder, shuffledIndices])

    // #region Animation Control
    const startAnimation = useCallback(() => {
        if (props.words.length <= 1) return

        setIsAnimating(true)

        // Trigger exit animation
        setTimeout(() => {
            setCurrentWordIndex(getNextWordIndex())
            setIsAnimating(false)
        }, anim.animationDuration / 2)
    }, [getNextWordIndex, anim.animationDuration, props.words.length])

    // #region Interval Management
    useEffect(() => {
        if (props.words.length <= 1) return

        const startInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }

            intervalRef.current = setInterval(() => {
                if (!isPaused) {
                    startAnimation()
                }
            }, props.duration)
        }

        startInterval()

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [props.duration, isPaused, startAnimation, props.words.length])

    // Reset word index if words array changes
    useEffect(() => {
        if (currentWordIndex >= props.words.length) {
            setCurrentWordIndex(0)
        }
    }, [props.words.length, currentWordIndex])
    // #endregion

    // #region Handlers
    const handleMouseEnter = () => {
        if (anim.pauseOnHover) {
            setIsPaused(true)
        }
    }

    const handleMouseLeave = () => {
        if (anim.pauseOnHover) {
            setIsPaused(false)
        }
    }
    // #endregion

    // #region Styling
    const containerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: props.styling.alignment === "center" ? "center" : props.styling.alignment === "right" ? "flex-end" : "flex-start",
        width: "100%",
        height: "fit-content",
        fontFamily: resolvedFontFamily,
        fontSize: props.styling.fontSize,
        fontWeight: font.fontWeight,
        color: props.styling.color,
        backgroundColor: "transparent",
        lineHeight: props.styling.lineHeight,
        letterSpacing: props.styling.letterSpacing,
        borderRadius: 0,
        padding: 0,
        margin: 0,
        cursor: anim.pauseOnHover ? "pointer" : "default",
        overflow: "visible",
        position: "relative",
        textAlign: props.styling.alignment,
        boxSizing: "border-box",
    }

    const wordStyle: React.CSSProperties = {
        position: "relative",
        display: "inline-block",
        color: props.highlight.enableHighlight ? props.highlight.highlightColor : props.styling.color,
        fontWeight: props.highlight.enableHighlight
            ? (props.highlight.highlightFontWeight === "inherit" ? font.fontWeight : props.highlight.highlightFontWeight)
            : font.fontWeight,
        fontSize: props.highlight.enableHighlight
            ? (props.highlight.highlightFontSizeMode === "inherit" || props.highlight.highlightFontSizeMode === undefined
                ? props.styling.fontSize
                : props.highlight.highlightFontSize)
            : "inherit",
        backgroundColor: props.highlight.enableHighlight ? props.highlight.highlightBackgroundColor : "transparent",
        borderRadius: props.highlight.enableHighlight ? props.highlight.highlightBorderRadius : 0,
        padding: props.highlight.enableHighlight ? props.highlight.highlightPadding : 0,
        margin: props.highlight.enableHighlight ? props.highlight.highlightMargin : 0,
        animation: isAnimating
            ? `flipWords${anim.animationType === "fade" ? "Fade" :
                anim.animationType === "slide" ? "Slide" :
                    anim.animationType === "flip" ? "Flip" :
                        anim.animationType === "bounce" ? "Bounce" :
                            anim.animationType === "scale" ? "Scale" :
                                anim.animationType === "rotate" ? "Rotate" :
                                    anim.animationType === "zoom" ? "Zoom" :
                                        anim.animationType === "tilt" ? "Tilt" :
                                            "Fade"
            }Out ${anim.animationDuration / 2}ms ${anim.animationEasing} forwards`
            : `flipWords${anim.animationType === "fade" ? "Fade" :
                anim.animationType === "slide" ? "Slide" :
                    anim.animationType === "flip" ? "Flip" :
                        anim.animationType === "bounce" ? "Bounce" :
                            anim.animationType === "scale" ? "Scale" :
                                anim.animationType === "rotate" ? "Rotate" :
                                    anim.animationType === "zoom" ? "Zoom" :
                                        anim.animationType === "tilt" ? "Tilt" :
                                            "Fade"
            }In ${anim.animationDuration / 2}ms ${anim.animationEasing} forwards`,
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
    }
    // #endregion

    // #region Render
    const currentWord = props.words[currentWordIndex] || props.words[0] || "..."

    return (
        <>
            <style>
                {getAnimationKeyframes(anim.animationType)}
                {props.styling.enableMobileResponsive ? `
                    @media (max-width: 768px) {
                        .flip-words-mobile {
                            font-size: ${Math.max(12, props.styling.fontSize * 0.9)}px !important;
                            padding: 0px !important;
                            width: auto !important;
                            max-width: 100% !important;
                        }
                        .flip-words-mobile .flip-word {
                            font-size: inherit !important;
                        }
                    }
                ` : ''}
            </style>
            <div
                ref={componentRef}
                style={containerStyle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`flip-words-container ${props.styling.enableMobileResponsive ? 'flip-words-mobile' : ''}`}
                role="text"
                aria-live="polite"
                aria-label={`Text cycling through words: ${props.words.join(', ')}`}
            >
                {props.textBefore && (
                    <span style={{ marginRight: "0.25em" }}>
                        {props.textBefore}
                    </span>
                )}

                <span
                    style={wordStyle}
                    className="flip-word"
                    key={`${currentWordIndex}-${currentWord}`}
                >
                    {currentWord}
                </span>

                {props.textAfter && (
                    <span style={{ marginLeft: "0.25em" }}>
                        {props.textAfter}
                    </span>
                )}
            </div>
        </>
    )
    // #endregion
}

// #region Default Props
FlipWords.defaultProps = {
    words: ["amazing", "beautiful", "fantastic", "incredible"],
    duration: 2000,
    textBefore: "Build",
    textAfter: "websites",
    styling: {
        font: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontStyle: "normal",
        },
        fontSize: 24,
        color: "#FFFFFF",
        backgroundColor: "transparent",
        lineHeight: 1.2,
        letterSpacing: 0,
        borderRadius: 0,
        padding: 0,
        margin: 0,
        enableMobileResponsive: true,
        alignment: "left",
    },
    highlight: {
        enableHighlight: true,
        highlightColor: "#0066cc",
        highlightFontWeight: "inherit",
        highlightFontSize: 24,
        highlightFontSizeMode: "inherit",
        highlightBackgroundColor: "transparent",
        highlightBorderRadius: 0,
        highlightPadding: 0,
        highlightMargin: 0,
    },
    animation: {
        animationType: "fade",
        animationDuration: 600,
        animationEasing: "ease-in-out",
        pauseOnHover: true,
        randomOrder: false,
    },
} as Partial<FlipWordsProps>

FlipWords.displayName = "FlipWords"
// #endregion

// #region Framer Property Controls
addPropertyControls(FlipWords, {
    words: {
        type: ControlType.Array,
        title: "Words to Flip",
        control: {
            type: ControlType.String,
            title: "Word",
            placeholder: "Enter word"
        },
        defaultValue: ["amazing", "beautiful", "fantastic", "incredible"],
        maxCount: 20,
    },
    textBefore: {
        type: ControlType.String,
        title: "Text Before",
        placeholder: "Build",
        defaultValue: "Build",
    },
    textAfter: {
        type: ControlType.String,
        title: "Text After",
        placeholder: "websites",
        defaultValue: "websites",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        description: "Time each word is displayed (ms)",
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
        defaultValue: 2000,
    },
    styling: {
        type: ControlType.Object,
        title: "Styling",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 600,
                    systemFont: true,
                },
            },
            fontSize: {
                type: ControlType.Number,
                title: "Font Size",
                min: 12,
                max: 100,
                step: 1,
                unit: "px",
                defaultValue: 24,
            },
            color: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
            },
            // background disabled per request
            lineHeight: {
                type: ControlType.Number,
                title: "Line Height",
                min: 0.8,
                max: 3,
                step: 0.1,
                defaultValue: 1.2,
            },
            letterSpacing: {
                type: ControlType.Number,
                title: "Letter Spacing",
                min: -2,
                max: 10,
                step: 0.1,
                unit: "px",
                defaultValue: 0,
            },
            // borderRadius, padding, margin removed per request
            enableMobileResponsive: {
                type: ControlType.Boolean,
                title: "Mobile Responsive",
                defaultValue: true,
            },
            alignment: {
                type: ControlType.Enum,
                title: "Alignment",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
            },
        },
    },
    highlight: {
        type: ControlType.Object,
        title: "Highlight Settings",
        controls: {
            enableHighlight: {
                type: ControlType.Boolean,
                title: "Enable Highlight",
                enabledTitle: "Highlighted",
                disabledTitle: "Normal",
                defaultValue: true,
            },
            highlightColor: {
                type: ControlType.Color,
                title: "Highlight Color",
                defaultValue: "#0066cc",
                hidden(props: any) { return !props.highlight?.enableHighlight }
            },
            highlightFontWeight: {
                type: ControlType.Enum,
                title: "Highlight Font Weight",
                options: ["inherit", "300", "400", "500", "600", "700", "800", "900"],
                optionTitles: ["Inherit", "Light", "Normal", "Medium", "Semi-bold", "Bold", "Extra-bold", "Black"],
                defaultValue: "inherit",
                hidden(props: any) { return !props.highlight?.enableHighlight }
            },
            highlightFontSizeMode: {
                type: ControlType.Enum,
                title: "Highlight Size",
                options: ["inherit", "custom"],
                optionTitles: ["Inherit", "Custom"],
                defaultValue: "inherit",
                hidden(props: any) { return !props.highlight?.enableHighlight }
            },
            highlightFontSize: {
                type: ControlType.Number,
                title: "Highlight Font Size",
                min: 8,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 24,
                hidden(props: any) { return !props.highlight?.enableHighlight || props.highlight?.highlightFontSizeMode === "inherit" }
            },
            highlightBackgroundColor: {
                type: ControlType.Color,
                title: "Highlight Background",
                defaultValue: "rgba(255, 255, 255, 0)",
                hidden(props: any) { return !props.highlight?.enableHighlight }
            },
            highlightBorderRadius: {
                type: ControlType.Number,
                title: "Highlight Border Radius",
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                defaultValue: 0,
                hidden(props: any) { return !props.highlight?.enableHighlight }
            },
            highlightPadding: {
                type: ControlType.Number,
                title: "Highlight Padding",
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                defaultValue: 0,
                hidden(props: any) { return !props.highlight?.enableHighlight }
            },
            highlightMargin: {
                type: ControlType.Number,
                title: "Highlight Margin",
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                defaultValue: 0,
                hidden(props: any) { return !props.highlight?.enableHighlight }
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            animationType: {
                type: ControlType.Enum,
                title: "Animation Type",
                options: ["fade", "slide", "flip", "bounce", "scale", "rotate", "zoom", "tilt"],
                optionTitles: ["Fade", "Slide", "Flip", "Bounce", "Scale", "Rotate", "Zoom", "Tilt"],
                defaultValue: "fade",
            },
        },
    },
})
// #endregion
