import React, { useCallback, useState } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion, AnimatePresence } from "framer-motion"

interface ContentItem {
  heading: string
  content: string
  image?: any
}

interface HoverImageSectionProps {
  // Size
  width: number
  height: number

  // Image (fallback)
  image: any
  borderRadius: number

  // Single Content (fallback)
  heading: string
  content: string

  // Array Content
  contentItems: ContentItem[]

  // Layout
  padding: number
  alignX: "left" | "center" | "right"
  alignY: "top" | "center" | "bottom"
  textMaxWidth: number
  // Gaps & background
  panelGap: number // horizontal gap between desktop panels; can be negative to overlap and hide seams
  textGap: number // vertical space between heading and paragraph
  backgroundColor: string // container background; shows through when panelGap > 0

  // Overlay
  overlayColor: string
  overlayOpacity: number
  hoverOverlayOpacity: number
  useGradient: boolean

  // Heading style
  headingFont: {
    fontFamily: string
    fontWeight: string | number
    fontStyle: string
  }
  headingSize: number
  headingColor: string
  headingLetterSpacing: number
  headingLineHeight: number

  // Content style
  contentFont: {
    fontFamily: string
    fontWeight: string | number
    fontStyle: string
  }
  contentSize: number
  contentColor: string
  contentLetterSpacing: number
  contentLineHeight: number

  // Hover motion (internal default)
  hoverScale: number



  // Image fill and elastic hover
  enableElastic: boolean
  imageBleed: number // percent overscan to avoid edge bars
  elasticAmount: number // extra percent scale when active/hovered
  elasticStiffness: number
  elasticDamping: number

  // Responsive / Mobile
  viewMode: "auto" | "desktop" | "mobile"
  mobileBreakpoint: number
  mobileShowDots: boolean
  mobileDotColor: string
  mobileActiveDotColor: string

  // Arrow indicator beside heading
  showArrow: boolean
  arrowSize: number
}

