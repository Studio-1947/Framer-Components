// Rotational component that changes direction based on scroll - clockwise on scroll down, anticlockwise on scroll up
import React, { useEffect, useState, useRef, type CSSProperties } from "react"
import { motion, useMotionValue, useAnimationFrame } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

// Fallback for Slot control for environments where ControlType.Slot isn't typed
const SlotControl: any = (ControlType as any).Slot ?? ControlType.ComponentInstance

interface ScrollRotatorProps {
    children: React.ReactNode
    rotationSpeed: number
    size: number
    backgroundColor: string
    itemSpacing: number
    showBackground: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ScrollRotator(props: ScrollRotatorProps) {
    const {
        children,
        rotationSpeed,
        size,
        backgroundColor,
        itemSpacing,
        showBackground
    } = props

    const [isClockwise, setIsClockwise] = useState(true)
    const [isAnimating, setIsAnimating] = useState(true)
    const lastScrollY = useRef(0)
    const rotation = useMotionValue(0)
    // Treat SSR as static render to avoid running animations on the server/canvas
    const isStatic = typeof window === "undefined"

    useEffect(() => {
        if (isStatic) {
            setIsAnimating(false)
            return
        }

        const handleScroll = () => {
            if (typeof window === "undefined") return

            const currentScrollY = window.scrollY
            // Ignore events that don't change scroll position to avoid flicker/stutter
            const delta = currentScrollY - lastScrollY.current
            // Require a minimum delta to avoid rapid toggling near rest due to momentum/scroll bounce
            if (Math.abs(delta) < 1) return
            const scrollDirection = delta > 0 ? "down" : "up"
            
            if (scrollDirection === "down" && !isClockwise) {
                // Make direction change immediate to avoid perceived lag/stuck behavior
                setIsClockwise(true)
            } else if (scrollDirection === "up" && isClockwise) {
                setIsClockwise(false)
            }
            
            lastScrollY.current = currentScrollY
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [isClockwise, isStatic])

    useAnimationFrame(() => {
        if (!isAnimating) return
        
        const increment = Math.abs(rotationSpeed) * (isClockwise ? 1 : -1)
        let next = rotation.get() + increment
        // Keep the value bounded to avoid precision drift and stutter
        if (next >= 360 || next <= -360) {
            next = next % 360
        }
        rotation.set(next)
    })

    // Convert children to array and calculate positions
    const childrenArray = React.Children.toArray(children)

    if (isStatic) {
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    backgroundColor: showBackground ? backgroundColor : "transparent",
                    borderRadius: showBackground ? "50%" : "0",
                    position: "relative",
                    transform: `rotate(45deg)`,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                }}
            >
                {childrenArray.map((child, index) => (
                    <div
                        key={index}
                        style={{
                            width: itemSpacing,
                            height: itemSpacing,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {child}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <motion.div
            style={{
                width: size,
                height: size,
                backgroundColor: showBackground ? backgroundColor : "transparent",
                borderRadius: showBackground ? "50%" : "0",
                position: "relative",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                rotate: rotation,
            }}
        >
            {childrenArray.map((child, index) => (
                <div
                    key={index}
                    style={{
                        width: itemSpacing,
                        height: itemSpacing,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {child}
                </div>
            ))}
        </motion.div>
    )
}

addPropertyControls(ScrollRotator, {
    children: {
        type: SlotControl,
        title: "Items",
        maxCount: 12,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "deg/frame",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 200,
        min: 100,
        max: 400,
        step: 10,
        unit: "px",
    },
    itemSpacing: {
        type: ControlType.Number,
        title: "Item Size",
        defaultValue: 40,
        min: 20,
        max: 80,
        step: 5,
        unit: "px",
    },
    showBackground: {
        type: ControlType.Boolean,
        title: "Show Background",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        hidden: ({ showBackground }) => !showBackground,
    },
})