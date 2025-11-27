import * as React from "react";
import { addPropertyControls, ControlType } from "framer";

interface ContactCardProps {
    name: string;
    designation: string;
    buttonTextDesktop: string;
    buttonTextMobile: string;
    primaryColor: string;
    hoverColor: string;
    backgroundPattern: boolean;
    image?: string | { src?: string; srcSet?: string; width?: number; height?: number };
    nameFont: {
        fontFamily: string
        fontWeight: string | number
        fontStyle: string
    }
    nameFontSize: number
    designationFont: {
        fontFamily: string
        fontWeight: string | number
        fontStyle: string
    }
    designationFontSize: number
    textAlign?: "left" | "center" | "right";
}

const isMobile = () => {
    if (typeof navigator !== "undefined") {
        return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    }
    return false;
};

export function ContactCard({
    name,
    designation,
    buttonTextDesktop,
    buttonTextMobile,
    primaryColor,
    hoverColor,
    backgroundPattern,
    image,
    nameFont = { fontFamily: "Inter", fontWeight: 700, fontStyle: "normal" },
    nameFontSize = 22,
    designationFont = { fontFamily: "Inter", fontWeight: 400, fontStyle: "normal" },
    designationFontSize = 16,
    textAlign = "left"
}: ContactCardProps) {
    const [hovered, setHovered] = React.useState(false);
    const isMobileDevice = isMobile();
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
                background: hovered ? hoverColor : primaryColor,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                position: "relative",
                transition: "background 0.2s",
                overflow: "hidden"
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {image && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "50%",
                        overflow: "hidden"
                    }}
                >
                    <img
                        src={typeof image === "string" ? image : image?.src || ""}
                        alt="Contact Card Image"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block"
                        }}
                    />
                </div>
            )}
            {backgroundPattern && !image && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "70%",
                        backgroundImage:
                            "repeating-linear-gradient(135deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 2px, transparent 2px, transparent 12px)",
                        pointerEvents: "none"
                    }}
                />
            )}
            <div style={{
                position: "relative",
                zIndex: 2,
                padding: "24px 20px 20px 20px",
                background: hovered ? hoverColor : "#fff",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                minHeight: 120,
                paddingTop: image ? 12 : 24,
                height: image ? "50%" : undefined,
                display: "flex",
                flexDirection: "column",
                alignItems: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
                textAlign: textAlign
            }}>
                {/* Image moved to top full-bleed container */}
                <div style={{
                    fontWeight: nameFont.fontWeight,
                    fontSize: nameFontSize,
                    fontFamily: nameFont.fontFamily,
                    fontStyle: nameFont.fontStyle,
                    color: hovered ? "#222" : "#222"
                }}>{name}</div>
                <div style={{
                    fontWeight: designationFont.fontWeight,
                    fontSize: designationFontSize,
                    fontFamily: designationFont.fontFamily,
                    fontStyle: designationFont.fontStyle,
                    color: hovered ? "#222" : "#888",
                    marginTop: 4
                }}>{designation}</div>
                <button
                    style={{
                        marginTop: 18,
                        padding: "10px 18px",
                        borderRadius: 50,
                        border: "none",
                        background: hovered ? "#222" : "#FFC72C",
                        color: hovered ? "#FFC72C" : "#222",
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: "pointer",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        transition: "background 0.2s, color 0.2s"
                    }}
                    onClick={() => {
                        if (isMobileDevice) {
                            window.open("tel:");
                        } else {
                            // Download vCard logic placeholder
                            alert("Download Contact feature coming soon.");
                        }
                    }}
                >
                    {isMobileDevice ? buttonTextMobile : buttonTextDesktop}
                </button>
            </div>
        </div>
    );
}

addPropertyControls(ContactCard, {

    // Name typography
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
            systemFont: true
        }
    },
    nameFontSize: {
        type: ControlType.Number,
        title: "Name Size",
        min: 10,
        max: 48,
        defaultValue: 22
    },
    // Designation typography
    designationFont: {
        type: ControlType.Font,
        title: "Designation Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            systemFont: true
        }
    },
    designationFontSize: {
        type: ControlType.Number,
        title: "Designation Size",
        min: 10,
        max: 36,
        defaultValue: 16
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image"
    },
    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "John Doe"
    },
    designation: {
        type: ControlType.String,
        title: "Designation",
        defaultValue: "Product Designer"
    },
    buttonTextDesktop: {
        type: ControlType.String,
        title: "Button Text (Desktop)",
        defaultValue: "Download Contact"
    },
    buttonTextMobile: {
        type: ControlType.String,
        title: "Button Text (Mobile)",
        defaultValue: "Open Dialer"
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#fff"
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#FFC72C"
    },
    backgroundPattern: {
        type: ControlType.Boolean,
        title: "Pattern",
        defaultValue: true
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true
    }
});
