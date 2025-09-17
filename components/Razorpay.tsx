// Get Started: https://www.framer.com/developers

import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Form_razor_pay(props) {
    const { buttonId } = props
    const formRef = React.useRef(null)

    React.useEffect(() => {
        const form = formRef.current
        if (!form) return
        form.innerHTML = ""
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/payment-button.js"
        script.async = true
        script.setAttribute("data-payment_button_id", buttonId || "pl_YOUR_BUTTON_ID_HERE")
        form.appendChild(script)

        // Add CSS to make the Razorpay button rounded
        const style = document.createElement("style")
        style.textContent = `
            /* Target all Razorpay button elements */
            .razorpay-payment-button,
            .razorpay-payment-button button,
            .razorpay-payment-button input[type="submit"],
            form[action*="razorpay.com"] button,
            form[action*="razorpay.com"] input[type="submit"],
            button[data-payment_button_id],
            [data-payment_button_id] button {
                border-radius: 25px !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                box-shadow: none !important;
            }
            
            /* Additional targeting for deeply nested elements */
            div[data-payment_button_id] * {
                border-radius: 25px !important;
                box-shadow: none !important;
            }
            
            /* Force border radius on all child elements */
            form * {
                border-radius: inherit !important;
                box-shadow: none !important;
            }
        `
        document.head.appendChild(style)

        // Wait for the script to load and then apply styles directly
        const observer = new MutationObserver(() => {
            const buttons = document.querySelectorAll('button, input[type="submit"]')
            buttons.forEach(button => {
                const htmlButton = button as HTMLElement
                if (htmlButton.closest('[data-payment_button_id]') || 
                    htmlButton.closest('.razorpay-payment-button') ||
                    (htmlButton as HTMLInputElement | HTMLButtonElement).form?.action?.includes('razorpay')) {
                    htmlButton.style.borderRadius = '25px'
                    htmlButton.style.overflow = 'hidden'
                    htmlButton.style.boxShadow = 'none'
                }
            })
        })
        
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            document.head.removeChild(style)
            observer.disconnect()
        }
    }, [buttonId])

    return (
        <motion.div
            style={{
                borderRadius: "25px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                minHeight: "60px",
                backgroundColor: "transparent"
            }}
        >
            <form
                ref={formRef}
                style={{ 
                    borderRadius: "25px",
                    border: "none",
                    backgroundColor: "transparent"
                }}
            />
        </motion.div>
    )
}

addPropertyControls(Form_razor_pay, {
    buttonId: {
        title: "Button ID",
        type: ControlType.String,
        defaultValue: "pl_YOUR_BUTTON_ID_HERE",
        placeholder: "Enter your Razorpay button ID",
        description: "The unique ID for your Razorpay payment button"
    },
})