function hexToRgba(hex: string, alpha = 1): string {
  if (!hex) return `rgba(0,0,0,${alpha})`
  let h = String(hex).replace("#", "")
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  const num = parseInt(h, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getImageUrl(img: any): string | undefined {
  if (!img) return undefined
  if (typeof img === "string") return img
  // Handle common Framer ResponsiveImage shapes
  return img?.src || img?.url || img?.uri || img?.images?.src || undefined
}

export default function HoverImageSection(props: Partial<HoverImageSectionProps>) {
  const {
    // Size
    width = 960,
    height = 520,

    // Fallback image
    image = "",
    borderRadius = 16,

    // Fallback single content
    heading = "Your Heading",
    content = "Add some engaging content that describes this image or feature. Keep it concise.",

    // Array content
    contentItems = [],

    // Layout
    padding = 32,
    alignX = "left",
    alignY = "bottom",
    textMaxWidth = 720,
    panelGap = -1,
    textGap = 12,
    backgroundColor = "#000000",

    // Overlay
    overlayColor = "#000000",
    overlayOpacity = 0.2,
    hoverOverlayOpacity,
    useGradient = true,

    // Heading style
    headingFont = {
      fontFamily: "Inter",
      fontWeight: 700,
      fontStyle: "normal",
    },
    headingSize = 48,
    headingColor = "#FFFFFF",
    headingLetterSpacing = -1,
    headingLineHeight = 1.1,

    // Content style
    contentFont = {
      fontFamily: "Inter",
      fontWeight: 400,
      fontStyle: "normal",
    },
    contentSize = 18,
    contentColor = "#FFFFFF",
    contentLetterSpacing = 0,
    contentLineHeight = 1.6,

    // Hover
    hoverScale = 1.02,



    // Image fill and elastic
    enableElastic = true,
    imageBleed = 6, // % overscan so images always cover during width/hover changes
    elasticAmount = 4, // % extra scale on active/hover for a subtle bounce
    elasticStiffness = 180,
    elasticDamping = 18,

    // Responsive / Mobile
    viewMode = "auto",
    mobileBreakpoint = 640,
    mobileShowDots = true,
    mobileDotColor = "rgba(255,255,255,0.45)",
    mobileActiveDotColor = "#FFFFFF",

    // Arrow
    showArrow = true,
    arrowSize = 48,
  } = props

  // Items to render
  const items: ContentItem[] = (contentItems && contentItems.length > 0)
    ? contentItems
    : [{ heading, content, image }]

  const [isHover, setIsHover] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [swipeDir, setSwipeDir] = useState(0) // -1 = right-to-left, 1 = left-to-right, 0 = none

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(0)
  }, [])

  // Alignment mapping
  const justifyContent = alignY === "top" ? "flex-start" : alignY === "center" ? "center" : "flex-end"
  const alignItems = alignX === "left" ? "flex-start" : alignX === "center" ? "center" : "flex-end"
  const textAlign = alignX

  // Overlay backgrounds
  const baseOverlay = useGradient
    ? `linear-gradient(180deg, ${hexToRgba(overlayColor, 0)} 0%, ${hexToRgba(overlayColor, overlayOpacity)} 100%)`
    : hexToRgba(overlayColor, overlayOpacity)

  const hoverOverlay = useGradient
    ? `linear-gradient(180deg, ${hexToRgba(overlayColor, Math.min(1, overlayOpacity * 0.15))} 0%, ${hexToRgba(overlayColor, Math.min(1, (hoverOverlayOpacity ?? overlayOpacity + 0.35)))} 100%)`
    : hexToRgba(overlayColor, Math.min(1, (hoverOverlayOpacity ?? overlayOpacity + 0.35)))

  const headingBaseStyle: React.CSSProperties = {
    color: headingColor,
    margin: 0,
    // Inherit from project/site so Code Component matches Framer typography by default
    fontFamily: headingFont.fontFamily,
    fontSize: headingSize,
    fontWeight: headingFont.fontWeight,
    fontStyle: headingFont.fontStyle,
    lineHeight: headingLineHeight,
    letterSpacing: headingLetterSpacing,
    textAlign: "center" as any,
  }

  // Width distribution for hover-accordion
  const expandedPercent = 62
  const collapsedPercent = items.length > 1 ? (100 - expandedPercent) / (items.length - 1) : 100

  // Determine if we should render the mobile variant
  const isMobile = viewMode === "mobile" || (viewMode === "auto" && (width ?? 0) <= mobileBreakpoint)

  // Compute image scales (overscan + elastic bounce)
  const baseScale = 1 + Math.max(0, imageBleed) / 100
  const activeScale = (enableElastic ? baseScale + Math.max(0, elasticAmount) / 100 : baseScale)
  const springy = { type: "spring" as const, stiffness: elasticStiffness, damping: elasticDamping, mass: 0.9 }
  const positiveGap = panelGap > 0

  // Handlers for simple swipe navigation on mobile
  const goPrev = useCallback(() => {
    setActiveIndex((idx) => (idx - 1 + items.length) % items.length)
  }, [items.length])

  const goNext = useCallback(() => {
    setActiveIndex((idx) => (idx + 1) % items.length)
  }, [items.length])

  return (
    <motion.div
      style={{
        width,
        height,
        borderRadius,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        backgroundColor,
        // Prevent subpixel seams from showing as bars
        outline: "1px solid rgba(0,0,0,0.001)",
      }}
      onMouseLeave={handleMouseLeave}
      onHoverStart={() => !isMobile && setIsHover(true)}
      onHoverEnd={() => !isMobile && setIsHover(false)}
      initial={false}
      whileHover={{ scale: isMobile ? 1 : 1.02 }}
      animate={{ boxShadow: isHover ? "0 12px 30px rgba(0,0,0,0.35)" : "0 2px 10px rgba(0,0,0,0.15)" }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
    >
      {isMobile ? (
        // Mobile: single panel with swipe and dots navigation
        <motion.div
          style={{ position: "absolute", inset: 0 }}
          drag={items.length > 1 ? "x" : false}
          dragElastic={0.12}
          dragConstraints={{ left: 0, right: 0 }}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) { setSwipeDir(1); goNext() }
            else if (info.offset.x > 50) { setSwipeDir(-1); goPrev() }
            else setSwipeDir(0)
          }}
        >
          {(() => {
            const item = items[activeIndex] || items[0]
            const url = getImageUrl(item?.image) || getImageUrl(image)
            const enterX = swipeDir === 0 ? 0 : 24 * swipeDir
            const exitX = swipeDir === 0 ? 0 : -24 * swipeDir
            return (
              <>
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={`bg-${activeIndex}`}
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: url ? `url(${url})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundColor: url ? undefined : "#222",
                      willChange: "transform, opacity",
                      transformOrigin: "center",
                      backfaceVisibility: "hidden",
                    }}
                    initial={{ opacity: 0, x: enterX, scale: baseScale * 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: activeScale }}
                    exit={{ opacity: 0, x: exitX, scale: baseScale * 0.98 }}
                    transition={springy}
                  />
                </AnimatePresence>

                {/* Use the stronger overlay on mobile for readability */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: hoverOverlay,
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    // Center content within container (vertical + horizontal)
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    padding,
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ maxWidth: textMaxWidth, width: "100%" }}>
                    <AnimatePresence initial={false} mode="wait">
                      <motion.h2
                        key={`h-${activeIndex}`}
                        style={headingBaseStyle}
                        initial={{ opacity: 0, x: enterX, y: 6 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: exitX, y: -6 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                      >
                        <>
                          {item?.heading}
                          {showArrow && (
                            <motion.svg
                              aria-hidden="true"
                              width={arrowSize}
                              height={arrowSize}
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{
                                marginLeft: 12,
                                display: "inline-block",
                                verticalAlign: "middle",
                                pointerEvents: "none",
                              }}
                              animate={{ x: [0, 6, 0] }}
                              transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
                            >
                              {/* Minimal right arrow (material/hugeicons style) */}
                              <path d="M4 12h12" stroke={headingColor} strokeWidth={2.25} strokeLinecap="round" />
                              <path d="M12 6l6 6-6 6" stroke={headingColor} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
                            </motion.svg>
                          )}
                        </>
                      </motion.h2>
                    </AnimatePresence>

                    <AnimatePresence initial={false} mode="wait">
                      <motion.p
                        key={`p-${activeIndex}`}
                        style={{
                          marginTop: textGap,
                          marginBottom: 0,
                          fontFamily: contentFont.fontFamily,
                          fontSize: contentSize,
                          fontWeight: contentFont.fontWeight,
                          fontStyle: contentFont.fontStyle,
                          color: contentColor,
                          lineHeight: contentLineHeight,
                          letterSpacing: contentLetterSpacing,
                          textAlign: "center" as any,
                        }}
                        initial={{ opacity: 0, x: enterX, y: 6 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, x: exitX, y: -6 }}
                        transition={{ duration: 0.24, ease: "easeOut", delay: 0.04 }}
                      >
                        {item?.content}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Dots */}
                  {mobileShowDots && items.length > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: Math.max(8, padding / 2),
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {items.map((_, i) => (
                        <button
                          key={`dot-${i}`}
                          onClick={() => { setSwipeDir(i > activeIndex ? 1 : -1); setActiveIndex(i) }}
                          aria-label={`Go to slide ${i + 1}`}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 8,
                            border: "none",
                            padding: 0,
                            background: i === activeIndex ? mobileActiveDotColor : mobileDotColor,
                            cursor: "pointer",
                            outline: "none",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Placeholder if no image */}
                {!url && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8a8a8a",
                      fontFamily: "inherit",
                      fontSize: 14,
                      userSelect: "none",
                    }}
                  >
                    Image Placeholder
                  </div>
                )}
              </>
            )
          })()}
        </motion.div>
      ) : (
        // Desktop: hover-driven accordion panels
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            width: "100%",
            height: "100%",
          }}
        >
          {items.map((item, i) => {
            const url = getImageUrl(item.image) || getImageUrl(image)
            const isActive = activeIndex === i
            const isLast = i === items.length - 1
            const panelGrow = items.length === 1 ? 100 : (isActive ? expandedPercent : collapsedPercent)

            return (
              <motion.div
                key={i}
                style={{
                  position: "relative",
                  height: "100%",
                  overflow: "hidden",
                  outline: "none",
                  // flex-based sizing avoids percentage rounding gaps
                  flexBasis: 0,
                  minWidth: 0,
                  // slight negative overlap to hide subpixel seams between panels
                  marginRight: isLast ? 0 : panelGap,
                }}
                animate={{ flexGrow: panelGrow }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => setActiveIndex(i)}
                role="presentation"
              >
                {/* Background image layer per panel */}
                <motion.div
                  style={{
                    position: "absolute",
                    // bleed 1px beyond edges to prevent any hairline gaps
                    inset: positiveGap ? 0 : -1,
                    backgroundImage: url ? `url(${url})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    willChange: "transform, filter",
                    backgroundColor: url ? undefined : "#222",
                    transformOrigin: "center",
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                  }}
                  animate={{
                    // Keep small overscan at all times to prevent edge bars
                    scale: Math.max(1.01, isActive ? activeScale : baseScale),
                    filter: isActive ? "grayscale(0%)" : "grayscale(100%)",
                  }}
                  transition={springy}
                />

                {/* Overlay per panel */}
                <motion.div
                  style={{
                    position: "absolute",
                    // match the 1px bleed so overlay also covers any seam
                    inset: positiveGap ? 0 : -1,
                    background: isActive ? hoverOverlay : baseOverlay,
                    transition: "background 0.35s ease-in-out",
                    pointerEvents: "none",
                  }}
                />

                {/* Content per panel */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    // Center content within container (vertical + horizontal)
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    padding,
                    boxSizing: "border-box",
                  }}
                >
                  <motion.div
                    style={{
                      maxWidth: textMaxWidth,
                      width: "100%",
                    }}
                  >
                    {isActive && (
                      <>
                        <motion.h2
                          style={headingBaseStyle}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0, scale: 1.02 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                        >
                          <>
                            {item.heading}
                            {showArrow && (
                              <motion.svg
                                aria-hidden="true"
                                width={arrowSize}
                                height={arrowSize}
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                  marginLeft: 12,
                                  display: "inline-block",
                                  verticalAlign: "middle",
                                  pointerEvents: "none",
                                }}
                                animate={{ x: [0, 6, 0] }}
                                transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
                              >
                                {/* Minimal right arrow (material/hugeicons style) */}
                                <path d="M4 12h12" stroke={headingColor} strokeWidth={2.25} strokeLinecap="round" />
                                <path d="M12 6l6 6-6 6" stroke={headingColor} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
                              </motion.svg>
                            )}
                          </>
                        </motion.h2>

                        <motion.p
                          style={{
                            marginTop: textGap,
                            marginBottom: 0,
                            fontFamily: useProjectFonts ? ("inherit" as any) : (contentFontFamily as any),
                            fontSize: contentSize,
                            fontWeight: contentWeight as any,
                            color: contentColor,
                            lineHeight: contentLineHeight,
                            letterSpacing: contentLetterSpacing,
                            textAlign: "center" as any,
                          }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
                        >
                          {item.content}
                        </motion.p>
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Placeholder if no image */}
                {!url && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#8a8a8a",
                      fontFamily: "inherit",
                      fontSize: 14,
                      userSelect: "none",
                    }}
                  >
                    Image Placeholder
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

HoverImageSection.defaultProps = {
  width: 960,
  height: 520,
  image: "",
  borderRadius: 16,
  heading: "Your Heading",
  content: "Add some engaging content that describes this image or feature. Keep it concise.",
  contentItems: [],
  padding: 32,
  alignX: "left" as const,
  alignY: "bottom" as const,
  textMaxWidth: 720,
  panelGap: -1,
  textGap: 12,
  backgroundColor: "#000000",
  overlayColor: "#000000",
  overlayOpacity: 0.2,
  useGradient: true,
  overlayOpacity: 0.2,
  useGradient: true,
  headingFont: {
    fontFamily: "Inter",
    fontWeight: 700,
    fontStyle: "normal",
  },
  headingSize: 48,
  headingColor: "#FFFFFF",
  contentFont: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontStyle: "normal",
  },
  contentSize: 18,
  contentColor: "#FFFFFF",
  headingLetterSpacing: -1,
  headingLineHeight: 1.1,
  contentLetterSpacing: 0,
  contentLineHeight: 1.6,
  hoverScale: 1.02,

  viewMode: "auto" as const,
  mobileBreakpoint: 640,
  mobileShowDots: true,
  mobileDotColor: "rgba(255,255,255,0.45)",
  mobileActiveDotColor: "#FFFFFF",
  showArrow: true,
  arrowSize: 48,
  // Elastic defaults
  enableElastic: true,
  imageBleed: 6,
  elasticAmount: 4,
  elasticStiffness: 180,
  elasticDamping: 18,
}

addPropertyControls(HoverImageSection, {
  // Core
  contentItems: {
    type: ControlType.Array,
    title: "Items",
    maxCount: 8,
    control: {
      type: ControlType.Object,
      controls: {
        heading: { type: ControlType.String, title: "Heading" },
        content: { type: ControlType.String, title: "Content", displayTextArea: true },
        image: { type: ControlType.ResponsiveImage, title: "Image" },
      },
    },
    defaultValue: [
      { heading: "First item", content: "Describe the first highlight.", image: "" },
      { heading: "Second item", content: "Add supporting details here.", image: "" },
      { heading: "Third item", content: "Keep it concise and clear.", image: "" },
    ],
  },

  // Fallback single content for simple cases
  heading: { type: ControlType.String, title: "Heading", hidden(props: any) { return (props.contentItems?.length ?? 0) > 0 } },
  content: { type: ControlType.String, title: "Content", displayTextArea: true, hidden(props: any) { return (props.contentItems?.length ?? 0) > 0 } },
  image: { type: ControlType.ResponsiveImage, title: "Image (Fallback)", hidden(props: any) { return (props.contentItems?.length ?? 0) > 0 } },

  // Layout
  alignX: {
    type: ControlType.Enum,
    title: "Align X",
    options: ["left", "center", "right"],
    optionTitles: ["Left", "Center", "Right"],
    defaultValue: "left",
  },
  alignY: {
    type: ControlType.Enum,
    title: "Align Y",
    options: ["top", "center", "bottom"],
    optionTitles: ["Top", "Center", "Bottom"],
    defaultValue: "bottom",
  },
  textMaxWidth: { type: ControlType.Number, title: "Text Max W", min: 200, max: 1200, step: 10, unit: "px", defaultValue: 720 },
  padding: { type: ControlType.Number, title: "Padding", min: 0, max: 120, step: 2, unit: "px", defaultValue: 32 },
  borderRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 64, step: 1, unit: "px", defaultValue: 16 },
  panelGap: { type: ControlType.Number, title: "Panel Gap", min: -4, max: 64, step: 1, unit: "px", defaultValue: -1 },
  textGap: { type: ControlType.Number, title: "Text Gap", min: 0, max: 64, step: 1, unit: "px", defaultValue: 12 },
  backgroundColor: { type: ControlType.Color, title: "Background" },

  // Responsive
  viewMode: {
    type: ControlType.Enum,
    title: "View",
    options: ["auto", "desktop", "mobile"],
    optionTitles: ["Auto", "Desktop", "Mobile"],
    defaultValue: "auto",
  },
  mobileBreakpoint: {
    type: ControlType.Number,
    title: "Mobile ≤",
    min: 320,
    max: 1440,
    step: 10,
    unit: "px",
    defaultValue: 640,
    hidden(props: any) { return props.viewMode !== "auto" }
  },
  mobileShowDots: { type: ControlType.Boolean, title: "Dots (Mobile)", defaultValue: true },
  mobileDotColor: { type: ControlType.Color, title: "Dot", hidden(props: any) { return !props.mobileShowDots } },
  mobileActiveDotColor: { type: ControlType.Color, title: "Dot Active", hidden(props: any) { return !props.mobileShowDots } },

  // Arrow
  showArrow: { type: ControlType.Boolean, title: "Show Arrow", defaultValue: true },
  arrowSize: { type: ControlType.Number, title: "Arrow Size", min: 16, max: 96, step: 1, unit: "px", hidden(props: any) { return !props.showArrow } },

  // Overlay (kept simple)
  overlayColor: { type: ControlType.Color, title: "Overlay Color" },
  overlayColor: { type: ControlType.Color, title: "Overlay Color" },
  overlayOpacity: { type: ControlType.Number, title: "Overlay Opacity", min: 0, max: 1, step: 0.05, defaultValue: 0.2 },
  hoverOverlayOpacity: { type: ControlType.Number, title: "Hover Opacity", min: 0, max: 1, step: 0.05 },
  useGradient: { type: ControlType.Boolean, title: "Use Gradient", defaultValue: true },
  hoverScale: { type: ControlType.Number, title: "Hover Scale", min: 1, max: 1.2, step: 0.01, defaultValue: 1.02 },

  // Elastic image fill is now always on with sensible defaults (no exposed controls)

  // Typography (minimal)
  headingFont: {
    type: ControlType.Font,
    title: "Heading Font",
    defaultValue: {
      fontFamily: "Inter",
      fontWeight: 700,
      fontStyle: "normal",
    },
  },
  headingSize: { type: ControlType.Number, title: "Heading Size", min: 12, max: 96, step: 1, unit: "px" },
  headingColor: { type: ControlType.Color, title: "Heading Color" },
  headingLineHeight: { type: ControlType.Number, title: "Head Line Ht", min: 0.8, max: 2, step: 0.1, defaultValue: 1.1 },
  headingLetterSpacing: { type: ControlType.Number, title: "Head Spacing", min: -5, max: 10, step: 0.1, defaultValue: -1 },
  contentFont: {
    type: ControlType.Font,
    title: "Content Font",
    defaultValue: {
      fontFamily: "Inter",
      fontWeight: 400,
      fontStyle: "normal",
    },
  },
  contentSize: { type: ControlType.Number, title: "Content Size", min: 10, max: 36, step: 1, unit: "px" },
  contentColor: { type: ControlType.Color, title: "Content Color" },
  contentLineHeight: { type: ControlType.Number, title: "Cont Line Ht", min: 0.8, max: 2, step: 0.1, defaultValue: 1.6 },
  contentLetterSpacing: { type: ControlType.Number, title: "Cont Spacing", min: -5, max: 10, step: 0.1, defaultValue: 0 },
})
