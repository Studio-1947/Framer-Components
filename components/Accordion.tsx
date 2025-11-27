import { useState, type CSSProperties } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion, AnimatePresence, type Transition } from "framer-motion"

// Animation presets with proper typing for Framer Motion
const animationPresets = {
    smooth: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
    },
    bouncy: {
        type: "spring",
        duration: 0.5,
        bounce: 0.4
    },
    quick: {
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1]
    },
    slow: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
    },
    spring: {
        type: "spring",
        stiffness: 300,
        damping: 30
    }
}

// Centralized durations for UI transitions (rotation/color), avoids casts
const animationDurations: Record<keyof typeof animationPresets, number> = {
    smooth: 0.3,
    bouncy: 0.5,
    quick: 0.15,
    slow: 0.6,
    spring: 0.3
}

interface AccordionItem {
    id?: string
    heading: string
    content: string
}

interface AccordionProps {
    // Content
    items: AccordionItem[]

    // Behavior
    animationType: keyof typeof animationPresets

    // Layout
    width: number
    spacing: number
    padding: number
    borderRadius: number

    // Text Styling
    headingTextStyle: {
        font: {
            fontFamily: string
            fontWeight: string | number
            fontStyle: string
        }
        fontSize: number
        lineHeight: number
        letterSpacing: number
    }
    contentTextStyle: {
        font: {
            fontFamily: string
            fontWeight: string | number
            fontStyle: string
        }
        fontSize: number
        lineHeight: number
        letterSpacing: number
    }
    contentAlign: "left" | "center" | "right"

    // Icon
    showIcon: boolean

    iconSize: number
    iconType: "plus" | "chevron" | "arrow" | "minus"

    // Colors
    backgroundColor: string
    activeBackgroundColor: string
    textColor: string
    activeTextColor: string
    contentColor: string

    // Typography source

}

