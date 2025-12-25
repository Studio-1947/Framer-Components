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

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
)

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
)

const LocateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="22" y1="12" x2="18" y2="12" />
        <line x1="6" y1="12" x2="2" y2="12" />
        <line x1="12" y1="6" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="18" />
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
    receiverEmail?: string
    formTitle?: string

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
        receiverEmail,
        formTitle = "New Submission",

        onUploadStart,
        onUploadComplete,
        onError
    } = props

    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [progress, setProgress] = useState(0)
    // Updated Status: idle -> email_input -> details_input -> uploading -> success -> error
    const [status, setStatus] = useState<"idle" | "email_input" | "details_input" | "uploading" | "success" | "error">("idle")
    const [errorMessage, setErrorMessage] = useState("")

    // Form Data
    const [userEmail, setUserEmail] = useState("")
    const [locationDescription, setLocationDescription] = useState("")
    const [gpsCoordinates, setGpsCoordinates] = useState("")
    const [isLocating, setIsLocating] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const handleAutoLocation = () => {
        if (!navigator.geolocation) {
            setErrorMessage("Geolocation is not supported by your browser")
            return
        }

        setIsLocating(true)

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setGpsCoordinates(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
                setIsLocating(false)
            },
            (error) => {
                console.error("Error getting location:", error)
                let msg = "Unable to retrieve location."
                if (error.code === 1) msg = "Location permission denied."
                if (error.code === 2) msg = "Network error: Location unavailable."
                if (error.code === 3) msg = "Location request timed out."
                setErrorMessage(msg)
                setIsLocating(false)
            },
            options
        )
    }

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
            validateAndPrepare(droppedFiles[0])
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndPrepare(e.target.files[0])
        }
    }

    const validateAndPrepare = (selectedFile: File) => {
        setErrorMessage("")
        setStatus("idle")

        // 1. Check File Type
        const fileExtension = "." + selectedFile.name.split(".").pop()?.toLowerCase()
        const acceptedTypes = acceptedFileTypes.split(",").map(t => t.trim().toLowerCase())

        const isTypeValid = acceptedFileTypes === "*" || acceptedTypes.some(type => {
            if (type.startsWith(".")) return type === fileExtension
            return selectedFile.type.match(new RegExp(type.replace("*", ".*")))
        })

        if (!isTypeValid) {
            setStatus("error")
            setErrorMessage(`File type not allowed. Accepted: ${acceptedFileTypes}`)
            if (onError) onError(`File type not allowed`)
            return
        }

        // 2. Check File Size
        if (selectedFile.size > maxFileSize * 1024 * 1024) {
            setStatus("error")
            setErrorMessage(`File size too large. Max: ${maxFileSize}MB`)
            if (onError) onError(`File size too large`)
            return
        }

        setFile(selectedFile)

        // 3. Determine Next Step
        if (receiverEmail) {
            setStatus("email_input")
        } else {
            // Standard simulated upload (no email configured)
            startUpload(selectedFile)
        }
    }

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!userEmail || !userEmail.includes("@")) {
            setErrorMessage("Please enter a valid email")
            return
        }
        setErrorMessage("")
        // Proceed to next step
        setStatus("details_input")
    }

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (file) {
            startUpload(file)
        }
    }

    const startUpload = async (fileToUpload: File) => {
        setStatus("uploading")
        setProgress(0)
        setErrorMessage("")
        if (onUploadStart) onUploadStart(fileToUpload)

        if (receiverEmail) {
            try {
                await uploadToEmail(fileToUpload)
                setStatus("success")
                if (onUploadComplete) onUploadComplete(fileToUpload)
            } catch (err) {
                setStatus("error")
                setErrorMessage(err instanceof Error ? err.message : "Upload failed")
                if (onError) onError(err instanceof Error ? err.message : "Upload failed")
            }
        } else if (simulateProgress) {
            // Standard simulation
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval)
                        setStatus("success")
                        if (onUploadComplete) onUploadComplete(fileToUpload)
                        return 100
                    }
                    return prev + Math.random() * 10
                })
            }, 200)
        } else {
            // Instant success if no email and no simulation
            setStatus("success")
            setProgress(100)
            if (onUploadComplete) onUploadComplete(fileToUpload)
        }
    }

    const uploadToEmail = (file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            const formData = new FormData()

            // Text fields (will appear in the email table)
            formData.append("email", userEmail) // Sets Reply-To
            formData.append("_subject", formTitle)
            formData.append("_template", "table")
            formData.append("_captcha", "false")

            formData.append("File Name", file.name)
            formData.append("File Size", `${(file.size / 1024 / 1024).toFixed(2)} MB`)
            formData.append("File Type", file.type)

            // New Fields
            if (locationDescription) formData.append("Location Description", locationDescription)
            if (gpsCoordinates) formData.append("GPS Coordinates", gpsCoordinates)

            // The File itself
            formData.append("attachment", file)

            const xhr = new XMLHttpRequest()

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    setProgress((e.loaded / e.total) * 100)
                }
            })

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve()
                    } else {
                        reject(new Error("Upload failed. Check your email activation."))
                    }
                }
            }

            xhr.open("POST", `https://formsubmit.co/${receiverEmail}`)
            xhr.send(formData)
        })
    }

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation()
        setFile(null)
        setStatus("idle")
        setProgress(0)
        setErrorMessage("")
        setUserEmail("")
        setLocationDescription("")
        setGpsCoordinates("")
        if (inputRef.current) inputRef.current.value = ""
    }

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
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

    // --- Render Logic ---

    // 1. Overlay Steps
    if (status === "email_input" || status === "details_input") {
        return (
            <div style={containerStyle}>
                <AnimatePresence mode="wait">
                    {status === "email_input" ? (
                        <motion.div
                            key="email-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
                        >
                            <div style={{ textAlign: "center", marginBottom: 8 }}>
                                <div style={{
                                    width: 48, height: 48, margin: "0 auto 12px",
                                    borderRadius: "50%", background: `${primaryColor}15`,
                                    display: "flex", alignItems: "center", justifyContent: "center", color: primaryColor
                                }}>
                                    <MailIcon />
                                </div>
                                <h4 style={{ margin: 0, fontSize: fontSize, color: "#111827" }}>Enter your email</h4>
                                <p style={{ margin: "4px 0 0", fontSize: fontSize - 2, color: textColor }}>We'll verify your submission</p>
                            </div>

                            <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={userEmail}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserEmail(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        border: "1px solid #E5E7EB",
                                        fontSize: fontSize,
                                        outline: "none",
                                        fontFamily: font.fontFamily
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        borderRadius: 8,
                                        background: primaryColor,
                                        color: "white",
                                        border: "none",
                                        fontSize: fontSize,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontFamily: font.fontFamily
                                    }}
                                >
                                    Next
                                </button>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    style={{
                                        background: "none", border: "none",
                                        color: textColor, fontSize: fontSize - 2,
                                        cursor: "pointer", marginTop: 4
                                    }}
                                >
                                    Cancel
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}
                        >
                            <div style={{ textAlign: "center", marginBottom: 8 }}>
                                <div style={{
                                    width: 48, height: 48, margin: "0 auto 12px",
                                    borderRadius: "50%", background: `${primaryColor}15`,
                                    display: "flex", alignItems: "center", justifyContent: "center", color: primaryColor
                                }}>
                                    <MapPinIcon />
                                </div>
                                <h4 style={{ margin: 0, fontSize: fontSize, color: "#111827" }}>Location Details</h4>
                                <p style={{ margin: "4px 0 0", fontSize: fontSize - 2, color: textColor }}>Add more context</p>
                            </div>

                            <form onSubmit={handleDetailsSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <input
                                    type="text"
                                    placeholder="What location is the picture clicked at?"
                                    value={locationDescription}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocationDescription(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        border: "1px solid #E5E7EB",
                                        fontSize: fontSize,
                                        outline: "none",
                                        fontFamily: font.fontFamily
                                    }}
                                />
                                <div style={{ position: "relative", width: "100%" }}>
                                    <input
                                        type="text"
                                        placeholder="GPS Coordinates (Optional)"
                                        value={gpsCoordinates}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGpsCoordinates(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            paddingRight: 40,
                                            borderRadius: 8,
                                            border: "1px solid #E5E7EB",
                                            fontSize: fontSize,
                                            outline: "none",
                                            fontFamily: font.fontFamily
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoLocation}
                                        title="Auto-detect Location"
                                        style={{
                                            position: "absolute",
                                            right: 8,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            color: isLocating ? primaryColor : textColor,
                                            cursor: "pointer",
                                            padding: 4,
                                            display: "flex",
                                            opacity: isLocating ? 0.5 : 1
                                        }}
                                    >
                                        <LocateIcon />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        borderRadius: 8,
                                        background: primaryColor,
                                        color: "white",
                                        border: "none",
                                        fontSize: fontSize,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontFamily: font.fontFamily
                                    }}
                                >
                                    Confirm & Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatus("email_input")}
                                    style={{
                                        background: "none", border: "none",
                                        color: textColor, fontSize: fontSize - 2,
                                        cursor: "pointer", marginTop: 4
                                    }}
                                >
                                    Back
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // 2. Active State (Uploading or Success or File Selected)
    if (status === "uploading" || status === "success" || (status === "idle" && file)) {
        return (
            <div style={containerStyle}>
                <motion.div
                    key="active"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ width: "100%", maxWidth: 300 }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: `${primaryColor}20`, color: primaryColor,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                            <FileIcon />
                        </div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                            <p style={{ margin: 0, fontSize: fontSize, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {file?.name}
                            </p>
                            <p style={{ margin: 0, fontSize: fontSize - 2, color: textColor }}>
                                {(file!.size / 1024 / 1024).toFixed(2)} MB • {status === "success" ? "Sent" : `${Math.round(progress)}%`}
                            </p>
                        </div>
                        {status === "success" ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: successColor }}><CheckIcon /></motion.div>
                        ) : null}
                        <button onClick={removeFile} style={{ border: "none", background: "transparent", color: textColor, cursor: "pointer", padding: 4, display: "flex" }}>
                            <RemoveIcon />
                        </button>
                    </div>

                    <div style={{ width: "100%", height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", bounce: 0 }}
                            style={{ height: "100%", background: status === "success" ? successColor : primaryColor, borderRadius: 3 }}
                        />
                    </div>
                </motion.div>
            </div>
        )
    }

    // 3. Default Idle/Error State
    return (
        <div
            style={containerStyle}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleFileInput}
                accept={acceptedFileTypes}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key="idle"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}
                >
                    <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: status === "error" ? `${errorColor}20` : `${primaryColor}20`,
                        color: status === "error" ? errorColor : primaryColor,
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        {status === "error" ? <ErrorIcon /> : <UploadIcon />}
                    </div>
                    <div style={{ textAlign: "center", pointerEvents: "none" }}>
                        <p style={{ margin: 0, fontSize: fontSize, fontWeight: 600, color: status === "error" ? errorColor : "#111827", marginBottom: 4 }}>
                            {status === "error" ? "Upload Failed" : heading}
                        </p>
                        <p style={{ margin: 0, fontSize: fontSize - 1, color: textColor }}>
                            {status === "error" ? errorMessage : subheading}
                        </p>
                    </div>
                </motion.div>
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
        max: 50
    },
    receiverEmail: {
        type: ControlType.String,
        title: "Send to Email",
        placeholder: "your@email.com",
        description: "Receive uploads via email"
    },
    formTitle: {
        type: ControlType.String,
        title: "Email Subject",
        defaultValue: "New Submission",
        hidden: (props) => !props.receiverEmail
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
        defaultValue: true,
        hidden: (props) => !!props.receiverEmail
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
