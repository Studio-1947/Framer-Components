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
        font?: {
            fontSize?: number
            fontFamily?: string
            fontWeight?: number | string
            fontStyle?: string
            letterSpacing?: string | number
            lineHeight?: string | number
        }
        fontSize: number
    }
    fontSettings?: {
        font?: {
            fontSize?: number
            fontFamily?: string
            fontWeight?: number | string
            fontStyle?: string
            letterSpacing?: string | number
            lineHeight?: string | number
        }
        fontSize: number
        tempFontSize: number
        labelFont?: {
            fontSize?: number
            fontFamily?: string
            fontWeight?: number | string
            fontStyle?: string
            letterSpacing?: string | number
            lineHeight?: string | number
        }
        labelFontSize: number
        labelColor: string
    }
    styling?: {
        backgroundColor: string
        textColor: string
        borderColor: string
        borderRadius: number
        padding: number
        gap: number
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
    fontSize?: number
    tempFontSize?: number
    labelColor?: string
    labelFontSize?: number
    refreshInterval?: number
    font?: {
        fontSize?: number
        fontFamily?: string
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string | number
        lineHeight?: string | number
    }
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
    
    const getFont = () => props.locationSettings?.font || props.fontSettings?.font || props.font || {}
    const getTempFontSize = () => props.fontSettings?.tempFontSize || props.tempFontSize || 26
    const getLabelFont = () => props.fontSettings?.labelFont || {}
    const getLabelColor = () => props.fontSettings?.labelColor || props.labelColor || "#6b7280"
    
    const getBackgroundColor = () => props.styling?.backgroundColor || props.backgroundColor || "transparent"
    const getTextColor = () => props.styling?.textColor || props.textColor || "#111827"
    const getBorderColor = () => props.styling?.borderColor || props.borderColor || "#E5E7EB"
    const getBorderRadius = () => props.styling?.borderRadius || props.borderRadius || 0
    const getPadding = () => props.styling?.padding || props.padding || 0
    const getGap = () => props.styling?.gap || props.gap || 16
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
        minWidth: "220px",
        lineHeight: "1.45",
        ...baseFont, // Apply font LAST so it doesn't get overridden
    }

    const locationStyle: React.CSSProperties = {
        textAlign: "left",
        marginTop: "4px",
        fontWeight: 600, // Keep location weight as 600
        color: getLabelColor(), // Use label color for location text
        ...labelFont, // Use label font for location text
    }

    const dataContainerStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "18px",
    }

    const metricStyle: React.CSSProperties = {
        textAlign: "left",
        flex: 1,
    }

    const valueStyle: React.CSSProperties = {
        fontSize: getTempFontSize(),
        fontWeight: 800, // Keep temperature values as 800 weight
        ...baseFont, // Apply base font but allow overrides above
    }

    const labelStyle: React.CSSProperties = {
        color: getLabelColor(),
        ...labelFont, // Apply label font LAST so it doesn't get overridden
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
      font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
          fontSize: 14,
          letterSpacing: "0em",
          lineHeight: "1.45em",
        },
      },
    },
  },
  fontSettings: {
    type: ControlType.Object,
    title: "Typography",
    controls: {
      tempFontSize: {
        type: ControlType.Number,
        title: "Temperature Font Size",
        defaultValue: 26,
        min: 12,
        max: 48,
        step: 1,
        displayStepper: true,
      },
      labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
          fontSize: 11,
          letterSpacing: "0em",
          lineHeight: "1.2em",
        },
      },
      labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#6b7280",
      },
    },
  },
  styling: {
    type: ControlType.Object,
    title: "Styling",
    controls: {
      textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111827",
      },
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
    },
  },
})

Weather.displayName = "Weather"
// #endregion
