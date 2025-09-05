// Circular Rotating Text Component
// User can set text, rotation speed, direction, and font
import { useEffect, useRef, useState, startTransition } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

interface CircularTextProps {
    text: string
    speed: number
    direction: "clockwise" | "counterclockwise"
    font: any
    textColor: string
    radius: number
    circleSize: number
    style?: React.CSSProperties
}

/**
 * Circular Rotating Text
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CircularText(props: CircularTextProps) {
    const {
        text,
        speed,
        direction,
        font,
        textColor,
        radius,
        circleSize,
        style,
    } = props
    const [angle, setAngle] = useState(0)
    const requestRef = useRef<number>()
    const dir = direction === "clockwise" ? 1 : -1
    const chars = (text + " ").split("")

    useEffect(() => {
        let last = performance.now()
        function animate(now: number) {
            const delta = now - last
            last = now
            startTransition(() =>
                setAngle((a) => a + dir * speed * delta * 0.06)
            )
            requestRef.current = requestAnimationFrame(animate)
        }
        requestRef.current = requestAnimationFrame(animate)
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [speed, dir])

    const containerSize = circleSize
    const center = containerSize / 2
    const effectiveRadius = Math.min(radius, center - 30)
    const circumference = 2 * Math.PI * effectiveRadius

    function spacingToPx(value: unknown, baseFontSize: number): number {
        if (value == null) return 0
        if (typeof value === "number" && !isNaN(value)) return value
        if (typeof value === "string") {
            const v = value.trim()
            if (v.endsWith("em")) {
                const n = parseFloat(v.slice(0, -2))
                return isNaN(n) ? 0 : n * baseFontSize
            }
            if (v.endsWith("px")) {
                const n = parseFloat(v.slice(0, -2))
                return isNaN(n) ? 0 : n
            }
            const n = parseFloat(v)
            return isNaN(n) ? 0 : n
        }
        return 0
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
                ...style,
                width: containerSize,
                height: containerSize,
                borderRadius: "50%",
                position: "relative",
                overflow: "visible",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
            }}
        >
            <svg
                width={containerSize}
                height={containerSize}
                viewBox={`0 0 ${containerSize} ${containerSize}`}
                style={{ position: "absolute", top: 0, left: 0 }}
                aria-label={text}
            >
                {chars.map((char, i) => {
                    const fontSize = typeof font?.fontSize === "number" ? font.fontSize : 22
                    // Evenly distribute by angle; apply spacing only in glyph styling
                    const baseStepDeg = 360 / chars.length
                    const theta = baseStepDeg * i + angle
                    const rad = (theta * Math.PI) / 180
                    const x = center + effectiveRadius * Math.cos(rad)
                    const y = center + effectiveRadius * Math.sin(rad)
                    // Safe font fallbacks to handle various Framer Font control shapes
                    const fontWeight = font?.fontWeight ?? font?.weight
                    const fontFamily = font?.fontFamily
                    // Smart clamp letterSpacing so glyph width + spacing fits per-character arc
                    const inputSpacingPx = spacingToPx(font?.letterSpacing, fontSize)
                    const perCharArcPx = (circumference || 1) / chars.length
                    const avgCharWidthPx = 0.6 * fontSize
                    const maxSpacingPx = Math.max(-0.5 * avgCharWidthPx, perCharArcPx - avgCharWidthPx)
                    const minSpacingPx = -0.4 * fontSize
                    const letterSpacing = Math.max(minSpacingPx, Math.min(maxSpacingPx, inputSpacingPx))
                    const fontStyle = font?.fontStyle
                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            fill={textColor}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                                userSelect: "none",
                                pointerEvents: "none",
                                fontSize,
                                fontWeight,
                                fontFamily,
                                letterSpacing,
                                fontStyle,
                            }}
                            transform={`rotate(${theta + 90} ${x} ${y})`}
                        >
                            {char}
                        </text>
                    )
                })}
            </svg>
        </motion.div>
    )
}

addPropertyControls(CircularText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Circular Text",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "x",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counterclockwise"],
        defaultValue: "clockwise",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 22,
            letterSpacing: "0.02em",
            lineHeight: "1em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    circleSize: {
        type: ControlType.Number,
        title: "Circle Size",
        defaultValue: 300,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 100,
        min: 40,
        max: 200,
        step: 1,
        unit: "px",
    },
})
