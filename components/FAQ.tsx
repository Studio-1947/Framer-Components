import React, { useState, CSSProperties } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion, AnimatePresence } from "framer-motion"

interface FAQItem {
  id?: string
  question: string
  answer: string
}

interface FAQProps {
  items: FAQItem[]
  spacing: number

  showDivider: boolean
  dividerColor: string
  dividerThickness: number

  font: {
    fontFamily: string
    fontWeight: string | number
    fontStyle: string
  }

  questionStyle: {
    fontSize: number
    lineHeight: number
    letterSpacing: number
    fontWeight: string | number
    color: string
    textAlign: "left" | "center" | "right"
  }
  answerStyle: {
    fontSize: number
    lineHeight: number
    letterSpacing: number
    fontWeight: string | number
    color: string
    textAlign: "left" | "center" | "right"
  }

  iconType: "plusminus" | "lines" | "chevron"
  iconSize: number
  iconColor: string
}

export default function FAQ({
  items = [
    { id: "faq-item-1", question: "What can I expect within 48 hours?", answer: "You'll receive an initial mockup or design draft, giving you a first look at our creative direction for your project." },
    { id: "faq-item-2", question: "How does this subscription model work?", answer: "You submit design requests, we deliver ongoing iterations and new assets each cycle—cancel anytime." }
  ],
  spacing = 20,

  showDivider = true,
  dividerColor = "#D1D5DB",
  dividerThickness = 1,

  font = {
    fontFamily: "Inter",
    fontWeight: 400,
    fontStyle: "normal",
  },

  questionStyle = {
    fontSize: 28,
    lineHeight: 1.2,
    letterSpacing: 0,
    fontWeight: 700,
    color: "#000000",
    textAlign: "left"
  },
  answerStyle = {
    fontSize: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    fontWeight: 400,
    color: "#4B5563",
    textAlign: "left"
  },

  iconType = "plusminus",
  iconSize = 28,
  iconColor = "#0B6CFB"
}: Partial<FAQProps>) {
  const animationDuration = 0.35
  const easing = "cubic-bezier(0.4, 0, 0.2, 1)"

  const createId = (item: FAQItem | undefined, i: number) => {
    if (!item) return null
    return item.id || `faq-item-${i}-${(item.question || '').replace(/\s+/g, '-').toLowerCase()}`
  }
  const [openId, setOpenId] = useState<string | null>(createId(items[0], 0))
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setOpenId(prev => prev === id ? null : id)
  }

  const renderIcon = (isOpen: boolean, isHovered: boolean) => {
    switch (iconType) {
      case "chevron":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ transition: `transform ${animationDuration}s ${easing}`, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
            <path d="M9 18l6-6-6-6" stroke={iconColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      case "lines":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" style={{ transition: `transform ${animationDuration}s ${easing}` }}>
            <path d="M5 12h14M5 6h14M5 18h14" stroke={iconColor} strokeWidth={2} strokeLinecap="round" />
          </svg>
        )
      case "plusminus":
      default:
        // Refined hamburger -> X: lines translate vertically then rotate into a perfectly centered X.
        const thickness = Math.max(2, Math.round(iconSize * 0.07)) // scale thickness with size
        const gapExpanded = Math.max(4, Math.round(iconSize * 0.28)) // distance between lines when hovered (or resting previously)
        const gapRest = Math.max(2, Math.round(gapExpanded * 0.45)) // tighter default gap
        const lineWidth = "90%" // slightly inset so the X doesn't overshoot visually
        const transition = { duration: animationDuration, ease: [0.4, 0, 0.2, 1] as any }
        const baseStyle: React.CSSProperties = {
          position: "absolute",
          top: "50%",
          left: "50%",
          width: lineWidth,
          height: thickness,
          margin: 0,
          padding: 0,
          backgroundColor: iconColor,
          borderRadius: thickness,
          transformOrigin: "50% 50%"
        }
        return (
          <div style={{ position: "relative", width: iconSize, height: iconSize }}>
            <motion.span
              style={baseStyle}
              animate={isOpen
                ? { x: "-50%", y: "-50%", rotate: 45 }
                : { x: "-50%", y: isHovered ? -gapExpanded : -gapRest, rotate: 0 }}
              transition={transition}
            />
            <motion.span
              style={baseStyle}
              animate={isOpen
                ? { x: "-50%", y: "-50%", rotate: -45 }
                : { x: "-50%", y: isHovered ? gapExpanded : gapRest, rotate: 0 }}
              transition={transition}
            />
          </div>
        )
    }
  }

  return (
    <div style={{ width: "100%", minHeight: "fit-content" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: spacing, width: "100%" }}>
        {items.map((item, i) => {
          const id = createId(item, i) as string
          const isOpen = openId === id
          const isHovered = hoveredId === id
          return (
            <div key={id} style={{ width: "100%" }}>
              <div
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(prev => prev === id ? null : prev)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: `20px 20px`,
                  position: "relative",
                  gap: 24
                }}
                onClick={() => toggle(id)}
              >
                <div style={{ flex: 1, textAlign: questionStyle.textAlign }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: questionStyle.fontSize,
                    lineHeight: questionStyle.lineHeight,
                    letterSpacing: questionStyle.letterSpacing,
                    fontFamily: font.fontFamily,
                    fontWeight: questionStyle.fontWeight,
                    fontStyle: "normal",
                    transition: `color ${animationDuration}s ${easing}`,
                    color: questionStyle.color
                  }}>{item.question}</h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: animationDuration, ease: easing as any }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{
                          paddingTop: 12,
                          paddingRight: 0,
                          paddingBottom: 4,
                          paddingLeft: 0,
                          textAlign: answerStyle.textAlign,
                          fontSize: answerStyle.fontSize,
                          lineHeight: answerStyle.lineHeight,
                          letterSpacing: answerStyle.letterSpacing,
                          fontFamily: font.fontFamily,
                          fontWeight: answerStyle.fontWeight,
                          fontStyle: "normal",
                          color: answerStyle.color,
                        }}>{item.answer}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ width: iconSize, height: iconSize, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {renderIcon(isOpen, isHovered)}
                </div>
              </div>
              {showDivider && i < items.length - 1 && (
                <div style={{ marginLeft: 20, marginRight: 20, height: dividerThickness, backgroundColor: dividerColor }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

addPropertyControls(FAQ, {
  items: {
    type: ControlType.Array,
    title: "FAQ Items",
    control: {
      type: ControlType.Object,
      controls: {
        question: { type: ControlType.String, title: "Question", defaultValue: "Lorem Ipsum?" },
        answer: { type: ControlType.String, title: "Answer", defaultValue: "Lorem ipsum dolor sit amet.", displayTextArea: true }
      }
    },
    defaultValue: [
      { question: "What can I expect within 48 hours?", answer: "You'll receive an initial mockup or design draft, giving you a first look at our creative direction for your project." },
      { question: "How does this subscription model work?", answer: "You submit design requests, we deliver ongoing iterations and new assets each cycle—cancel anytime." }
    ],
    maxCount: 20
  },

  font: {
    type: ControlType.Font,
    title: "Font Family",
    defaultValue: {
      fontFamily: "Inter",
      fontWeight: 400,
      fontStyle: "normal",
    },
  },

  questionStyle: {
    type: ControlType.Object,
    title: "Question Style",
    controls: {
      fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
        optionTitles: ["Thin", "Extra Light", "Light", "Regular", "Medium", "Semi Bold", "Bold", "Extra Bold", "Black"],
        defaultValue: "700"
      },
      fontSize: { type: ControlType.Number, title: "Size", defaultValue: 28, min: 12, max: 72, step: 1, unit: "px" },
      lineHeight: { type: ControlType.Number, title: "Line Height", defaultValue: 1.2, min: 0.8, max: 2, step: 0.1 },
      letterSpacing: { type: ControlType.Number, title: "Tracking", defaultValue: 0, min: -3, max: 6, step: 0.1, unit: "px" },
      color: { type: ControlType.Color, title: "Color", defaultValue: "#000000" },
      textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true
      }
    }
  },

  answerStyle: {
    type: ControlType.Object,
    title: "Answer Style",
    controls: {
      fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
        optionTitles: ["Thin", "Extra Light", "Light", "Regular", "Medium", "Semi Bold", "Bold", "Extra Bold", "Black"],
        defaultValue: "400"
      },
      fontSize: { type: ControlType.Number, title: "Size", defaultValue: 16, min: 10, max: 48, step: 1, unit: "px" },
      lineHeight: { type: ControlType.Number, title: "Line Height", defaultValue: 1.5, min: 0.8, max: 2.4, step: 0.1 },
      letterSpacing: { type: ControlType.Number, title: "Tracking", defaultValue: 0, min: -3, max: 6, step: 0.1, unit: "px" },
      color: { type: ControlType.Color, title: "Color", defaultValue: "#4B5563" },
      textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true
      }
    }
  },

  iconType: { type: ControlType.Enum, title: "Icon Type", options: ["plusminus", "lines", "chevron"], optionTitles: ["Plus", "Lines", "Chevron"], defaultValue: "plusminus" },
  iconSize: { type: ControlType.Number, title: "Icon Size", defaultValue: 28, min: 12, max: 80, step: 2, unit: "px" },
  iconColor: { type: ControlType.Color, title: "Icon Color", defaultValue: "#0B6CFB" },

  showDivider: { type: ControlType.Boolean, title: "Divider", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
  dividerColor: { type: ControlType.Color, title: "Divider Color", defaultValue: "#E5E7EB" },
  dividerThickness: { type: ControlType.Number, title: "Divider Height", defaultValue: 1, min: 1, max: 8, step: 1, unit: "px", hidden: (p: any) => !p.showDivider },
})
