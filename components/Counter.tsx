// Animated counter component that counts from 0 to a target number with optional symbol (e.g., + or %)
import {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
import { addPropertyControls, ControlType } from "framer"
import { useInView } from "framer-motion"

interface CounterProps {
    targetNumber: number
    duration: number
    showPrefix: boolean
    prefixType: "+" | "%"
    font: any
    textColor: string
    autoStart: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Counter(props: CounterProps) {
    const {
        targetNumber = 100,
        duration = 2000,
        showPrefix = false,
        prefixType = "+",
        font,
        textColor = "#000000",
        autoStart = true,
    } = props

    const [currentNumber, setCurrentNumber] = useState(0)
    const animationRef = useRef<number | undefined>(undefined)
    const startTimeRef = useRef<number | undefined>(undefined)
    const isStatic = typeof window === "undefined"
    const ref = useRef<HTMLDivElement | null>(null)
    const isInView = useInView(ref, { once: true })

    const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
            startTimeRef.current = timestamp
        }

        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const newValue = Math.floor(targetNumber * easeOutQuart)

        startTransition(() => {
            setCurrentNumber(newValue)
        })

        if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate)
        } else {
            startTransition(() => {
                setCurrentNumber(targetNumber)
            })
            startTimeRef.current = undefined
            animationRef.current = undefined
        }
    }

    const startAnimation = () => {
        // In static rendering or invalid duration cases, jump directly to target
        if (isStatic || duration <= 0) {
            setCurrentNumber(targetNumber)
            return
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = undefined
        }

        startTransition(() => {
            setCurrentNumber(0)
        })
        startTimeRef.current = undefined
        animationRef.current = requestAnimationFrame(animate)
    }

    useEffect(() => {
        if (autoStart && isInView) {
            startAnimation()
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = undefined
            }
            startTimeRef.current = undefined
        }
    }, [targetNumber, duration, autoStart, isInView])


    const displayValue = isStatic ? targetNumber : currentNumber
    const displayText = showPrefix
        ? `${displayValue}${prefixType}`
        : displayValue.toString()

    const isFixedWidth = props?.style && props.style.width === "100%"

    return (
        <div
            ref={ref}
            style={{
                ...props.style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: textColor,
                cursor: autoStart ? "default" : "pointer",
                ...(isFixedWidth ? {} : { width: "max-content" }),
                ...font,
            }}
            onClick={!autoStart ? startAnimation : undefined}
            role={!autoStart ? "button" : undefined}
            tabIndex={!autoStart ? 0 : undefined}
            onKeyDown={
                !autoStart
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              startAnimation()
                          }
                      }
                    : undefined
            }
        >
            {displayText}
        </div>
    )
}

addPropertyControls(Counter, {
    targetNumber: {
        type: ControlType.Number,
        title: "Target Number",
        defaultValue: 100,
        min: 0,
        max: 10000,
        step: 1,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2000,
        min: 100,
        max: 10000,
        step: 100,
        unit: "ms",
    },
    showPrefix: {
        type: ControlType.Boolean,
        title: "Show Symbol",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    prefixType: {
        type: ControlType.Enum,
        title: "Symbol",
        options: ["+", "%"],
        optionTitles: ["Plus (+)", "Percent (%)"],
        defaultValue: "+",
        displaySegmentedControl: true,
        hidden: ({ showPrefix }) => !showPrefix,
    },
    autoStart: {
        type: ControlType.Boolean,
        title: "Auto Start",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "Click",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: 32,
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
