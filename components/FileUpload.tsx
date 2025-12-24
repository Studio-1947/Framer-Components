import React, { useState, useRef, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"
import { motion, AnimatePresence } from "framer-motion"

// #region Icons
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
)

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
    </svg>
)

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
)

const RemoveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)
// #endregion

interface FileUploadProps {
    // Content
    heading: string
    subheading: string
    acceptedFileTypes: string

    // Style
    font: {
        fontFamily: string
        fontWeight: string | number
        fontStyle: string
    }
    fontSize: number
    textColor: string
    primaryColor: string
    successColor: string
    errorColor: string
    backgroundColor: string
    borderRadius: number
    borderStyle: "solid" | "dashed" | "dotted"

    // Logic
    maxFileSize: number // in MB
    simulateProgress: boolean

    // Events
    onUploadStart?: (file: File) => void
    onUploadComplete?: (file: File) => void
    onError?: (error: string) => void
}

export default function FileUpload(props: FileUploadProps) {
    const {
        heading = "Click to upload",
        subheading = "or drag and drop",
        acceptedFileTypes = ".jpg,.png,.pdf",

        font = { fontFamily: "Inter", fontWeight: 500, fontStyle: "normal" },
        fontSize = 14,
        textColor = "#6B7280",
        primaryColor = "#0099FF",
        successColor = "#10B981",
        errorColor = "#EF4444",
        backgroundColor = "#F9FAFB",
        borderRadius = 12,
        borderStyle = "dashed",

        maxFileSize = 5,
        simulateProgress = true,

        onUploadStart,
        onUploadComplete,
        onError
    } = props

    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")

    const inputRef = useRef<HTMLInputElement>(null)

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isDragging) setIsDragging(true)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const droppedFiles = e.dataTransfer.files
        if (droppedFiles && droppedFiles.length > 0) {
            validateAndUpload(droppedFiles[0])
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndUpload(e.target.files[0])
        }
    }

    const validateAndUpload = (file: File) => {
        // Reset state
        setErrorMessage("")
        setStatus("idle")

        // 1. Check File Type
        // Simple extension check
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
        const acceptedTypes = acceptedFileTypes.split(",").map(t => t.trim().toLowerCase())

        const isTypeValid = acceptedFileTypes === "*" || acceptedTypes.some(type => {
            if (type.startsWith(".")) return type === fileExtension
            // MIME type check could be added here if needed, but extension is safer for UI feedback
            return file.type.match(new RegExp(type.replace("*", ".*")))
        })

        if (!isTypeValid) {
            setStatus("error")
            setErrorMessage(`File type not allowed. Accepted: ${acceptedFileTypes}`)
            if (onError) onError(`File type not allowed`)
            return
        }

        // 2. Check File Size
        if (file.size > maxFileSize * 1024 * 1024) {
            setStatus("error")
            setErrorMessage(`File size too large. Max: ${maxFileSize}MB`)
            if (onError) onError(`File size too large`)
            return
        }

        // Start Upload
        setFile(file)
        setStatus("uploading")
        setProgress(0)
        if (onUploadStart) onUploadStart(file)

        if (simulateProgress) {
            simulateUpload(file)
        }
        // If not simulating, parent component should control 'progress' via props (requires controlled component pattern for full realism)
        // For this component, we'll self-contain the logic or assume external usage matches this pattern. 
    }

    const simulateUpload = (file: File) => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setStatus("success")
                    if (onUploadComplete) onUploadComplete(file)
                    return 100
                }
                return prev + Math.random() * 10
            })
        }, 200)
    }

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation()
        setFile(null)
        setStatus("idle")
        setProgress(0)
        setErrorMessage("")
        if (inputRef.current) inputRef.current.value = ""
    }

    // Styles
    const containerStyle: React.CSSProperties = {
        width: "100%",
        minHeight: 180,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        borderRadius: borderRadius,
        backgroundColor: isDragging ? `${primaryColor}10` : backgroundColor,
        border: `2px ${borderStyle} ${status === "error" ? errorColor :
                status === "success" ? successColor :
                    isDragging ? primaryColor : "#E5E7EB"
            }`,
        transition: "all 0.2s ease-in-out",
        cursor: status === "uploading" ? "default" : "pointer",
        fontFamily: font.fontFamily,
        boxSizing: "border-box",
        overflow: "hidden",
    }

    const textStyle: React.CSSProperties = {
        textAlign: "center",
        pointerEvents: "none",
    }

    return (
        <div
            style={containerStyle}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => status !== "uploading" && inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileInput}
                accept={acceptedFileTypes}
            />

            <AnimatePresence mode="wait">
                {status === "idle" || status === "error" ? (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}
                    >
                        <div style={{
                            width: 48, height: 48,
                            borderRadius: "50%",
                            background: status === "error" ? `${errorColor}20` : `${primaryColor}20`,
                            color: status === "error" ? errorColor : primaryColor,
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            {status === "error" ? <ErrorIcon /> : <UploadIcon />}
                        </div>
                        <div style={textStyle}>
                            <p style={{
                                margin: 0,
                                fontSize: fontSize,
                                fontWeight: 600,
                                color: status === "error" ? errorColor : "#111827",
                                marginBottom: 4
                            }}>
                                {status === "error" ? "Upload Failed" : heading}
                            </p>
                            <p style={{ margin: 0, fontSize: fontSize - 1, color: textColor }}>
                                {status === "error" ? errorMessage : subheading}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ width: "100%", maxWidth: 300 }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                            <div style={{
                                width: 40, height: 40,
                                borderRadius: 8,
                                background: `${primaryColor}20`,
                                color: primaryColor,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0
                            }}>
                                <FileIcon />
                            </div>
                            <div style={{ flex: 1, overflow: "hidden" }}>
                                <p style={{ margin: 0, fontSize: fontSize, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {file?.name}
                                </p>
                                <p style={{ margin: 0, fontSize: fontSize - 2, color: textColor }}>
                                    {(file!.size / 1024 / 1024).toFixed(2)} MB • {status === "success" ? "Complete" : `${Math.round(progress)}%`}
                                </p>
                            </div>
                            {status === "success" ? (
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    style={{ color: successColor }}
                                >
                                    <CheckIcon />
                                </motion.div>
                            ) : null}
                            <button
                                onClick={removeFile}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: textColor,
                                    cursor: "pointer",
                                    padding: 4,
                                    display: "flex"
                                }}
                            >
                                <RemoveIcon />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div style={{
                            width: "100%",
                            height: 6,
                            background: "#E5E7EB",
                            borderRadius: 3,
                            overflow: "hidden"
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ type: "spring", bounce: 0 }}
                                style={{
                                    height: "100%",
                                    background: status === "success" ? successColor : primaryColor,
                                    borderRadius: 3
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(FileUpload, {
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Click to upload"
    },
    subheading: {
        type: ControlType.String,
        title: "Subheading",
        defaultValue: "or drag and drop"
    },
    acceptedFileTypes: {
        type: ControlType.String,
        title: "Accepts",
        defaultValue: ".jpg,.png,.pdf",
        placeholder: ".jpg, .png, image/*"
    },
    maxFileSize: {
        type: ControlType.Number,
        title: "Max MB",
        defaultValue: 5,
        min: 1,
        max: 500
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary",
        defaultValue: "#0099FF"
    },
    successColor: {
        type: ControlType.Color,
        title: "Success",
        defaultValue: "#10B981"
    },
    errorColor: {
        type: ControlType.Color,
        title: "Error",
        defaultValue: "#EF4444"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F9FAFB"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#6B7280"
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 40
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border",
        options: ["solid", "dashed", "dotted"],
        defaultValue: "dashed"
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontStyle: "normal",
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 14,
        min: 10,
        max: 24
    },
    simulateProgress: {
        type: ControlType.Boolean,
        title: "Simulate",
        defaultValue: true
    },
    onUploadStart: {
        type: ControlType.EventHandler,
    },
    onUploadComplete: {
        type: ControlType.EventHandler,
    },
    onError: {
        type: ControlType.EventHandler,
    },
})
