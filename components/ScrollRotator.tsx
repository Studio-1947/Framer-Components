// Rotational component that changes direction based on scroll - clockwise on scroll down, anticlockwise on scroll up
import React, { useEffect, useRef, type CSSProperties } from "react"
import { motion, useAnimationFrame, useMotionValue } from "framer-motion"
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

    const rotationValue = useMotionValue(0)
    const directionRef = useRef(1) // 1 for clockwise, -1 for anticlockwise
    const lastScrollY = useRef(0)
    // Treat SSR as static render to avoid running animations on the server/canvas
    const isStatic = typeof window === "undefined"

    useEffect(() => {
        if (isStatic) return

        const handleScroll = () => {
            if (typeof window === "undefined") return

            const currentScrollY = window.scrollY
            const deltaY = currentScrollY - lastScrollY.current
            
            // Direct direction switching - no state involved
            if (Math.abs(deltaY) > 1) {
                if (deltaY > 0) {
                    // Scrolling down = clockwise (positive)
                    directionRef.current = 1
                } else {
                    // Scrolling up = anticlockwise (negative)
                    directionRef.current = -1
                }
            }
            
            lastScrollY.current = currentScrollY
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [isStatic])

    // Continuous rotation with direct direction multiplication
    useAnimationFrame(() => {
        if (isStatic) return

        const currentRotation = rotationValue.get()
        const newRotation = currentRotation + (rotationSpeed * directionRef.current)
        
        rotationValue.set(newRotation)
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
                rotate: rotationValue,
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