export default function Accordion({
    items = [
        { id: "accordion-item-1", heading: "Lorem Ipsum", content: "Incididunt eiusmod do ut Sed et magna labore tempor aliqua." },
        { id: "accordion-item-2", heading: "Lorem Ipsum", content: "Incididunt eiusmod do ut Sed et magna labore tempor aliqua." }
    ],
    animationType = "smooth",
    width = 320,
    spacing = 8,
    padding = 20,
    borderRadius = 12,
    headingTextStyle = {
        font: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontStyle: "normal",
        },
        fontSize: 16,
        lineHeight: 1.2,
        letterSpacing: 0,
    },
    contentTextStyle = {
        font: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontStyle: "normal",
        },
        fontSize: 14,
        lineHeight: 1.5,
        letterSpacing: 0,
    },
    contentAlign = "left",
    showIcon = true,
    iconSize = 20,
    iconType = "plus",


    backgroundColor = "#FDC600",
    activeBackgroundColor = "#000000",
    textColor = "#000000",
    activeTextColor = "#FDC600",
    contentColor = "#ffffffB3"
}: AccordionProps) {


    const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
        // Initialize with first item expanded
        if (items.length > 0) {
            const firstItemId = items[0].id || `accordion-item-0-${items[0].heading.replace(/\s+/g, '-').toLowerCase()}`
            return new Set([firstItemId])
        }
        return new Set()
    })
    const [hoveredItems, setHoveredItems] = useState<Set<string>>(new Set())

    const toggleItem = (itemId: string) => {
        setExpandedItems(prev => {
            const newSet = new Set<string>()
            if (!prev.has(itemId)) {
                newSet.add(itemId)
            }
            return newSet
        })
    }

    const handleMouseEnter = (itemId: string) => {
        setHoveredItems(prev => new Set(prev).add(itemId))
    }

    const handleMouseLeave = (itemId: string) => {
        setHoveredItems(prev => {
            const newSet = new Set(prev)
            newSet.delete(itemId)
            return newSet
        })
    }

    const renderIcon = (isExpanded: boolean, isHovered: boolean, animationDuration: number) => {
        const iconColor = (isExpanded || isHovered) ? activeTextColor : textColor

        switch (iconType) {
            case "plus":
                return (
                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transform: isExpanded ? "rotate(45deg)" : "rotate(0deg)",
                            transition: `transform ${animationDuration}s ease-in-out`
                        }}
                    >
                        <path
                            d="M12 5v14m-7-7h14"
                            stroke={iconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                )
            case "chevron":
                return (
                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: `transform ${animationDuration}s ease-in-out`
                        }}
                    >
                        <path
                            d="M6 9l6 6 6-6"
                            stroke={iconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            case "arrow":
                return (
                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            transition: `transform ${animationDuration}s ease-in-out`
                        }}
                    >
                        <path
                            d="M9 18l6-6-6-6"
                            stroke={iconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            case "minus":
                return (
                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transform: isExpanded ? "rotate(0deg)" : "rotate(90deg)",
                            transition: `transform ${animationDuration}s ease-in-out`
                        }}
                    >
                        <path
                            d="M5 12h14"
                            stroke={iconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                )
            default:
                return null
        }
    }

    return (
        <div
            style={{
                width: "100%",
                maxWidth: width,
                minHeight: "fit-content",
                fontFamily: "inherit",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: spacing }}>
                {items.map((item, index) => {
                    // Ensure each item has a unique ID based on its content and position
                    const itemId = item.id || `accordion-item-${index}-${item.heading.replace(/\s+/g, '-').toLowerCase()}`
                    const isExpanded = expandedItems.has(itemId)
                    const isHovered = hoveredItems.has(itemId)
                    const animationDuration = animationDurations[animationType]

                    // Determine colors based on state
                    const isActive = isExpanded || isHovered
                    const currentBackgroundColor = isActive ? activeBackgroundColor : backgroundColor
                    const currentTextColor = isActive ? activeTextColor : textColor

                    return (
                        <motion.div
                            key={itemId}
                            initial={false}
                            onMouseEnter={() => handleMouseEnter(itemId)}
                            onMouseLeave={() => handleMouseLeave(itemId)}
                            style={{
                                borderRadius,

                                backgroundColor: currentBackgroundColor,
                                overflow: "hidden",
                                transition: `all ${animationDuration}s ease-in-out`
                            }}
                        >
                            {/* Header */}
                            <motion.div
                                onClick={() => toggleItem(itemId)}
                                style={{
                                    padding,
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    userSelect: "none"
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: headingTextStyle.fontSize,
                                        lineHeight: headingTextStyle.lineHeight,
                                        letterSpacing: `${headingTextStyle.letterSpacing}px`,
                                        fontFamily: headingTextStyle.font.fontFamily,
                                        fontWeight: headingTextStyle.font.fontWeight,
                                        fontStyle: headingTextStyle.font.fontStyle,
                                        color: currentTextColor,
                                        transition: `color ${animationDuration}s ease-in-out`
                                    }}
                                >
                                    {item.heading}
                                </h3>

                                {showIcon && (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: iconSize,
                                        minHeight: iconSize
                                    }}>
                                        {renderIcon(isExpanded, isHovered, animationDuration)}
                                    </div>
                                )}
                            </motion.div>

                            {/* Content */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: "auto",
                                            opacity: 1
                                        }}
                                        exit={{
                                            height: 0,
                                            opacity: 0
                                        }}
                                        transition={animationPresets[animationType] as Transition}
                                        style={{
                                            overflow: "hidden"
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: `0 ${padding}px ${padding}px ${padding}px`,
                                                textAlign: contentAlign,
                                                fontSize: contentTextStyle.fontSize,
                                                lineHeight: contentTextStyle.lineHeight,
                                                letterSpacing: `${contentTextStyle.letterSpacing}px`,
                                                fontFamily: contentTextStyle.font.fontFamily,
                                                fontWeight: contentTextStyle.font.fontWeight,
                                                fontStyle: contentTextStyle.font.fontStyle,
                                                color: contentColor,
                                                transition: `color ${animationDuration}s ease-in-out`
                                            }}
                                        >
                                            {item.content}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

// Framer Property Controls
addPropertyControls(Accordion, {
    // Typography source

    // Content
    items: {
        type: ControlType.Array,
        title: "Accordion Items",
        control: {
            type: ControlType.Object,
            controls: {
                heading: {
                    type: ControlType.String,
                    title: "Heading",
                    defaultValue: "Lorem Ipsum",
                    placeholder: "Enter heading text"
                },
                content: {
                    type: ControlType.String,
                    title: "Content",
                    defaultValue: "Incididunt eiusmod do ut Sed et magna labore tempor aliqua.",
                    displayTextArea: true,
                    placeholder: "Enter content text"
                }
            }
        },
        defaultValue: [
            { id: "accordion-item-1", heading: "Lorem Ipsum", content: "Incididunt eiusmod do ut Sed et magna labore tempor aliqua." },
            { id: "accordion-item-2", heading: "Lorem Ipsum", content: "Incididunt eiusmod do ut Sed et magna labore tempor aliqua." }
        ],
        maxCount: 10
    },

    // Animation & Layout
    animationType: {
        type: ControlType.Enum,
        title: "Animation Type",
        options: ["smooth", "bouncy", "quick", "slow", "spring"],
        optionTitles: ["Smooth", "Bouncy", "Quick", "Slow", "Spring"],
        defaultValue: "smooth"
    },
    spacing: {
        type: ControlType.Number,
        title: "Item Spacing",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 2,
        unit: "px"
    },
    padding: {
        type: ControlType.Number,
        title: "Item Padding",
        defaultValue: 20,
        min: 8,
        max: 50,
        step: 2,
        unit: "px"
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 30,
        step: 1,
        unit: "px"
    },

    // Typography
    headingTextStyle: {
        type: ControlType.Object,
        title: "Heading Style",
        font: {
            type: ControlType.Font,
            title: "Font",
            defaultValue: {
                fontFamily: "Inter",
                fontWeight: 600,
                systemFont: true
            }
        },
        fontSize: {
            type: ControlType.Number,
            title: "Font Size",
            defaultValue: 16,
            min: 12,
            max: 32,
            step: 1,
            unit: "px"
        },
        lineHeight: {
            type: ControlType.Number,
            title: "Line Height",
            defaultValue: 1.2,
            min: 0.8,
            max: 2,
            step: 0.1
        },
        letterSpacing: {
            type: ControlType.Number,
            title: "Letter Spacing",
            defaultValue: 0,
            min: -2,
            max: 4,
            step: 0.1,
            unit: "px"
        }
    }
},
    contentTextStyle: {
    type: ControlType.Object,
    title: "Content Style",
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            systemFont: true
        }
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        unit: "px"
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.5,
        min: 0.8,
        max: 2.5,
        step: 0.1
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -2,
        max: 4,
        step: 0.1,
        unit: "px"
    }
}
    },
    contentAlign: {
    type: ControlType.Enum,
    title: "Content Alignment",
    options: ["left", "center", "right"],
    optionTitles: ["Left", "Center", "Right"],
    defaultValue: "left",
    displaySegmentedControl: true
},

    // Icon
    showIcon: {
    type: ControlType.Boolean,
    title: "Show Icon",
    defaultValue: true,
    enabledTitle: "Show",
    disabledTitle: "Hide"
},
    iconSize: {
    type: ControlType.Number,
    title: "Icon Size",
    defaultValue: 20,
    min: 12,
    max: 32,
    step: 2,
    unit: "px",
    hidden: (props) => !props.showIcon
},
    iconType: {
    type: ControlType.Enum,
    title: "Icon Type",
    options: ["plus", "chevron", "arrow", "minus"],
    optionTitles: ["Plus", "Chevron", "Arrow", "Minus"],
    defaultValue: "minus",
    hidden: (props) => !props.showIcon
}
})
