import React, { useState, useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

// #region Type Definitions
interface WeatherProps {
    style?: React.CSSProperties
    locationSettings?: {
        location: string
        latitude: number
        longitude: number
        refreshInterval: number

        typography: {
            font: {
                fontFamily: string
                fontWeight: string | number
                fontStyle: string
            }
            letterSpacing: number
            lineHeight: number
            fontSize: number
            color: string
        }
    }
    labelSettings?: {
        typography: {
            font: {
                fontFamily: string
                fontWeight: string | number
                fontStyle: string
            }
            fontSize: number
            letterSpacing: number
            lineHeight: number
            color: string
        }
    }
    styling?: {
        backgroundColor: string
        borderColor: string
        borderRadius: number
        padding: number

        gap: number
        alignment: "left" | "center" | "right"
    }
    // Keep backward compatibility with direct props
    location?: string
    latitude?: number
    longitude?: number
    backgroundColor?: string
    textColor?: string
    borderColor?: string
    borderRadius?: number
    padding?: number
    gap?: number
    alignment?: "left" | "center" | "right"
    fontSize?: number
    tempFontSize?: number
    labelColor?: string
    labelFontSize?: number
    refreshInterval?: number

}

interface WeatherData {
    temperature: number | null
    aqi: number | null
    loading: boolean
    error: string | null
}
// #endregion

// #region Utility Functions
// Simple font utility - just return the font object as-is (Framer handles the rest)
export function getFontStyle(font?: any) {
    return font || {}
}
// #endregion

export default function Weather(props: WeatherProps) {
    // #region Helper Functions for Props
    const getLocation = () => props.locationSettings?.location || props.location || "Mirik, Darjeeling"
    const getLatitude = () => props.locationSettings?.latitude || props.latitude || 26.888169444444443
    const getLongitude = () => props.locationSettings?.longitude || props.longitude || 88.19006944444445
    const getRefreshInterval = () => props.locationSettings?.refreshInterval || props.refreshInterval || 3600

    const getFont = () => props.locationSettings?.typography?.font || { fontFamily: "Inter", fontWeight: 400, fontStyle: "normal" }
    const getFontSize = () => props.locationSettings?.typography?.fontSize || props.fontSize || 14
    const getLetterSpacing = () => props.locationSettings?.typography?.letterSpacing || 0
    const getLineHeight = () => props.locationSettings?.typography?.lineHeight || 1.45

    const getTempFontSize = () => getFontSize()

    const getLabelFont = () => props.labelSettings?.typography?.font || { fontFamily: "Inter", fontWeight: 400, fontStyle: "normal" }
    const getLabelFontSize = () => props.labelSettings?.typography?.fontSize || props.labelFontSize || 11
    const getLabelLetterSpacing = () => props.labelSettings?.typography?.letterSpacing || 0
    const getLabelLineHeight = () => props.labelSettings?.typography?.lineHeight || 1.2
    const getLabelColor = () => props.labelSettings?.typography?.color || props.labelColor || "#6b7280"

    const getBackgroundColor = () => props.styling?.backgroundColor || props.backgroundColor || "transparent"
    const getTextColor = () => props.locationSettings?.typography?.color || props.textColor || "#111827"
    const getBorderColor = () => props.styling?.borderColor || props.borderColor || "#E5E7EB"
    const getBorderRadius = () => props.styling?.borderRadius || props.borderRadius || 0
    const getPadding = () => props.styling?.padding || props.padding || 0
    const getGap = () => props.styling?.gap || props.gap || 16
    const getAlignment = () => props.styling?.alignment || props.alignment || "left"
    // #endregion

    // #region State and Logic
    const [weatherData, setWeatherData] = useState<WeatherData>({
        temperature: null,
        aqi: null,
        loading: true,
        error: null,
    })

    const fetchWeatherData = async () => {
        try {
            setWeatherData((prev) => ({ ...prev, loading: true, error: null }))

            const wxURL = `https://api.open-meteo.com/v1/forecast?latitude=${getLatitude()}&longitude=${getLongitude()}&current=temperature_2m&timezone=auto`
            const aqURL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${getLatitude()}&longitude=${getLongitude()}&current=us_aqi&timezone=auto`

            const [wxResponse, aqResponse] = await Promise.all([
                fetch(wxURL),
                fetch(aqURL),
            ])

            const [wx, aq] = await Promise.all([
                wxResponse.json(),
                aqResponse.json(),
            ])

            const temperature = wx?.current?.temperature_2m ?? null
            const aqi = aq?.current?.us_aqi ?? null

            setWeatherData({
                temperature,
                aqi,
                loading: false,
                error: null,
            })
        } catch (err) {
            console.error("Weather fetch error:", err)
            setWeatherData({
                temperature: null,
                aqi: null,
                loading: false,
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch weather data",
            })
        }
    }

    useEffect(() => {
        fetchWeatherData()

        const refreshInterval = getRefreshInterval()
        if (refreshInterval > 0) {
            const interval = setInterval(
                fetchWeatherData,
                refreshInterval * 1000 // Convert seconds to milliseconds
            )
            return () => clearInterval(interval)
        }
    }, [getLatitude(), getLongitude(), getRefreshInterval()])
    // #endregion

    // #region Styling
    const baseFont = getFont()
    const labelFont = getLabelFont()

    const containerStyle: React.CSSProperties = {
        ...props.style,
        position: "relative",
        background: getBackgroundColor(),
        color: getTextColor(),
        display: "flex",
        flexDirection: "column",
        gap: `${getGap()}px`,
        padding: `${getPadding()}px`,
        border: "none",
        borderRadius: "0px",
        lineHeight: "1.45",
        alignItems: getAlignment() === "center" ? "center" : getAlignment() === "right" ? "flex-end" : "flex-start",
        textAlign: getAlignment() as any,
        fontFamily: baseFont.fontFamily,
        fontWeight: baseFont.fontWeight,
        fontStyle: baseFont.fontStyle,
        fontSize: getFontSize(),
        letterSpacing: getLetterSpacing(),
        lineHeight: getLineHeight(),
    }

    const locationStyle: React.CSSProperties = {
        textAlign: getAlignment() as any,
        marginTop: "4px",
        fontWeight: 600, // Keep location weight as 600
        color: getLabelColor(), // Use label color for location text
        fontFamily: labelFont.fontFamily,
        fontWeight: labelFont.fontWeight,
        fontStyle: labelFont.fontStyle,
        fontSize: getLabelFontSize(),
        letterSpacing: getLabelLetterSpacing(),
        lineHeight: getLabelLineHeight(),
        whiteSpace: "nowrap",
    }

    const dataContainerStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: getAlignment() === "center" ? "center" : getAlignment() === "right" ? "flex-end" : "flex-start",
        alignItems: "center",
        gap: "18px",
    }

    const metricStyle: React.CSSProperties = {
        textAlign: getAlignment() as any,
        flex: 1,
    }

    const valueStyle: React.CSSProperties = {
        fontSize: getTempFontSize(),
        fontWeight: 800, // Keep temperature values as 800 weight
        fontFamily: baseFont.fontFamily,
        fontStyle: baseFont.fontStyle,
        whiteSpace: "nowrap",
    }

    const labelStyle: React.CSSProperties = {
        color: getLabelColor(),
        fontFamily: labelFont.fontFamily,
        fontWeight: labelFont.fontWeight,
        fontStyle: labelFont.fontStyle,
        fontSize: getLabelFontSize(),
        letterSpacing: getLabelLetterSpacing(),
        lineHeight: getLabelLineHeight(),
        whiteSpace: "nowrap",
    }

    const dividerStyle: React.CSSProperties = {
        width: "1px",
        background: "#E5E7EB",
        height: "40px",
        alignSelf: "center",
    }
    // #endregion

    // #region Render
    const formatTemperature = (temp: number | null) => {
        if (temp === null) return "—"
        return `${Math.round(temp)}°`
    }

    const formatAQI = (aqi: number | null) => {
        if (aqi === null) return "—"
        return Math.round(aqi).toString()
    }

    return (
        <div style={containerStyle}>
            <div style={dataContainerStyle}>
                <div style={metricStyle}>
                    <div style={valueStyle}>
                        {weatherData.loading
                            ? "—"
                            : formatTemperature(weatherData.temperature)}
                    </div>
                    <div style={labelStyle}>Temp (°C)</div>
                </div>
                <div style={dividerStyle}></div>
                <div style={metricStyle}>
                    <div style={valueStyle}>
                        {weatherData.loading ? "—" : formatAQI(weatherData.aqi)}
                    </div>
                    <div style={labelStyle}>AQI</div>
                </div>
            </div>
            <div style={locationStyle}>{getLocation()}</div>
            {weatherData.error && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        fontSize: "12px",
                        color: "#ef4444",
                        marginTop: "4px",
                    }}
                >
                    Error: {weatherData.error}
                </div>
            )}
        </div>
    )
    // #endregion
}

// #region Property Controls
Weather.defaultProps = {
    location: "Mirik, Darjeeling",
    latitude: 26.888169444444443,
    longitude: 88.19006944444445,
    backgroundColor: "transparent",
    textColor: "#111827",
    borderColor: "#E5E7EB",
    borderRadius: 0,
    padding: 0,

    gap: 16,
    alignment: "left" as const,
    fontSize: 14,
    tempFontSize: 26,
    labelColor: "#6b7280",
    labelFontSize: 11,
    refreshInterval: 3600, // seconds (1 hour)
}

addPropertyControls(Weather, {
    locationSettings: {
        type: ControlType.Object,
        title: "Location & Settings",
        controls: {
            location: {
                type: ControlType.String,
                title: "Location",
                defaultValue: "Mirik, Darjeeling",
            },
            latitude: {
                type: ControlType.Number,
                title: "Latitude",
                defaultValue: 26.888169444444443,
                step: 0.000001,
                displayStepper: true,
            },
            longitude: {
                type: ControlType.Number,
                title: "Longitude",
                defaultValue: 88.19006944444445,
                step: 0.000001,
                displayStepper: true,
            },
            refreshInterval: {
                type: ControlType.Number,
                title: "Refresh Interval (seconds)",
                defaultValue: 3600,
                min: 0,
                max: 86400,
                step: 60,
                displayStepper: true,
            },

            typography: {
                type: ControlType.Object,
                title: "Typography",
                controls: {
                    font: {
                        type: ControlType.Font,
                        title: "Font",
                        defaultValue: {
                            fontFamily: "Inter",
                            fontWeight: 400,
                            fontStyle: "normal",
                        },
                    },
                    fontSize: {
                        type: ControlType.Number,
                        title: "Size",
                        defaultValue: 14,
                        min: 8,
                        max: 48,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Spacing",
                        defaultValue: 0,
                        min: -5,
                        max: 10,
                        step: 0.1,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line Ht",
                        defaultValue: 1.45,
                        min: 0.8,
                        max: 2,
                        step: 0.1,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#111827",
                    },
                }
            },
        },
    },
    labelSettings: {
        type: ControlType.Object,
        title: "Label",
        controls: {
            typography: {
                type: ControlType.Object,
                title: "Typography",
                controls: {
                    font: {
                        type: ControlType.Font,
                        title: "Font",
                        defaultValue: {
                            fontFamily: "Inter",
                            fontWeight: 400,
                            fontStyle: "normal",
                        },
                    },
                    fontSize: {
                        type: ControlType.Number,
                        title: "Size",
                        defaultValue: 11,
                        min: 8,
                        max: 32,
                        step: 1,
                    },
                    letterSpacing: {
                        type: ControlType.Number,
                        title: "Spacing",
                        defaultValue: 0,
                        min: -5,
                        max: 10,
                        step: 0.1,
                    },
                    lineHeight: {
                        type: ControlType.Number,
                        title: "Line Ht",
                        defaultValue: 1.2,
                        min: 0.8,
                        max: 2,
                        step: 0.1,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#6b7280",
                    },
                }
            },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Styling",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 0,
                min: 0,
                max: 50,
                step: 1,
                displayStepper: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 16,
                min: 0,
                max: 50,
                step: 1,

                displayStepper: true,
            },
            alignment: {
                type: ControlType.Enum,
                title: "Alignment",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
            },
        },
    },
})

Weather.displayName = "Weather"
// #endregion
