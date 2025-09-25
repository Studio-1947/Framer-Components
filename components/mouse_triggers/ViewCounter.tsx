import React, { useState, useEffect, useCallback, useMemo } from "react"
import { addPropertyControls, ControlType } from "framer"

// #region Type Definitions
export interface ViewCounterProps {
  style?: React.CSSProperties
  initialCount?: number
  incrementAmount?: number
  formatStyle?: "compact" | "full" | "custom"
  customSuffix?: string
  animationType?: "countUp" | "instant"
  animationDuration?: number
  showIcon?: boolean
  iconType?: "eye" | "views" | "heart" | "star" | "custom"
  customIcon?: string
  resetTrigger?: boolean
  color?: string
  fontSize?: number
  fontWeight?: string | number
  fontFamily?: string
  padding?: number
  // New props for external control
  externalCount?: number
  onCountChange?: (newCount: number) => void
  disableDirectClick?: boolean
  // New prop for ClickTrigger integration
  componentId?: string
  listenToTriggers?: boolean
}
// #endregion

// #region Utility Functions

function formatNumber(num: number, style: "compact" | "full" | "custom", customSuffix?: string): string {
  if (style === "full") return num.toLocaleString()
  if (style === "custom" && customSuffix) return `${num}${customSuffix}`
  
  // Compact formatting
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`
  }
  return num.toString()
}

function getIconSVG(iconType: string, customIcon?: string): string {
  if (iconType === "custom" && customIcon) return customIcon
  
  const icons = {
    eye: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>`,
    views: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>`,
    heart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`,
    star: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>`
  }
  
  return icons[iconType as keyof typeof icons] || icons.eye
}
// #endregion

export default function ViewCounter(props: ViewCounterProps) {
  // #region Props with Defaults
  const {
    initialCount = 521000,
    incrementAmount = 1,
    formatStyle = "compact",
    customSuffix = "+",
    animationType = "countUp",
    animationDuration = 0.5,
    showIcon = true,
    iconType = "eye",
    customIcon,
    resetTrigger = false,
    color = "#ffffff",
    fontSize = 16,
    fontWeight = 600,
    fontFamily = "Inter, sans-serif",
    padding = 12,
    externalCount,
    onCountChange,
    disableDirectClick = false,
    componentId = "viewCounter1",
    listenToTriggers = true,
    style = {}
  } = props
  // #endregion

  // #region State and Logic
  const [currentCount, setCurrentCount] = useState(externalCount ?? initialCount)
  const [displayCount, setDisplayCount] = useState(externalCount ?? initialCount)
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle external count changes
  useEffect(() => {
    if (externalCount !== undefined && externalCount !== currentCount) {
      setCurrentCount(externalCount)
    }
  }, [externalCount])

  // Reset functionality
  useEffect(() => {
    if (resetTrigger) {
      const resetValue = externalCount ?? initialCount
      setCurrentCount(resetValue)
      setDisplayCount(resetValue)
    }
  }, [resetTrigger, initialCount, externalCount])

  // Listen for ClickTrigger events
  useEffect(() => {
    if (!listenToTriggers) return

    const handleTriggerEvent = (event: CustomEvent) => {
      const { targetId, amount, timestamp } = event.detail
      
      // Check if this event is for this component
      if (targetId === componentId) {
        setCurrentCount(prev => {
          const newCount = prev + amount
          // Notify parent of count change
          onCountChange?.(newCount)
          return newCount
        })
      }
    }

    // Add event listener
    document.addEventListener('viewCounterIncrement', handleTriggerEvent as EventListener)
    
    // Cleanup
    return () => {
      document.removeEventListener('viewCounterIncrement', handleTriggerEvent as EventListener)
    }
  }, [listenToTriggers, componentId, onCountChange])

  // Count up animation logic
  useEffect(() => {
    if (animationType === "countUp" && currentCount !== displayCount) {
      setIsAnimating(true)
      const startCount = displayCount
      const endCount = currentCount
      const duration = animationDuration * 1000
      const startTime = Date.now()
      
      const updateCount = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const newCount = Math.round(startCount + (endCount - startCount) * easeOutQuart)
        
        setDisplayCount(newCount)
        
        if (progress < 1) {
          requestAnimationFrame(updateCount)
        } else {
          setIsAnimating(false)
        }
      }
      
      requestAnimationFrame(updateCount)
    } else if (animationType !== "countUp") {
      setDisplayCount(currentCount)
    }
  }, [currentCount, animationType, animationDuration])

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disableDirectClick) {
      e.stopPropagation()
      return
    }
    
    const newCount = currentCount + incrementAmount
    setCurrentCount(newCount)
    
    // Notify parent of count change
    onCountChange?.(newCount)
  }, [currentCount, incrementAmount, onCountChange, disableDirectClick])

  // Memoized formatted count
  const formattedCount = useMemo(() => {
    return formatNumber(displayCount, formatStyle, customSuffix)
  }, [displayCount, formatStyle, customSuffix])
  // #endregion

  // #region Styling
  const containerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    padding,
    cursor: disableDirectClick ? "default" : "pointer",
    userSelect: "none",
    transition: "all 0.2s ease",
    fontSize,
    fontWeight,
    fontFamily,
    color,
    ...style,
  }

  const iconStyle: React.CSSProperties = {
    color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  const textStyle: React.CSSProperties = {
    whiteSpace: "nowrap",
  }
  // #endregion

  // #region Render
  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View counter: ${formattedCount} views. Click to increment.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick(e as any)
        }
      }}
    >
      {showIcon && (
        <div 
          style={iconStyle}
          dangerouslySetInnerHTML={{ __html: getIconSVG(iconType, customIcon) }}
        />
      )}
      <span style={textStyle}>
        {formattedCount}
        {formatStyle === "compact" && displayCount >= 1000 ? "+" : ""}
      </span>
    </div>
  )
  // #endregion
}

// #region Property Controls
ViewCounter.displayName = "ViewCounter"

addPropertyControls(ViewCounter, {
  initialCount: {
    type: ControlType.Number,
    title: "Initial Count",
    defaultValue: 521000,
    min: 0,
    step: 1,
  },
  incrementAmount: {
    type: ControlType.Number,
    title: "Increment Amount",
    defaultValue: 1,
    min: 1,
    step: 1,
  },
  formatStyle: {
    type: ControlType.Enum,
    title: "Format Style",
    options: ["compact", "full", "custom"],
    defaultValue: "compact",
  },
  customSuffix: {
    type: ControlType.String,
    title: "Custom Suffix",
    defaultValue: "+",
    hidden: (props: any) => props.formatStyle !== "custom",
  },
  resetTrigger: {
    type: ControlType.Boolean,
    title: "Reset Counter",
    defaultValue: false,
  },
  disableDirectClick: {
    type: ControlType.Boolean,
    title: "Disable Direct Click",
    defaultValue: false,
  },
  componentId: {
    type: ControlType.String,
    title: "Component ID",
    defaultValue: "viewCounter1",
    description: "Unique ID for ClickTrigger targeting",
  },
  listenToTriggers: {
    type: ControlType.Boolean,
    title: "Listen to Click Triggers",
    defaultValue: true,
  },
  color: {
    type: ControlType.Color,
    title: "Color",
    defaultValue: "#ffffff",
  },
  fontSize: {
    type: ControlType.Number,
    title: "Font Size",
    defaultValue: 16,
    min: 8,
    max: 72,
    step: 1,
    unit: "px",
  },
  fontWeight: {
    type: ControlType.Enum,
    title: "Font Weight",
    options: [300, 400, 500, 600, 700, 800, 900],
    optionTitles: ["Light", "Regular", "Medium", "Semi Bold", "Bold", "Extra Bold", "Black"],
    defaultValue: 600,
  },
  fontFamily: {
    type: ControlType.String,
    title: "Font Family",
    defaultValue: "Inter, sans-serif",
  },
  padding: {
    type: ControlType.Number,
    title: "Padding",
    defaultValue: 12,
    min: 0,
    max: 50,
    step: 1,
    unit: "px",
  },
  showIcon: {
    type: ControlType.Boolean,
    title: "Show Icon",
    defaultValue: true,
  },
  iconType: {
    type: ControlType.Enum,
    title: "Icon Type",
    options: ["eye", "views", "heart", "star", "custom"],
    defaultValue: "eye",
    hidden: (props: any) => !props.showIcon,
  },
  customIcon: {
    type: ControlType.String,
    title: "Custom Icon (SVG)",
    defaultValue: "",
    displayTextArea: true,
    hidden: (props: any) => !props.showIcon || props.iconType !== "custom",
  },
  animationType: {
    type: ControlType.Enum,
    title: "Count Animation",
    options: ["countUp", "instant"],
    defaultValue: "countUp",
  },
  animationDuration: {
    type: ControlType.Number,
    title: "Animation Duration",
    defaultValue: 0.5,
    min: 0.1,
    max: 3,
    step: 0.1,
    unit: "s",
  },
})
// #endregion