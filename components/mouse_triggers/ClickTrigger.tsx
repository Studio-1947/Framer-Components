import React, { useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"

// #region Type Definitions
export interface ClickTriggerProps {
  style?: React.CSSProperties
  targetComponentId?: string
  incrementAmount?: number
  enabled?: boolean
  showDebugOutline?: boolean
  onClickCallback?: () => void
}
// #endregion

export default function ClickTrigger(props: ClickTriggerProps) {
  // #region Props with Defaults
  const {
    targetComponentId = "viewCounter1",
    incrementAmount = 1,
    enabled = true,
    showDebugOutline = false,
    onClickCallback,
    style = {}
  } = props
  // #endregion

  // #region Click Handler
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!enabled) return
    
    // Prevent event bubbling to avoid conflicts
    e.stopPropagation()
    
    // Dispatch custom event to communicate with ViewCounter
    const customEvent = new CustomEvent('viewCounterIncrement', {
      detail: {
        targetId: targetComponentId,
        amount: incrementAmount,
        timestamp: Date.now()
      },
      bubbles: true
    })
    
    // Dispatch the event
    document.dispatchEvent(customEvent)
    
    // Call optional callback
    onClickCallback?.()
    
    // Optional: Visual feedback (you can enable this for debugging)
    if (showDebugOutline) {
      const element = e.currentTarget as HTMLElement
      element.style.transform = "scale(0.98)"
      setTimeout(() => {
        element.style.transform = "scale(1)"
      }, 100)
    }
  }, [enabled, targetComponentId, incrementAmount, onClickCallback, showDebugOutline])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled) return
    
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick(e as any)
    }
  }, [enabled, handleClick])
  // #endregion

  // #region Styling
  const containerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: showDebugOutline ? "rgba(255, 0, 0, 0.1)" : "transparent",
    border: showDebugOutline ? "2px dashed rgba(255, 0, 0, 0.5)" : "none",
    cursor: enabled ? "pointer" : "default",
    zIndex: showDebugOutline ? 1000 : 1,
    transition: "all 0.1s ease",
    ...style,
  }
  // #endregion

  // #region Render
  if (!enabled) {
    return null
  }

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Click trigger for ${targetComponentId}. Increments by ${incrementAmount}.`}
      title={showDebugOutline ? `ClickTrigger for ${targetComponentId}` : undefined}
    />
  )
  // #endregion
}

// #region Property Controls
ClickTrigger.displayName = "ClickTrigger"

addPropertyControls(ClickTrigger, {
  targetComponentId: {
    type: ControlType.String,
    title: "Target Counter ID",
    defaultValue: "viewCounter1",
    description: "ID of the ViewCounter to control",
  },
  incrementAmount: {
    type: ControlType.Number,
    title: "Increment Amount",
    defaultValue: 1,
    min: 1,
    step: 1,
  },
  enabled: {
    type: ControlType.Boolean,
    title: "Enabled",
    defaultValue: true,
  },
  showDebugOutline: {
    type: ControlType.Boolean,
    title: "Show Debug Outline",
    defaultValue: false,
  },
})
// #endregion