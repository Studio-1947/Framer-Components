import React, { useEffect, useRef, useMemo } from "react"
import { motion, useAnimate, useInView } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

const CounterStyles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "visible",
    },
    digitContainer: {
        position: "relative" as const,
        display: "inline-flex",
        clipPath: "inset(0 -100% 0 -100%)",
        height: "1em",
        width: "auto",
        flexDirection: "column" as const,
        flexDirection: "column" as const,
        // verticalAlign: "top",
    },
    digitStrip: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column" as const,
        willChange: "transform",
        lineHeight: 1,
    },
}

function Digit({ value, initial, direction, duration, font, color }) {
    const [scope, animate] = useAnimate()
    const isUp = direction === "up"

    const numbers = useMemo(() => {
        const nums = Array.from({ length: 10 }, (_, i) => i)
        return isUp ? nums : nums.reverse()
    }, [isUp])

    const getIndex = (val) => {
        const num = parseInt(val, 10)
        if (isNaN(num)) return 0
        return numbers.indexOf(num)
    }

    useEffect(() => {
        const startIndex = getIndex(initial)
        const endIndex = getIndex(value)

        if (initial === value) {
            animate(scope.current, { y: `${-endIndex}em` }, { duration: 0 })
            return
        }

        animate(
            scope.current,
            { y: [`${-startIndex}em`, `${-endIndex}em`] },
            {
                duration: duration,
                ease: "circOut",
            }
        )
    }, [value, initial, duration, numbers, animate, scope])

    return (
        <motion.div
            layout
            style={CounterStyles.digitContainer}
            transition={{ layout: { duration: duration, ease: "circOut" } }}
        >
            <span
                style={{
                    visibility: "hidden",
                    fontFamily: font.fontFamily,
                    fontWeight: font.fontWeight,
                    fontStyle: font.fontStyle,
                    lineHeight: 1,
                }}
            >
                {value}
            </span>
            <motion.div
                ref={scope}
                style={{
                    ...CounterStyles.digitStrip,
                    color: color,
                    fontFamily: font.fontFamily,
                    fontWeight: font.fontWeight,
                    fontStyle: font.fontStyle,
                }}
            >
                {numbers.map((num) => (
                    <span
                        key={num}
                        style={{
                            height: "1em",
                            display: "block",
                            textAlign: "center",
                        }}
                    >
                        {num}
                    </span>
                ))}
            </motion.div>
        </motion.div>
    )
}

export function Counter(props) {
    const {
        start,
        end,
        duration,
        gapSize,
        prefixText,
        suffixText,
        prefixColor,
        suffixColor,
        decimalSeparatorType,
        textSize,
        selectedFont,
        textColor,
        startOnViewport,
        loop,
    } = props

    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: !loop })

    const format = (num) => {
        if (decimalSeparatorType === "comma") {
            return Math.round(num).toLocaleString("en-US")
        } else if (decimalSeparatorType === "period") {
            return Math.round(num).toLocaleString("en-US").replace(/,/g, ".")
        } else {
            return Math.round(num).toString()
        }
    }

    const startStr = format(start)
    const endStr = format(end)

    const maxLength = Math.max(startStr.length, endStr.length)
    const paddedStart = startStr.padStart(maxLength, " ")
    const paddedEnd = endStr.padStart(maxLength, " ")

    const renderContent = () => {
        const content = []
        let digitIndex = 0

        for (let i = 0; i < paddedEnd.length; i++) {
            const char = paddedEnd[i]
            const startChar = paddedStart[i] || "0"

            if (/[0-9]/.test(char)) {
                const direction = digitIndex % 2 === 0 ? "down" : "up"
                const initialVal = /[0-9]/.test(startChar) ? startChar : "0"

                content.push(
                    <Digit
                        key={`digit-${i}`}
                        value={isInView ? char : initialVal}
                        initial={initialVal}
                        direction={direction}
                        duration={duration}
                        font={selectedFont}
                        color={textColor}
                    />
                )
                digitIndex++
            } else {
                content.push(
                    <span
                        key={`sep-${i}`}
                        style={{ opacity: char === " " ? 0 : 1 }}
                    >
                        {char}
                    </span>
                )
            }
        }
        return content
    }

    return (
        <motion.div
            ref={containerRef}
            style={{
                ...CounterStyles.container,
                gap: `${gapSize}px`,
                fontSize: `${textSize}px`,
                fontFamily: selectedFont.fontFamily,
                fontWeight: selectedFont.fontWeight,
                color: textColor,
            }}
        >
            <span
                style={{
                    fontFamily: selectedFont.fontFamily,
                    fontWeight: selectedFont.fontWeight,
                    color: prefixColor,
                    lineHeight: 1,
                }}
            >
                {prefixText}
            </span>

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    overflow: "visible",
                }}
            >
                {renderContent()}
            </div>

            <span
                style={{
                    fontFamily: selectedFont.fontFamily,
                    fontWeight: selectedFont.fontWeight,
                    color: suffixColor,
                    lineHeight: 1,
                }}
            >
                {suffixText}
            </span>
        </motion.div>
    )
}

Counter.defaultProps = {
    start: 0,
    end: 100,
    duration: 2,
    prefixText: "",
    suffixText: "",
    loop: false,
    decimalSeparatorType: "comma",
    textSize: 36,
    selectedFont: {
        fontFamily: "Inter",
        fontWeight: 500,
        systemFont: true,
    },
    textColor: "#333",
    startOnViewport: true,
}

addPropertyControls(Counter, {
    startOnViewport: {
        type: ControlType.Boolean,
        title: "Viewport",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    selectedFont: {
        title: "Font",
        type: ControlType.Font,
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            systemFont: true,
        },
    },
    textSize: {
        title: "Size",
        type: ControlType.Number,
        min: 8,
        max: 240,
        step: 1,
        defaultValue: 36,
    },
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#333",
    },
    start: {
        type: ControlType.Number,
        title: "Start",
        defaultValue: 0,
    },
    end: {
        type: ControlType.Number,
        title: "End",
        defaultValue: 100,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    decimalSeparatorType: {
        type: ControlType.Enum,
        title: "Separator",
        defaultValue: "comma",
        options: ["comma", "period", "none"],
        optionTitles: ["Comma (1,000)", "Decimal (1.000)", "None"],
    },
    prefixText: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
    },
    prefixColor: {
        type: ControlType.Color,
        title: "Pre Color",
    },
    suffixText: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
    },
    suffixColor: {
        type: ControlType.Color,
        title: "Suf Color",
    },
    gapSize: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 4,
        min: 0,
        max: 100,
        step: 1,
    },
})
