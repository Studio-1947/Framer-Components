// Type definitions for Framer Code Components

declare module "framer" {
  export enum ControlType {
    Array = "array",
    Boolean = "boolean",
    Color = "color",
    ComponentInstance = "componentinstance",
    Date = "date",
    Enum = "enum",
    EventHandler = "eventhandler",
    File = "file",
    ResponsiveImage = "image",
    Number = "number",
    Object = "object",
    String = "string",
    Transition = "transition",
    Link = "link",
    Padding = "padding",
    BorderRadius = "borderradius",
    Border = "border",
    BoxShadow = "boxshadow"
  }

  export interface PropertyControl {
    type: ControlType
    title?: string
    description?: string
    defaultValue?: any
    placeholder?: string
    hidden?: (props: any) => boolean
    options?: string[]
    optionTitles?: string[]
    min?: number
    max?: number
    step?: number
    unit?: string
    obscured?: boolean
    displayTextArea?: boolean
    maxLength?: number
    enabledTitle?: string
    disabledTitle?: string
    displaySegmentedControl?: boolean
    segmentedControlDirection?: "horizontal" | "vertical"
    allowedFileTypes?: string[]
    optional?: boolean
    buttonTitle?: string
    icon?: string
    control?: PropertyControl
    controls?: { [key: string]: PropertyControl }
    maxCount?: number
    animationDuration?: number
  }

  export interface PropertyControls {
    [key: string]: PropertyControl
  }

  export function addPropertyControls(
    component: React.ComponentType<any>,
    controls: PropertyControls
  ): void

  // Common Framer Motion types
  export interface MotionProps {
    animate?: any
    initial?: any
    exit?: any
    transition?: any
    whileHover?: any
    whileTap?: any
    whileFocus?: any
    whileInView?: any
    onAnimationStart?: () => void
    onAnimationComplete?: () => void
  }
}
