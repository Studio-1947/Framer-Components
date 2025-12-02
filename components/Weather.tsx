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
        iconColor?: string
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
    weatherCode: number | null
    loading: boolean
    error: string | null
}
// #endregion

// #region Utility Functions
// Simple font utility - just return the font object as-is (Framer handles the rest)
export function getFontStyle(font?: any) {
    return font || {}
}

// WMO Weather Codes mapping to SVG paths
const getWeatherIcon = (code: number | null) => {
    if (code === null) return null

    // Simple mapping for common codes
    // 0: Clear sky
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    // 45, 48: Fog
    // 51, 53, 55: Drizzle
    // 61, 63, 65: Rain
    // 71, 73, 75: Snow
    // 80, 81, 82: Rain showers
    // 95, 96, 99: Thunderstorm

    let path = ""

    // Sun / Clear
    if (code === 0) {
        path = "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"
    }
    // Cloud / Overcast
    else if (code >= 1 && code <= 3) {
        path = "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"
    }
    // Rain / Drizzle
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        path = "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" // Placeholder for rain, using generic shape for now or better path
        path = "M4.13 12c-.23-.59-.35-1.22-.35-1.88C3.78 6.98 6.28 4.43 9.4 4.05c.03-.01.07-.01.1-.01 2.17 0 4.07 1.15 5.12 2.89.4-.1.82-.16 1.25-.16 2.85 0 5.18 2.23 5.18 5.03 0 2.79-2.31 5.02-5.1 5.02H5.1C2.33 16.82.09 14.63.09 11.9c0-.9.25-1.74.69-2.47l1.45 1.45c-.15.32-.24.68-.24 1.05 0 1.38 1.12 2.5 2.5 2.5H15.9c1.65 0 3-1.35 3-3s-1.35-3-3-3c-.25 0-.5.04-.73.11L14.5 9.25c-.27-1.63-1.69-2.88-3.4-2.88-1.58 0-2.9 1.05-3.32 2.48l-3.65 3.15zM11.5 18.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-5 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm10 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"
    }
    // Snow
    else if (code >= 71 && code <= 77) {
        path = "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM15 13l-2.5-1.5L15 10l2.5 1.5L15 13zm-6 0l-2.5-1.5L9 10l2.5 1.5L9 13zm3-4l2.5 1.5-2.5 1.5-2.5-1.5L12 9z"
    }
    // Thunderstorm
    else if (code >= 95 && code <= 99) {
        path = "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14.5 19L13 22h-2l1.5-3h-3l1.5-3h2l-1.5 3h3z"
    }
    // Fog / Default
    else {
        path = "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
    }

    return (
        <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ fill: "currentColor" }}>
            <path d={path} />
        </svg>
    )
}
// #endregion

export default function Weather(props: WeatherProps) {
    // #region Helper Functions for Props
    const getLocation = () => props.locationSettings?.location || props.location || "Mirik, Darjeeling India"
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
    const getIconColor = () => props.styling?.iconColor || getTextColor()
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
        weatherCode: null,
        loading: true,
        error: null,
    })

    const fetchWeatherData = async () => {
        const lat = getLatitude()
        const lon = getLongitude()
        const cacheKey = `weather_${lat}_${lon}`
        const cached = localStorage.getItem(cacheKey)

        // Load from cache if valid (less than 1 hour old)
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached)
                const age = Date.now() - timestamp
                if (age < 3600 * 1000) {
                    setWeatherData({ ...data, loading: false, error: null })
                    // If cache is fresh enough, we might not need to fetch immediately, 
                    // but usually good to update in background or just use cache.
                    // For now, let's use cache and return, but maybe fetch if > 10 mins old?
                    // Simpler: just use cache and fetch fresh data to update it.
                    setWeatherData(prev => ({ ...prev, ...data, loading: false }))
                }
            } catch (e) {
                // Ignore cache errors
            }
        }

        try {
            // Don't set loading true if we have data, to avoid flicker
            // setWeatherData((prev) => ({ ...prev, loading: true, error: null }))

            const wxURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&timezone=auto`
            const aqURL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`

            // Retry logic
            let attempts = 0
            const maxAttempts = 3
            let wxResponse, aqResponse

            while (attempts < maxAttempts) {
                try {
                    [wxResponse, aqResponse] = await Promise.all([
                        fetch(wxURL),
                        fetch(aqURL),
                    ])
                    if (wxResponse.ok && aqResponse.ok) break
                } catch (e) {
                    attempts++
                    if (attempts >= maxAttempts) throw e
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts)))
                }
            }

            if (!wxResponse || !aqResponse) throw new Error("Failed to fetch")

            const [wx, aq] = await Promise.all([
                wxResponse.json(),
                aqResponse.json(),
            ])

            const temperature = wx?.current?.temperature_2m ?? null
            const weatherCode = wx?.current?.weathercode ?? null
            const aqi = aq?.current?.us_aqi ?? null

            const newData = {
                temperature,
                aqi,
                weatherCode,
                loading: false,
                error: null,
            }

            setWeatherData(newData)

            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: newData
            }))

        } catch (err) {
            console.error("Weather fetch error:", err)
            // If we have cached data, keep showing it but maybe show error? 
            // For now, just set error if no data
            setWeatherData(prev => ({
                ...prev,
                loading: false,
                error: prev.temperature !== null ? null : (err instanceof Error ? err.message : "Failed to fetch")
            }))
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
        display: "flex",
        alignItems: "center",
        gap: "8px",
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
                        {weatherData.loading && weatherData.temperature === null
                            ? "—"
                            : (
                                <>
                                    {getWeatherIcon(weatherData.weatherCode) && (
                                        <div style={{ width: "1.2em", height: "1.2em", color: getIconColor() }}>
                                            {getWeatherIcon(weatherData.weatherCode)}
                                        </div>
                                    )}
                                    {formatTemperature(weatherData.temperature)}
                                </>
                            )}
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
    location: "Mirik, Darjeeling India",
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
                defaultValue: "Mirik, Darjeeling India",
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
