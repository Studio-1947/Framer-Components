import React from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

interface FeatureItem {
  text: string
}

interface FeatureCardProps {
  // Content
  heading: string
  features: FeatureItem[]

  // Appearance
  width: number
  height: number
  borderRadius: number
  padding: number

  // Typography
  headingFont: {
    fontFamily: string
    fontWeight: string | number
    fontStyle: string
  }
  headingFontSize: number
  headingLetterSpacing: number
  headingLineHeight: number

  // Feature Typography
  featureFont: {
    fontFamily: string
    fontWeight: string | number
    fontStyle: string
  }
  featureFontSize: number
  featureLetterSpacing: number
  featureLineHeight: number

  // Bullet Options
  bulletStyle: string
  bulletColor: string
  bulletSpacing: number

  // Colors
  backgroundColor: string
  hoverBackgroundColor: string
  headingColor: string
  hoverHeadingColor: string
  featureColor: string
  hoverFeatureColor: string

  // Alignment
  headingAlign: "left" | "center" | "right"
  featureAlign: "left" | "center" | "right"


}

export default function FeatureCard(props: Partial<FeatureCardProps>) {
  const {
    // Content
    heading = "Lorem Ipsum",
    features = [
      { text: "Lorem Ipsum" },
      { text: "Lorem Ipsum" },
      { text: "Lorem Ipsum" },
      { text: "Lorem Ipsum" },
      { text: "Lorem Ipsum" }
    ],

    // Appearance
    width = 200,
    height = 280,
    borderRadius = 12,
    padding = 24,

    // Typography
    headingFont = {
      fontFamily: "Inter",
      fontWeight: 600,
      fontStyle: "normal",
    },
    headingFontSize = 20,
    headingLetterSpacing = -0.4,
    headingLineHeight = 1.2,

    // Feature Typography
    featureFont = {
      fontFamily: "Inter",
      fontWeight: 400,
      fontStyle: "normal",
    },
    featureFontSize = 14,
    featureLetterSpacing = 0,
    featureLineHeight = 1.5,

    // Bullet Options
    bulletStyle = "•",
    bulletColor = "#000000",
    bulletSpacing = 8,

    // Colors
    backgroundColor = "#FFFFFF",
    hoverBackgroundColor = "#FDC600",
    headingColor = "#000000",
    hoverHeadingColor = "#000000",
    featureColor = "#000000",
    hoverFeatureColor = "#000000",

    // Alignment
    headingAlign = "left",
    featureAlign = "left"
  } = props

  // Fixed colors - always white background
  const defaultHeadingColor = headingColor
  const defaultFeatureColor = featureColor

  return (
    <motion.div
      style={{
        width: "100%",
        maxWidth: width,
        minHeight: height,
        borderRadius,
        padding,
        backgroundColor,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",

        alignItems: headingAlign === "center" ? "center" : headingAlign === "right" ? "flex-end" : "flex-start",
        justifyContent: "flex-start",
        gap: 16,
        overflow: "hidden",
        position: "relative"
      }}
      whileHover="hover"
      variants={{
        hover: {
          backgroundColor: hoverBackgroundColor
        }
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      {/* Heading */}
      <motion.h3
        style={{
          margin: 0,
          fontFamily: headingFont.fontFamily,
          fontSize: headingFontSize,
          fontWeight: headingFont.fontWeight,
          fontStyle: headingFont.fontStyle,
          letterSpacing: headingLetterSpacing,
          lineHeight: headingLineHeight,
          color: defaultHeadingColor,
          width: "100%",
          textAlign: headingAlign
        }}
        variants={{
          hover: {
            color: hoverHeadingColor
          }
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        {heading}
      </motion.h3>

      {/* Features List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
          flex: 1,
          alignItems: featureAlign === "center" ? "center" : featureAlign === "right" ? "flex-end" : "flex-start"
        }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: bulletSpacing,
              width: "100%"
            }}
            variants={{
              hover: {
                color: hoverFeatureColor
              }
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            {/* Bullet Point */}
            <motion.span
              style={{
                color: bulletColor,
                fontSize: featureFontSize,
                fontWeight: featureFont.fontWeight,
                lineHeight: featureLineHeight,
                flexShrink: 0,
                marginTop: 0
              }}
              variants={{
                hover: {
                  color: hoverFeatureColor
                }
              }}
              transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}
            >
              {bulletStyle}
            </motion.span>

            {/* Feature Text */}
            <motion.p
              style={{
                margin: 0,
                fontFamily: featureFont.fontFamily,
                fontSize: featureFontSize,
                fontWeight: featureFont.fontWeight,
                fontStyle: featureFont.fontStyle,
                letterSpacing: featureLetterSpacing,
                lineHeight: featureLineHeight,
                color: defaultFeatureColor,
                textAlign: featureAlign,
                flex: 1
              }}
              variants={{
                hover: {
                  color: hoverFeatureColor
                }
              }}
              transition={{
                duration: 0.3,
                ease: "easeInOut"
              }}
            >
              {feature.text}
            </motion.p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Framer Property Controls
addPropertyControls(FeatureCard, {

  // Content Section
  heading: {
    type: ControlType.String,
    title: "Heading",
    defaultValue: "Lorem Ipsum",
    placeholder: "Enter heading text"
  },

  features: {
    type: ControlType.Array,
    title: "Features",
    control: {
      type: ControlType.Object,
      controls: {
        text: {
          type: ControlType.String,
          title: "Feature Text",
          defaultValue: "Lorem Ipsum",
          placeholder: "Enter feature text"
        }
      }
    },
    defaultValue: [
      { text: "Lorem Ipsum" },
      { text: "Lorem Ipsum" },
      { text: "Lorem Ipsum" },
      { text: "Lorem Ipsum" },
      { text: "Lorem Ipsum" }
    ],
    maxCount: 10
  },

  // Layout Section
  width: {
    type: ControlType.Number,
    title: "Max Width",
    defaultValue: 200,
    min: 150,
    max: 400,
    step: 10,
    unit: "px"
  },

  height: {
    type: ControlType.Number,
    title: "Min Height",
    defaultValue: 280,
    min: 200,
    max: 500,
    step: 10,
    unit: "px"
  },

  borderRadius: {
    type: ControlType.Number,
    title: "Border Radius",
    defaultValue: 12,
    min: 0,
    max: 50,
    step: 1,
    unit: "px"
  },

  padding: {
    type: ControlType.Number,
    title: "Padding",
    defaultValue: 24,
    min: 12,
    max: 60,
    step: 4,
    unit: "px"
  },

  // Heading Typography
  headingFont: {
    type: ControlType.Font,
    title: "Heading Font",
    defaultValue: {
      fontFamily: "Inter",
      fontWeight: 600,
      fontStyle: "normal",
    },
  },

  headingFontSize: {
    type: ControlType.Number,
    title: "Heading Font Size",
    defaultValue: 20,
    min: 14,
    max: 32,
    step: 1,
    unit: "px"
  },



  headingLetterSpacing: {
    type: ControlType.Number,
    title: "Heading Letter Spacing",
    defaultValue: -0.4,
    min: -2,
    max: 4,
    step: 0.1,
    unit: "px"
  },

  headingLineHeight: {
    type: ControlType.Number,
    title: "Heading Line Height",
    defaultValue: 1.2,
    min: 0.8,
    max: 2.0,
    step: 0.1
  },

  // Feature Typography
  featureFont: {
    type: ControlType.Font,
    title: "Feature Font",
    defaultValue: {
      fontFamily: "Inter",
      fontWeight: 400,
      fontStyle: "normal",
    },
  },

  featureFontSize: {
    type: ControlType.Number,
    title: "Feature Font Size",
    defaultValue: 14,
    min: 10,
    max: 24,
    step: 1,
    unit: "px"
  },



  featureLetterSpacing: {
    type: ControlType.Number,
    title: "Feature Letter Spacing",
    defaultValue: 0,
    min: -2,
    max: 4,
    step: 0.1,
    unit: "px"
  },

  featureLineHeight: {
    type: ControlType.Number,
    title: "Feature Line Height",
    defaultValue: 1.5,
    min: 0.8,
    max: 2.0,
    step: 0.1
  },

  // Bullet Controls
  bulletStyle: {
    type: ControlType.Enum,
    title: "Bullet Style",
    options: ["•", "◦", "▪", "▫", "‣", "⁃", "→", "▶", "✓", "★", "♦", "●", "○", "■", "□", "▸", "»"],
    optionTitles: [
      "Bullet (•)",
      "White Bullet (◦)",
      "Black Square (▪)",
      "White Square (▫)",
      "Triangle Bullet (‣)",
      "Hyphen Bullet (⁃)",
      "Arrow (→)",
      "Play (▶)",
      "Check (✓)",
      "Star (★)",
      "Diamond (♦)",
      "Filled Circle (●)",
      "Empty Circle (○)",
      "Filled Square (■)",
      "Empty Square (□)",
      "Triangle Right (▸)",
      "Double Arrow (»)"
    ],
    defaultValue: "•"
  },

  bulletColor: {
    type: ControlType.Color,
    title: "Bullet Color",
    defaultValue: "#000000"
  },

  bulletSpacing: {
    type: ControlType.Number,
    title: "Bullet Spacing",
    defaultValue: 8,
    min: 4,
    max: 20,
    unit: "px"
  },

  // Colors
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#FFFFFF"
  },
  hoverBackgroundColor: {
    type: ControlType.Color,
    title: "Hover Bg",
    defaultValue: "#FDC600"
  },
  headingColor: {
    type: ControlType.Color,
    title: "Heading Color",
    defaultValue: "#000000"
  },
  hoverHeadingColor: {
    type: ControlType.Color,
    title: "Hover Heading",
    defaultValue: "#000000"
  },
  featureColor: {
    type: ControlType.Color,
    title: "Feature Color",
    defaultValue: "#000000"
  },
  hoverFeatureColor: {
    type: ControlType.Color,
    title: "Hover Feature",
    defaultValue: "#000000"
  },

  // Alignment
  headingAlign: {
    type: ControlType.Enum,
    title: "Heading Align",
    options: ["left", "center", "right"],
    optionTitles: ["Left", "Center", "Right"],
    defaultValue: "left",
    displaySegmentedControl: true
  },
  featureAlign: {
    type: ControlType.Enum,
    title: "Feature Align",
    options: ["left", "center", "right"],
    optionTitles: ["Left", "Center", "Right"],
    defaultValue: "left",
    displaySegmentedControl: true
  }
})
