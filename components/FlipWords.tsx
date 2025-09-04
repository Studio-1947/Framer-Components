import React, { useState, useEffect, useRef, useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"

// #region Type Definitions
interface FlipWordsProps {
    words: string[]
    duration: number
    className?: string
    textBefore?: string
    textAfter?: string
    styling: {
        useProjectFonts: boolean
        fontFamily: string
        fontSize: number
        fontWeight: string
        color: string
        backgroundColor: string
        lineHeight: number
        letterSpacing: number
        textAlign: "left" | "center" | "right"
        width: number
        height: number
        borderRadius: number
        padding: number
        margin: number
        enableMobileResponsive: boolean
    }
    highlight: {
        enableHighlight: boolean
        highlightColor: string
        highlightFontWeight: string
        highlightFontSize: number
        highlightBackgroundColor: string
        highlightBorderRadius: number
        highlightPadding: number
        highlightMargin: number
    }
    animation: {
        animationType: "fade" | "slide" | "flip" | "bounce" | "scale"
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

    // Font resolution following the Framer project guidelines
    const resolvedFontFamily = props.styling.useProjectFonts ? "inherit" : props.styling.fontFamily

    // #region Word Selection Logic
    const getNextWordIndex = useCallback(() => {
        if (props.animation.randomOrder) {
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
    }, [currentWordIndex, props.words.length, props.animation.randomOrder, shuffledIndices])

    // #region Animation Control
    const startAnimation = useCallback(() => {
        if (props.words.length <= 1) return

        setIsAnimating(true)
        
        // Trigger exit animation
        setTimeout(() => {
            setCurrentWordIndex(getNextWordIndex())
            setIsAnimating(false)
        }, props.animation.animationDuration / 2)
    }, [getNextWordIndex, props.animation.animationDuration, props.words.length])

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
        if (props.animation.pauseOnHover) {
            setIsPaused(true)
        }
    }

    const handleMouseLeave = () => {
        if (props.animation.pauseOnHover) {
            setIsPaused(false)
        }
    }
    // #endregion

    // #region Styling
    const containerStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: props.styling.textAlign === "center" ? "center" : 
                       props.styling.textAlign === "right" ? "flex-end" : "flex-start",
        width: props.styling.width,
        height: props.styling.height,
        fontFamily: resolvedFontFamily,
        fontSize: props.styling.fontSize,
        fontWeight: props.styling.fontWeight,
        color: props.styling.color,
        backgroundColor: props.styling.backgroundColor,
        lineHeight: props.styling.lineHeight,
        letterSpacing: props.styling.letterSpacing,
        borderRadius: props.styling.borderRadius,
        padding: props.styling.padding,
        margin: props.styling.margin,
        cursor: props.animation.pauseOnHover ? "pointer" : "default",
        overflow: "hidden",
        position: "relative",
        textAlign: props.styling.textAlign,
        boxSizing: "border-box",
    }

    const wordStyle: React.CSSProperties = {
        position: "relative",
        display: "inline-block",
        color: props.highlight.enableHighlight ? props.highlight.highlightColor : props.styling.color,
        fontWeight: props.highlight.enableHighlight ? props.highlight.highlightFontWeight : "inherit",
        fontSize: props.highlight.enableHighlight ? props.highlight.highlightFontSize : "inherit",
        backgroundColor: props.highlight.enableHighlight ? props.highlight.highlightBackgroundColor : "transparent",
        borderRadius: props.highlight.enableHighlight ? props.highlight.highlightBorderRadius : 0,
        padding: props.highlight.enableHighlight ? props.highlight.highlightPadding : 0,
        margin: props.highlight.enableHighlight ? props.highlight.highlightMargin : 0,
        animation: isAnimating 
            ? `flipWords${props.animation.animationType === "fade" ? "Fade" : 
                         props.animation.animationType === "slide" ? "Slide" : 
                         props.animation.animationType === "flip" ? "Flip" : 
                         props.animation.animationType === "bounce" ? "Bounce" : 
                         "Scale"}Out ${props.animation.animationDuration / 2}ms ${props.animation.animationEasing} forwards`
            : `flipWords${props.animation.animationType === "fade" ? "Fade" : 
                         props.animation.animationType === "slide" ? "Slide" : 
                         props.animation.animationType === "flip" ? "Flip" : 
                         props.animation.animationType === "bounce" ? "Bounce" : 
                         "Scale"}In ${props.animation.animationDuration / 2}ms ${props.animation.animationEasing} forwards`,
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
    }
    // #endregion

    // #region Render
    const currentWord = props.words[currentWordIndex] || props.words[0] || "..."

    return (
        <>
            <style>
                {getAnimationKeyframes(props.animation.animationType)}
                {props.styling.enableMobileResponsive ? `
                    @media (max-width: 768px) {
                        .flip-words-mobile {
                            font-size: ${Math.max(12, props.styling.fontSize * 0.9)}px !important;
                            padding: ${Math.max(4, props.styling.padding * 0.7)}px !important;
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
                className={`flip-words-container ${props.styling.enableMobileResponsive ? 'flip-words-mobile' : ''} ${props.className || ''}`}
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
    duration: 3000,
    className: "",
    textBefore: "Build",
    textAfter: "websites",
    styling: {
        useProjectFonts: true,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 24,
        fontWeight: "600",
        color: "#333333",
        backgroundColor: "transparent",
        lineHeight: 1.2,
        letterSpacing: 0,
        textAlign: "left",
        width: 400,
        height: 60,
        borderRadius: 0,
        padding: 8,
        margin: 0,
        enableMobileResponsive: true,
    },
    highlight: {
        enableHighlight: true,
        highlightColor: "#0066cc",
        highlightFontWeight: "bold",
        highlightFontSize: 24,
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
} as const

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
        defaultValue: 3000,
    },
    className: {
        type: ControlType.String,
        title: "CSS Class",
        placeholder: "custom-class",
    },
    styling: {
        type: ControlType.Object,
        title: "Styling",
        controls: {
            useProjectFonts: {
                type: ControlType.Boolean,
                title: "Use Project Font",
                defaultValue: true,
            },
            fontFamily: {
                type: ControlType.String,
                title: "Font Family",
                defaultValue: "Inter, system-ui, sans-serif",
                hidden(props: any) { return !!props.styling?.useProjectFonts }
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
            fontWeight: {
                type: ControlType.Enum,
                title: "Font Weight",
                options: ["300", "400", "500", "600", "700", "800", "900"],
                optionTitles: ["Light", "Normal", "Medium", "Semi-bold", "Bold", "Extra-bold", "Black"],
                defaultValue: "600",
            },
            color: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#333333",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background Color",
                defaultValue: "rgba(255, 255, 255, 0)",
            },
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
            textAlign: {
                type: ControlType.Enum,
                title: "Text Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                min: 100,
                max: 1000,
                step: 10,
                unit: "px",
                defaultValue: 400,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                min: 30,
                max: 200,
                step: 5,
                unit: "px",
                defaultValue: 60,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                defaultValue: 8,
            },
            margin: {
                type: ControlType.Number,
                title: "Margin",
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            enableMobileResponsive: {
                type: ControlType.Boolean,
                title: "Mobile Responsive",
                defaultValue: true,
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
                options: ["300", "400", "500", "600", "700", "800", "900"],
                optionTitles: ["Light", "Normal", "Medium", "Semi-bold", "Bold", "Extra-bold", "Black"],
                defaultValue: "bold",
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
                hidden(props: any) { return !props.highlight?.enableHighlight }
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
                options: ["fade", "slide", "flip", "bounce", "scale"],
                optionTitles: ["Fade", "Slide", "Flip", "Bounce", "Scale"],
                defaultValue: "fade",
            },
            animationDuration: {
                type: ControlType.Number,
                title: "Animation Duration",
                description: "Duration of the transition animation (ms)",
                min: 100,
                max: 2000,
                step: 50,
                unit: "ms",
                defaultValue: 600,
            },
            animationEasing: {
                type: ControlType.Enum,
                title: "Animation Easing",
                options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear"],
                optionTitles: ["Ease", "Ease In", "Ease Out", "Ease In-Out", "Linear"],
                defaultValue: "ease-in-out",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on Hover",
                enabledTitle: "Pause",
                disabledTitle: "Continue",
                defaultValue: true,
            },
            randomOrder: {
                type: ControlType.Boolean,
                title: "Random Order",
                enabledTitle: "Random",
                disabledTitle: "Sequential",
                defaultValue: false,
            },
        },
    },
})
// #endregion
