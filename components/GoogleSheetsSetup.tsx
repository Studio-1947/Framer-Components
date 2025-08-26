import React from "react"
import { addPropertyControls, ControlType } from "framer"

interface GoogleSheetsSetupProps {
    showInstructions: boolean
    instructionType: "public" | "private" | "both"
    backgroundColor: string
    textColor: string
    fontSize: number
    useProjectFonts?: boolean
}

export default function GoogleSheetsSetup(props: GoogleSheetsSetupProps) {
    if (!props.showInstructions) {
        return null
    }

    const containerStyle: React.CSSProperties = {
        backgroundColor: props.backgroundColor,
        color: props.textColor,
        fontSize: props.fontSize,
        fontFamily: props.useProjectFonts ? ("inherit" as any) : ("Inter, system-ui, sans-serif" as any),
        padding: "20px",
        borderRadius: "8px",
        lineHeight: 1.6,
        border: "1px solid #e2e8f0"
    }

    const headingStyle: React.CSSProperties = {
        fontSize: props.fontSize * 1.2,
        fontWeight: "bold",
        marginBottom: "12px",
        color: props.textColor
    }

    const stepStyle: React.CSSProperties = {
        marginBottom: "16px"
    }

    const codeStyle: React.CSSProperties = {
        backgroundColor: "#f1f5f9",
        color: "#334155",
        padding: "8px 12px",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: props.fontSize * 0.9,
        display: "inline-block",
        margin: "4px 0"
    }

    const renderPublicInstructions = () => (
        <div>
            <h3 style={headingStyle}>📊 Setting up Public Google Sheets</h3>
            
            <div style={stepStyle}>
                <strong>Step 1:</strong> Create your Google Sheet with data
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                    <li>Put column headers in the first row</li>
                    <li>Organize your data in rows below</li>
                    <li>Keep data types consistent within columns</li>
                </ul>
            </div>

            <div style={stepStyle}>
                <strong>Step 2:</strong> Make your sheet public
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                    <li>Click "Share" in the top right</li>
                    <li>Click "Change to anyone with the link"</li>
                    <li>Set permissions to "Viewer"</li>
                    <li>Copy the share link</li>
                </ul>
            </div>

            <div style={stepStyle}>
                <strong>Step 3:</strong> Use the URL in your component
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                    <li>Paste the Google Sheets URL</li>
                    <li>Leave the API Key field empty</li>
                    <li>The component will automatically fetch your data</li>
                </ul>
            </div>

            <div style={{ ...stepStyle, backgroundColor: "#f0f9ff", padding: "12px", borderRadius: "6px", border: "1px solid #0ea5e9" }}>
                <strong>💡 Pro Tip:</strong> Public sheets work great for dashboards, demos, and non-sensitive data. No API setup required!
            </div>
        </div>
    )

    const renderPrivateInstructions = () => (
        <div>
            <h3 style={headingStyle}>🔐 Setting up Private Google Sheets with API</h3>
            
            <div style={stepStyle}>
                <strong>Step 1:</strong> Enable Google Sheets API
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" style={{ color: "#0ea5e9" }}>Google Cloud Console</a></li>
                    <li>Create a new project or select existing</li>
                    <li>Enable the "Google Sheets API"</li>
                </ul>
            </div>

            <div style={stepStyle}>
                <strong>Step 2:</strong> Create API credentials
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                    <li>Go to Credentials → Create Credentials → API Key</li>
                    <li>Copy your API key</li>
                    <li>Restrict the key to Google Sheets API (recommended)</li>
                </ul>
            </div>

            <div style={stepStyle}>
                <strong>Step 3:</strong> Configure your sheet
                <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                    <li>Share your sheet with specific people or keep private</li>
                    <li>Copy the Google Sheets URL</li>
                    <li>Enter both URL and API key in the component</li>
                </ul>
            </div>

            <div style={{ ...stepStyle, backgroundColor: "#fef3c7", padding: "12px", borderRadius: "6px", border: "1px solid #f59e0b" }}>
                <strong>⚠️ Security:</strong> Keep your API key secure and never expose it in public code repositories.
            </div>
        </div>
    )

    const renderBothInstructions = () => (
        <div>
            {renderPublicInstructions()}
            <div style={{ height: "20px" }} />
            {renderPrivateInstructions()}
            
            <div style={{ ...stepStyle, backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "6px", border: "1px solid #22c55e", marginTop: "20px" }}>
                <strong>✅ Quick Start:</strong> For testing and demos, use a public sheet (no API key needed). For production with sensitive data, use the API method.
            </div>
        </div>
    )

    return (
        <div style={containerStyle}>
            {props.instructionType === "public" && renderPublicInstructions()}
            {props.instructionType === "private" && renderPrivateInstructions()}
            {props.instructionType === "both" && renderBothInstructions()}
        </div>
    )
}

GoogleSheetsSetup.defaultProps = {
    showInstructions: true,
    instructionType: "both",
    backgroundColor: "#ffffff",
    textColor: "#374151",
    fontSize: 14,
    useProjectFonts: true
}

addPropertyControls(GoogleSheetsSetup, {
    useProjectFonts: {
        type: ControlType.Boolean,
        title: "Use Project Font",
        defaultValue: true
    },
    showInstructions: {
        type: ControlType.Boolean,
        title: "Show Instructions",
        defaultValue: true
    },
    instructionType: {
        type: ControlType.Enum,
        title: "Instruction Type",
        options: ["public", "private", "both"],
        optionTitles: ["Public Sheets Only", "Private Sheets Only", "Both Methods"],
        defaultValue: "both"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#ffffff"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#374151"
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 20,
        step: 1,
        unit: "px",
        defaultValue: 14
    }
})
