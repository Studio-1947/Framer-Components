# Framer Development Skills & Patterns

This document is a comprehensive guide for AI agents and developers working on this project. It covers the two main ways to write code in Framer: **Code Overrides** (modifying existing layers) and **Code Components** (creating custom UI elements), along with backend integration patterns.

---

## 1. Code Overrides

**Use when:** You want to add logic (animation, data, state) to a design layer drawn on the Framer canvas.

### Core Pattern: Higher-Order Components (HOC)
Overrides are functions that take a `Component` and return a wrapped `Component`.

```tsx
import { ComponentType, forwardRef } from "react"

export function withMyOverride(Component: ComponentType): ComponentType {
    const Wrapped = forwardRef((props, ref) => {
        return <Component ref={ref} {...props} />
    })
    Wrapped.displayName = "withMyOverride"
    return Wrapped
}
```

### Best Practices
1.  **Target Specific Layers:** Apply overrides to the specific layer you want to change (e.g., the fill bar), not its parent. Modifying children via `React.Children.map` is unreliable in Framer.
2.  **Shared State (Singleton):** Use a global singleton pattern to share fetched data across multiple overridden layers without triggering redundant API calls.
3.  **Avoid `variant` Props for Dynamic Values:** Use `style={{ width: "..." }}` for continuous values like progress bars. Only use `variant` if you have explicitly defined those variants (e.g., "Hover", "Active") in the Framer UI.

---

## 2. Code Components

**Use when:** You need a fully custom UI element (custom layout, complex animation, third-party integration) that exposes controls in the Framer sidebar.

### Basic Structure
```tsx
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

export default function MyComponent(props) {
    return <div>{props.text}</div>
}

addPropertyControls(MyComponent, {
    text: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Hello Framer"
    }
})
```

### Property Controls Pattern
Use `addPropertyControls` to expose props to the Framer UI. Common types used in this project:

-   **String/Number/Boolean/Color:** Standard inputs.
-   **Enum:** Dropdowns for restricted choices (allow segments via `displaySegmentedControl: true`).
-   **Font:** Special control that returns a font object.
    ```tsx
    font: { type: ControlType.Font, ... }
    // Usage: style={{ fontFamily: props.font.fontFamily, ... }}
    ```
-   **Array & Object:** For lists of items (see `FeatureCard.tsx`).
    ```tsx
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: { ... }
        }
    }
    ```

### Layout & Sizing
Use comment annotations to tell Framer how the component sizes itself on the canvas:

```tsx
/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight fixed
 */
export default function ...
```

### Motion Integration
Wrap elements in `motion.div` (from `framer-motion`) to enable animations.
-   **Variants:** Use `variants={{ hover: { ... } }}` and `whileHover="hover"` for interaction states.
-   **Transitions:** Pass `transition={{ duration: 0.3 }}` prop.

### Third-Party Scripts (useEffect)
To integrate external libraries (like Razorpay) that require a script tag:
1.  Use `useRef` to target a container.
2.  Use `useEffect` to create and append the `<script>` tag.
3.  **Cleanup:** Return a cleanup function from `useEffect` to remove the script/styles when the component unmounts.
4.  **Style Injection:** If the third-party script inserts DOM elements, use `MutationObserver` or injected `<style>` tags to force custom styling (e.g., forcing border-radius on payment buttons).

---

## 3. Google Sheets Integration

### Data Fetching (Gviz)
Avoid API keys for public data. Use the Google Visualization API CSV endpoint:
`https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/gviz/tq?tqx=out:csv&gid=[GID]`

### CSV Parsing
Use a lightweight parser to convert the CSV response into an array of objects.

---

## 4. Backend Automation (Google Apps Script)

### Webhook Handler Pattern
When using Google Apps Script as a webhook receiver (e.g., for Razorpay):
1.  **DoPost:** Implement `doPost(e)` to handle incoming JSON payloads.
2.  **Filtering:** Webhooks often lack context (like Page ID). Filter based on payload data (e.g., `order_id`) *after* fetching details from the API if needed, or rely on Dashboard configuration.
3.  **Deduplication:** Always check if the transaction ID already exists in the sheet before appending.
4.  **Auto-Calculation:** Maintain summary rows (like "Total Amount") directly in the sheet via the script to simplify frontend logic.
