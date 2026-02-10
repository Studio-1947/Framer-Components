import { useState, useRef, useEffect, useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"

// GSAP animation presets
const gsapEasings: Record<string, string | any[]> = {
    smooth: [0.25, 0.1, 0.25, 1],
    bouncy: [0.68, -0.55, 0.265, 1.55],
    quick: [0.25, 0.1, 0.25, 1],
    slow: [0.42, 0, 0.58, 1],
    spring: [0.34, 1.56, 0.64, 1],
}

const animationDurations: Record<string, number> = {
    smooth: 0.4,
    bouncy: 0.6,
    quick: 0.25,
    slow: 0.5,
    spring: 0.7,
}

interface AccordionItem {
    id?: string
    heading: string
    content: string
}

interface AccordionProps {
    items: AccordionItem[]
    animationType: string
    width: number
    spacing: number
    padding: number
    borderRadius: number
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
    showIcon: boolean
    iconSize: number
    iconType: "plus" | "chevron" | "arrow" | "minus"
    backgroundColor: string
    activeBackgroundColor: string
    textColor: string
    activeTextColor: string
    contentColor: string
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
        if (items.length > 0) {
            const firstItemId = items[0].id || `accordion-item-0-${items[0].heading.replace(/\s+/g, '-').toLowerCase()}`
            return new Set([firstItemId])
        }
        return new Set()
    })

    // Refs
    const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const contentInnerRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const iconRefs = useRef<Record<string, SVGSVGElement | null>>({})
    const gsapRef = useRef<any>(null)

    const toggleItem = useCallback((itemId: string) => {
        setExpandedItems(prev => {
            const newSet = new Set<string>()
            if (!prev.has(itemId)) {
                newSet.add(itemId)
            }
            return newSet
        })
    }, [])

    // Load GSAP
    useEffect(() => {
        if (typeof window === "undefined") return

        // Check if GSAP already loaded
        if ((window as any).gsap) {
            gsapRef.current = (window as any).gsap
            return
        }

        // Load GSAP from CDN
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"
        script.async = true
        script.onload = () => {
            gsapRef.current = (window as any).gsap
        }
        document.head.appendChild(script)

        return () => {
            // Don't remove script, just clean up ref
            gsapRef.current = null
        }
    }, [])

    // Helper to get icon rotation
    const getIconRotation = useCallback((isExpanded: boolean) => {
        if (!isExpanded) return 0
        switch (iconType) {
            case "plus": return 45
            case "chevron": return 180
            case "arrow": return 90
            case "minus": return 0
            default: return 0
        }
    }, [iconType])

    // Animation effect
    useEffect(() => {
        const gsap = gsapRef.current
        if (!gsap) return

        const duration = animationDurations[animationType] || 0.4
        const ease = gsapEasings[animationType] || [0.25, 0.1, 0.25, 1]

        items.forEach((item) => {
            const itemId = item.id || `accordion-item-${items.indexOf(item)}-${item.heading.replace(/\s+/g, '-').toLowerCase()}`
            const contentEl = contentRefs.current[itemId]
            const contentInnerEl = contentInnerRefs.current[itemId]
            const iconEl = iconRefs.current[itemId]
            const isExpanded = expandedItems.has(itemId)

            if (!contentEl || !iconEl) return

            // Get target height
            const targetHeight = contentInnerEl ? contentInnerEl.scrollHeight : 0

            if (isExpanded && targetHeight > 0) {
                // Animate open
                gsap.fromTo(contentEl,
                    { height: 0, opacity: 0 },
                    {
                        height: targetHeight,
                        opacity: 1,
                        duration: duration,
                        ease: ease,
                        overwrite: true
                    }
                )

                // Inner content
                gsap.fromTo(contentInnerEl,
                    { opacity: 0 },
                    {
                        opacity: 1,
                        duration: duration * 0.5,
                        delay: duration * 0.2,
                        overwrite: true
                    }
                )
            } else {
                // Animate close
                gsap.to(contentEl, {
                    height: 0,
                    opacity: 0,
                    duration: duration,
                    ease: ease,
                    overwrite: true
                })
            }

            // Icon rotation
            const targetRotation = getIconRotation(isExpanded)
            gsap.to(iconEl, {
                rotation: targetRotation,
                duration: duration,
                ease: ease,
                overwrite: true
            })
        })
    }, [expandedItems, items, animationType, iconType, getIconRotation])

    const renderIcon = (itemId: string, isExpanded: boolean) => {
        return (
            <svg
                ref={(el) => { iconRefs.current[itemId] = el }}
                width={iconSize}
                height={iconSize}
                viewBox="0 0 24 24"
                fill="none"
                style={{
                    transformOrigin: "center",
                    willChange: "transform"
                }}
            >
                {iconType === "plus" && (
                    <path
                        d="M12 5v14m-7-7h14"
                        stroke={isExpanded ? activeTextColor : textColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )}
                {iconType === "chevron" && (
                    <path
                        d="M6 9l6 6 6-6"
                        stroke={isExpanded ? activeTextColor : textColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                {iconType === "arrow" && (
                    <path
                        d="M9 18l6-6-6-6"
                        stroke={isExpanded ? activeTextColor : textColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
                {iconType === "minus" && (
                    <path
                        d="M5 12h14"
                        stroke={isExpanded ? activeTextColor : textColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )}
            </svg>
        )
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
                    const itemId = item.id || `accordion-item-${index}-${item.heading.replace(/\s+/g, '-').toLowerCase()}`
                    const isExpanded = expandedItems.has(itemId)
                    const animationDuration = animationDurations[animationType] || 0.4

                    return (
                        <div
                            key={itemId}
                            style={{
                                borderRadius,
                                backgroundColor: isExpanded ? activeBackgroundColor : backgroundColor,
                                overflow: "hidden",
                            }}
                        >
                            {/* Header */}
                            <div
                                onClick={() => toggleItem(itemId)}
                                style={{
                                    padding,
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    userSelect: "none",
                                    position: "relative",
                                    zIndex: 1
                                }}
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
                                        color: isExpanded ? activeTextColor : textColor,
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
                                        {renderIcon(itemId, isExpanded)}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div
                                ref={(el) => { contentRefs.current[itemId] = el }}
                                style={{
                                    height: 0,
                                    opacity: 0,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    ref={(el) => { contentInnerRefs.current[itemId] = el }}
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
                                    }}
                                >
                                    {item.content}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// Framer Property Controls
addPropertyControls(Accordion, {
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

    headingTextStyle: {
        type: ControlType.Object,
        title: "Heading Style",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font"
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
        },
        defaultValue: {
            font: { fontFamily: "Inter", fontWeight: 600, fontStyle: "normal" },
            fontSize: 16,
            lineHeight: 1.2,
            letterSpacing: 0
        }
    },
    contentTextStyle: {
        type: ControlType.Object,
        title: "Content Style",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font"
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
        },
        defaultValue: {
            font: { fontFamily: "Inter", fontWeight: 400, fontStyle: "normal" },
            fontSize: 14,
            lineHeight: 1.5,
            letterSpacing: 0
        }
    },
    contentAlign: {
        type: ControlType.Enum,
        title: "Content Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true
    },

    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No"
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon Type",
        options: ["plus", "chevron", "arrow", "minus"],
        optionTitles: ["Plus", "Chevron", "Arrow", "Minus"],
        defaultValue: "plus",
        hidden: (props: any) => !props.showIcon
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 20,
        min: 12,
        max: 48,
        step: 2,
        unit: "px",
        hidden: (props: any) => !props.showIcon
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FDC600"
    },
    activeBackgroundColor: {
        type: ControlType.Color,
        title: "Active Background",
        defaultValue: "#000000"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000"
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text Color",
        defaultValue: "#FDC600"
    },
    contentColor: {
        type: ControlType.Color,
        title: "Content Color",
        defaultValue: "#ffffffB3"
    }
})
