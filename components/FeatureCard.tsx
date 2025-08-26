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
  headingFontFamily: string
  headingFontSize: number
  headingFontWeight: number
  headingLetterSpacing: number
  headingLineHeight: number
  
  // Feature Typography
  featureFontFamily: string
  featureFontSize: number
  featureFontWeight: number
  featureLetterSpacing: number
  featureLineHeight: number
  
  // Bullet Options
  bulletStyle: string
  bulletColor: string
  bulletSpacing: number

  // Typography source
  useProjectFonts: boolean
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
    headingFontFamily = "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    headingFontSize = 20,
    headingFontWeight = 600,
    headingLetterSpacing = -0.4,
    headingLineHeight = 1.2,
    
    // Feature Typography
    featureFontFamily = "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    featureFontSize = 14,
    featureFontWeight = 400,
    featureLetterSpacing = 0,
    featureLineHeight = 1.5,
    
    // Bullet Options
    bulletStyle = "•",
    bulletColor = "#000000",
    bulletSpacing = 8
  } = props

  // Fixed colors - always white background
  const backgroundColor = "#FFFFFF"
  const defaultHeadingColor = "#000000"
  const defaultFeatureColor = "#000000"
  const hoverBackgroundColor = "#FDC600"
  const hoverHeadingColor = "#000000"
  const hoverFeatureColor = "#000000"

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
        alignItems: "flex-start",
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
          fontFamily: props.useProjectFonts ? ("inherit" as any) : (headingFontFamily as any),
          fontSize: headingFontSize,
          fontWeight: headingFontWeight,
          letterSpacing: headingLetterSpacing,
          lineHeight: headingLineHeight,
          color: defaultHeadingColor,
          width: "100%",
          textAlign: "left"
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
          flex: 1
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
                fontWeight: featureFontWeight,
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
                fontFamily: props.useProjectFonts ? ("inherit" as any) : (featureFontFamily as any),
                fontSize: featureFontSize,
                fontWeight: featureFontWeight,
                letterSpacing: featureLetterSpacing,
                lineHeight: featureLineHeight,
                color: defaultFeatureColor,
                textAlign: "left",
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
  useProjectFonts: {
    type: ControlType.Boolean,
    title: "Use Project Font",
    defaultValue: true,
  },
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
  headingFontFamily: {
    type: ControlType.String,
    title: "Heading Font Family",
  defaultValue: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  hidden(props: any){ return !!props.useProjectFonts }
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
  
  headingFontWeight: {
    type: ControlType.Number,
    title: "Heading Font Weight",
    defaultValue: 600,
    min: 100,
    max: 900,
    step: 100
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
  featureFontFamily: {
    type: ControlType.String,
    title: "Feature Font Family",
  defaultValue: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  hidden(props: any){ return !!props.useProjectFonts }
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
  
  featureFontWeight: {
    type: ControlType.Number,
    title: "Feature Font Weight",
    defaultValue: 400,
    min: 100,
    max: 900,
    step: 100
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
    step: 1,
    unit: "px"
  }
})
