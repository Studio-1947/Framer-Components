import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"
import { ResponsiveContainer, LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

// #region Data Parsing & Utility Functions

// Minimal CSV parser
function parseCsv(text: string): string[][] {
    const rows: string[][] = []
    let field = ""
    let row: string[] = []
    let i = 0
    let inQuotes = false

    const input = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

    while (i < input.length) {
        const char = input[i]
        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < input.length && input[i + 1] === '"') {
                    field += '"'
                    i += 2
                    continue
                } else {
                    inQuotes = false
                    i++
                    continue
                }
            } else {
                field += char
                i++
                continue
            }
        } else {
            if (char === '"') {
                inQuotes = true
                i++
                continue
            }
            if (char === ",") {
                row.push(field)
                field = ""
                i++
                continue
            }
            if (char === "\n") {
                row.push(field)
                rows.push(row)
                row = []
                field = ""
                i++
                continue
            }
            field += char
            i++
        }
    }

    row.push(field)
    rows.push(row)
    return rows
}

function parseCsvToObjects(csvText: string): Record<string, unknown>[] {
    const rows = parseCsv(csvText).filter((r) =>
        r.some((cell) => (cell ?? "").toString().trim() !== "")
    )
    if (rows.length < 2) {
        throw new Error("Sheet must have at least a header row and one data row")
    }
    const headers = rows[0].map((h) => h.replace(/"/g, "").trim())
    const dataRows = rows.slice(1)
    return dataRows.map((values) => {
        const obj: Record<string, unknown> = {}
        headers.forEach((h, idx) => {
            obj[h] = (values[idx] ?? "").toString().trim()
        })
        return obj
    })
}

// Google Sheets URL helpers
const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
}

const extractGid = (url: string): string | null => {
    const gidMatch = url.match(/[?#]gid=(\d+)/)
    return gidMatch ? gidMatch[1] : null
}

// Series name formatting
const prettySeriesName = (key: string): string => {
    const k = (key || "").trim().toLowerCase()
    if (k === "credit" || k === "credits") return "Donation Received"
    if (k === "debit" || k === "debits") return "Expenses"
    return key
}

// #endregion

// #region Type Definitions
interface DynamicGraphProps {
    googleSheetsUrl: string
    useApiKey: boolean
    apiKey: string
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    showGrid: boolean
    showLegend: boolean
    showTooltip: boolean
    animationDuration: number
    title: string
    subtitle: string
    width: number
    height: number
    autoRefresh: boolean
    refreshInterval: number
    customStyling: {
        fontFamily: string
        useProjectFonts?: boolean
        fontSize: number
        titleSize: number
        subtitleSize: number
        labelSize: number
        titleColor: string
        subtitleColor: string
        labelColor: string
        gridColor: string
        borderRadius: number
        padding: number
        titleWeight: string
        subtitleWeight: string
        enableMobileResponsive?: boolean
    }
}

interface ProcessedData {
    data: Record<string, unknown>[]
    chartType: "bar" | "line"
    xKey: string
    yKeys: string[]
    categories: string[]
}
// #endregion

const COLOR_PALETTE = [
    "#8884d8", "#000000", "#ffc658", "#ff7c7c", "#8dd1e1",
    "#d084d0", "#ffb347", "#87ceeb", "#dda0dd", "#98fb98",
]

// Data structure analysis
const analyzeDataStructure = (
    rawData: Record<string, unknown>[],
    selectedChartType: "bar" | "line"
): ProcessedData => {
    if (!rawData?.length) {
        throw new Error("No data available")
    }

    const headers = Object.keys(rawData[0])
    const numericColumns: string[] = []
    const categoricalColumns: string[] = []
    const dateColumns: string[] = []

    // Analyze columns
    headers.forEach((header) => {
        const sampleValues = rawData.slice(0, 10).map((row) => row[header])

        const isDate = sampleValues.some(
            (val) => val && !isNaN(Date.parse(val as string)) && isNaN(Number(val))
        )

        const isNumeric = sampleValues.every(
            (val) => val === null || val === undefined || val === "" || !isNaN(Number(val))
        )

        if (isDate) {
            dateColumns.push(header)
        } else if (isNumeric) {
            numericColumns.push(header)
        } else {
            categoricalColumns.push(header)
        }
    })

    // Determine axes
    let xKey = ""
    let yKeys: string[] = []

    if (dateColumns.length > 0) {
        xKey = dateColumns[0]
        yKeys = numericColumns
    } else if (categoricalColumns.length > 0) {
        xKey = categoricalColumns[0]
        yKeys = numericColumns
    } else {
        xKey = headers[0]
        yKeys = headers.slice(1)
    }

    // Process data
    const processedData = rawData
        .map((row) => {
            const processedRow: Record<string, unknown> = {}
            headers.forEach((header) => {
                let value = row[header]

                if (numericColumns.includes(header) && value !== null && value !== undefined && value !== "") {
                    value = Number(value)
                }

                if (dateColumns.includes(header) && value) {
                    const date = new Date(value as string)
                    value = date.toLocaleDateString()
                }

                processedRow[header] = value
            })
            return processedRow
        })
        .filter((row) => row[xKey] !== null && row[xKey] !== undefined && row[xKey] !== "")

    return {
        data: processedData,
        chartType: selectedChartType,
        xKey,
        yKeys: yKeys.slice(0, 5),
        categories: categoricalColumns,
    }
}

export default function DynamicGraph(props: DynamicGraphProps) {
    // #region State
    const [data, setData] = useState<ProcessedData | null>(null)
    const [rawRows, setRawRows] = useState<Record<string, unknown>[] | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [lastFetch, setLastFetch] = useState<Date | null>(null)
    const [selectedChartType, setSelectedChartType] = useState<"bar" | "line">("bar")
    const instanceClass = useRef<string>(`dgbox-${Math.random().toString(36).slice(2)}`)
    const fetchControllerRef = useRef<AbortController | null>(null)
    // #endregion

    const resolvedFontFamily = props.customStyling.useProjectFonts ? "inherit" : props.customStyling.fontFamily

    // #region Data Fetching
    const fetchData = useCallback(async () => {
        if (!props.googleSheetsUrl) {
            setError("Please provide a Google Sheets URL")
            return
        }

        setLoading(true)
        setError(null)

        try {
            const sheetId = extractSheetId(props.googleSheetsUrl)
            if (!sheetId) {
                throw new Error("Invalid Google Sheets URL")
            }

            const gid = extractGid(props.googleSheetsUrl) || "0"

            if (fetchControllerRef.current) {
                fetchControllerRef.current.abort()
            }
            const controller = new AbortController()
            fetchControllerRef.current = controller

            let apiUrl: string
            if (props.useApiKey && props.apiKey?.trim()) {
                apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=${encodeURIComponent(props.apiKey.trim())}`
            } else {
                // Fallback to public CSV export when API key is not provided or useApiKey is false
                apiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
            }

            const response = await fetch(apiUrl, { signal: controller.signal })
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`)
            }

            let rawData: Record<string, unknown>[]

            if (props.useApiKey && props.apiKey?.trim()) {
                const result = await response.json()
                if (!result.values?.length) {
                    throw new Error("No data found in the sheet")
                }

                const [headers, ...rows] = result.values as string[][]
                rawData = rows
                    .map((row: string[]) => {
                        const obj: Record<string, unknown> = {}
                        headers.forEach((header: string, index: number) => {
                            obj[header] = row[index] ?? ""
                        })
                        return obj
                    })
                    .filter((obj) => Object.values(obj).some((val) => val !== ""))
            } else {
                const csvText = await response.text()
                if (!csvText?.trim()) {
                    throw new Error("No data found. Ensure sheet is public and accessible.")
                }

                rawData = parseCsvToObjects(csvText).filter((obj) => {
                    // Only filter out completely empty rows, not rows with some empty cells
                    const values = Object.values(obj)
                    return values.length > 0 && values.some((val) => val !== null && val !== undefined && String(val).trim() !== "")
                })
            }

            setRawRows(rawData)
            const processedData = analyzeDataStructure(rawData, selectedChartType)
            setData(processedData)
            setLastFetch(new Date())
        } catch (err) {
            const isAbort = (err as any)?.name === "AbortError" ||
                (err instanceof DOMException && err.name === "AbortError")
            if (!isAbort) {
                setError(err instanceof Error ? err.message : "Failed to fetch data")
            }
        } finally {
            setLoading(false)
        }
    }, [props.googleSheetsUrl, props.useApiKey, props.apiKey])

    useEffect(() => {
        if (rawRows) {
            try {
                const processed = analyzeDataStructure(rawRows, selectedChartType)
                setData(processed)
            } catch (_) {
                // Ignore analysis errors
            }
        }
    }, [selectedChartType, rawRows])

    useEffect(() => {
        fetchData()
        return () => {
            if (fetchControllerRef.current) {
                fetchControllerRef.current.abort()
            }
        }
    }, [fetchData])

    useEffect(() => {
        if (props.autoRefresh && props.refreshInterval > 0) {
            const id = setInterval(fetchData, props.refreshInterval * 1000)
            return () => clearInterval(id)
        }
    }, [props.autoRefresh, props.refreshInterval, fetchData])
    // #endregion

    // #region Memoized Values


    const tickLabelStyle = useMemo(
        () => ({
            fontSize: props.customStyling.labelSize,
            fill: props.customStyling.labelColor,
            fontFamily: resolvedFontFamily,
        }),
        [props.customStyling.labelSize, props.customStyling.labelColor, resolvedFontFamily]
    )

    const tooltipContentStyle = useMemo<React.CSSProperties>(() => ({
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        border: `1px solid ${props.customStyling.gridColor}`,
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        fontFamily: resolvedFontFamily,
        fontSize: props.customStyling.fontSize,
        maxWidth: "200px",
    }), [props.customStyling.gridColor, resolvedFontFamily, props.customStyling.fontSize])

    const legendWrapperStyle = useMemo<React.CSSProperties>(() => ({
        fontFamily: resolvedFontFamily,
        fontSize: props.customStyling.fontSize,
        paddingTop: 8,
    }), [resolvedFontFamily, props.customStyling.fontSize])

    const axisLineStyle = useMemo(() => ({
        stroke: props.customStyling.gridColor,
        strokeWidth: 1,
    }), [props.customStyling.gridColor])

    const tickLineStyle = axisLineStyle


    // #endregion

    // #region Render Functions
    const renderChart = () => {
        if (!data?.data.length) {
            return (
                <div style={{
                    textAlign: "center", padding: "16px", color: props.customStyling.labelColor,
                    fontSize: props.customStyling.fontSize, fontFamily: resolvedFontFamily,
                    backgroundColor: "transparent", borderRadius: 6,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}>
                    📊 No chart data available
                </div>
            )
        }

        const commonProps = {
            data: data.data,
            margin: { top: 0, right: 0, left: 0, bottom: 0 },
        }

        switch (selectedChartType) {
            case "line":
                return (
                    <LineChart {...commonProps} style={{ background: "transparent" }}>
                        {props.showGrid && (
                            <CartesianGrid strokeDasharray="5 5" stroke={props.customStyling.gridColor} strokeOpacity={0.5} />
                        )}
                        <XAxis
                            dataKey={data.xKey} tick={tickLabelStyle} angle={-45}
                            textAnchor="end" height={50} tickMargin={2}
                            axisLine={{ stroke: props.customStyling.gridColor, strokeWidth: 1 }}
                            tickLine={{ stroke: props.customStyling.gridColor, strokeWidth: 1 }}
                        />
                        <YAxis
                            tick={tickLabelStyle}
                            axisLine={{ stroke: props.customStyling.gridColor, strokeWidth: 1 }}
                            tickLine={{ stroke: props.customStyling.gridColor, strokeWidth: 1 }}
                        />
                        {props.showTooltip && (
                            <Tooltip
                                contentStyle={tooltipContentStyle}
                                labelStyle={{ color: props.customStyling.titleColor, fontWeight: "600" }}
                                itemStyle={{ color: props.customStyling.labelColor }}
                                cursor={{ fill: "rgba(136, 132, 216, 0.1)" }}
                                isAnimationActive={false}
                            />
                        )}
                        {props.showLegend && (
                            <Legend wrapperStyle={legendWrapperStyle} iconType="line" />
                        )}
                        {data.yKeys.map((key: string, index: number) => (
                            <Line
                                key={key} type="monotone" dataKey={key}
                                name={prettySeriesName(key)}
                                stroke={index === 0 ? props.primaryColor : COLOR_PALETTE[index % COLOR_PALETTE.length]}
                                strokeWidth={3}
                                dot={{ fill: index === 0 ? props.primaryColor : COLOR_PALETTE[index % COLOR_PALETTE.length], strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: index === 0 ? props.primaryColor : COLOR_PALETTE[index % COLOR_PALETTE.length], strokeWidth: 2, fill: "#ffffff" }}
                                animationDuration={props.animationDuration}
                            />
                        ))}
                    </LineChart>
                )

            case "bar":
                return (
                    <BarChart {...commonProps} barCategoryGap="0%" barGap={0} style={{ background: "transparent" }}>
                        {props.showGrid && (
                            <CartesianGrid strokeDasharray="5 5" stroke={props.customStyling.gridColor} strokeOpacity={0.5} />
                        )}
                        <XAxis
                            dataKey={data.xKey} tick={tickLabelStyle} angle={-45}
                            textAnchor="end" height={50} tickMargin={2}
                            axisLine={axisLineStyle}
                            tickLine={tickLineStyle}
                        />
                        <YAxis
                            tick={tickLabelStyle}
                            axisLine={axisLineStyle}
                            tickLine={tickLineStyle}
                        />
                        {props.showTooltip && (
                            <Tooltip
                                cursor={{ fill: "rgba(136, 132, 216, 0.1)" }}
                                contentStyle={tooltipContentStyle}
                                labelStyle={{ color: props.customStyling.titleColor, fontWeight: "600" }}
                                itemStyle={{ color: props.customStyling.labelColor }}
                                isAnimationActive={false}
                            />
                        )}
                        {props.showLegend && (
                            <Legend wrapperStyle={legendWrapperStyle} iconType="rect" />
                        )}
                        {data.yKeys.map((key: string, index: number) => (
                            <Bar
                                key={key} dataKey={key} name={prettySeriesName(key)}
                                fill={index === 0 ? props.primaryColor : COLOR_PALETTE[index % COLOR_PALETTE.length]}
                                radius={[4, 4, 0, 0]}
                                animationDuration={props.animationDuration}
                                activeBar={{
                                    style: {
                                        transform: "scaleY(1.05)",
                                        transformOrigin: "center bottom",
                                        transition: "transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), filter 0.3s ease",
                                        filter: "brightness(1.1)",
                                        cursor: "pointer",
                                    },
                                }}
                            />
                        ))}
                    </BarChart>
                )

            default:
                return (
                    <div style={{
                        textAlign: "center", padding: "16px", color: props.customStyling.labelColor,
                        fontSize: props.customStyling.fontSize, fontFamily: resolvedFontFamily,
                        backgroundColor: "transparent", borderRadius: 6,
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}>
                        ⚠️ Unsupported chart type
                    </div>
                )
        }
    }


    // #endregion

    // Loading state
    if (loading && (!data?.data.length)) {
        return (
            <div style={{
                width: "100%", height: "100%",
                backgroundColor: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: resolvedFontFamily, fontSize: props.customStyling.fontSize,
                color: props.customStyling.labelColor,
                padding: Math.max(8, props.customStyling.padding * 0.4),
                margin: 0,
                borderRadius: props.customStyling.borderRadius,
                boxSizing: "border-box",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }} className="mobile-loading">
                <div style={{
                    textAlign: "center",
                    backgroundColor: "transparent",
                    padding: "20px",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                }} className="mobile-loading-inner">
                    <div style={{
                        fontSize: "48px", marginBottom: "16px",
                        animation: "pulse 2s infinite",
                    }} className="mobile-loading-icon" aria-hidden>
                        <svg
                            viewBox="0 0 48 48"
                            width="1em"
                            height="1em"
                            role="img"
                            aria-label="Google Sheets"
                        >
                            <title>Google Sheets</title>
                            <rect x="6" y="6" width="36" height="36" rx="4" fill="#0F9D58" />
                            {/* Folded corner */}
                            <path d="M34 6 L42 14 L42 10 C42 7.79 40.21 6 38 6 Z" fill="#E6F4EA" />
                            {/* Grid lines */}
                            <rect x="12" y="16" width="24" height="2" fill="#FFFFFF" opacity="0.95" />
                            <rect x="12" y="22" width="24" height="2" fill="#FFFFFF" opacity="0.95" />
                            <rect x="12" y="28" width="24" height="2" fill="#FFFFFF" opacity="0.95" />
                            <rect x="12" y="34" width="24" height="2" fill="#FFFFFF" opacity="0.95" />
                            <rect x="20" y="14" width="2" height="24" fill="#FFFFFF" opacity="0.95" />
                            <rect x="28" y="14" width="2" height="24" fill="#FFFFFF" opacity="0.95" />
                        </svg>
                    </div>
                    <div style={{ fontSize: props.customStyling.titleSize, fontWeight: "600", marginBottom: "8px" }} className="mobile-responsive mobile-title">
                        Loading data...
                    </div>
                    <div style={{ opacity: 0.7 }} className="mobile-responsive">
                        Fetching your chart data from Google Sheets
                    </div>
                    <style>{`
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.1); }
                        }
                    `}</style>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div style={{
                width: "100%", height: "100%",
                backgroundColor: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: resolvedFontFamily, fontSize: props.customStyling.fontSize,
                color: "#ff4444", textAlign: "center",
                padding: Math.max(8, props.customStyling.padding * 0.4),
                margin: 0,
                borderRadius: props.customStyling.borderRadius,
                boxSizing: "border-box",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }} className="mobile-error">
                <div style={{
                    backgroundColor: "transparent",
                    padding: "20px",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                    maxWidth: "400px",
                }} className="mobile-error-inner">
                    <div style={{
                        fontSize: "48px", marginBottom: "16px",
                        animation: "shake 0.5s ease-in-out",
                    }} className="mobile-error-icon">
                        ⚠️
                    </div>
                    <div style={{
                        fontSize: props.customStyling.titleSize,
                        fontWeight: "600",
                        marginBottom: "12px",
                        color: "#ff4444",
                    }} className="mobile-responsive mobile-title">
                        Error Loading Data
                    </div>
                    <div style={{
                        marginBottom: "20px",
                        color: props.customStyling.labelColor,
                        lineHeight: 1.5,
                    }} className="mobile-responsive">
                        {error}
                    </div>
                    <button
                        onClick={fetchData}
                        style={{
                            marginTop: "10px", padding: "12px 24px",
                            backgroundColor: props.primaryColor, color: "white",
                            border: "none", borderRadius: "8px",
                            cursor: "pointer", fontFamily: resolvedFontFamily,
                            fontSize: props.customStyling.fontSize,
                            fontWeight: "500",
                            transition: "all 0.3s ease",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            WebkitTapHighlightColor: "transparent",
                            touchAction: "manipulation",
                            minHeight: "44px",
                            minWidth: "88px",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                        }}
                        onTouchStart={(e) => {
                            e.currentTarget.style.transform = "scale(0.98)"
                            e.currentTarget.style.backgroundColor = props.primaryColor
                        }}
                        onTouchEnd={(e) => {
                            e.currentTarget.style.transform = "scale(1)"
                            e.currentTarget.style.backgroundColor = props.primaryColor
                        }}
                        className="mobile-responsive"
                    >
                        🔄 Retry
                    </button>
                    <style>{`
                        @keyframes shake {
                            0%, 100% { transform: translateX(0); }
                            25% { transform: translateX(-5px); }
                            75% { transform: translateX(5px); }
                        }
                    `}</style>
                </div>
            </div>
        )
    }

    // #region Main Render
    return (
        <div style={{
            width: "100%", height: "100%",
            backgroundColor: "transparent", fontFamily: resolvedFontFamily,
            padding: 0,
            margin: 0,
            borderRadius: props.customStyling.borderRadius,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
            animation: "fadeIn 0.5s ease-out",
        }} className={instanceClass.current}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Force transparent backgrounds for Recharts surfaces within this component */
                .${instanceClass.current} .recharts-wrapper,
                .${instanceClass.current} .recharts-responsive-container,
                .${instanceClass.current} .recharts-surface {
                    background: transparent !important;
                }

                /* Mobile Responsive Styles */
                @media (max-width: 768px) {
                    ${props.customStyling.enableMobileResponsive ? `
                    .mobile-responsive {
                        font-size: ${Math.max(10, props.customStyling.fontSize * 0.9)}px !important;
                    }
                    .mobile-title {
                        font-size: ${Math.max(14, props.customStyling.titleSize * 0.8)}px !important;
                    }
                    .mobile-subtitle {
                        font-size: ${Math.max(12, props.customStyling.subtitleSize * 0.85)}px !important;
                    }
                    /* Universal mobile toggle styles */
                    .mobile-toggle {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 4px !important;
                        padding: 4px !important;
                    }
                    .mobile-toggle .toggle-slider {
                        top: 4px !important;
                        left: 4px !important;
                        height: calc(100% - 8px) !important;
                        width: calc(50% - 4px) !important;
                        /* Keep horizontal sliding (translateX) from inline styles */
                    }
                    .mobile-toggle button {
                        padding: 10px 12px !important;
                        min-height: 44px !important;
                        font-size: ${Math.max(10, props.customStyling.fontSize * 0.95)}px !important;
                    }
                    .mobile-chart-container {
                        padding: 0 !important;
                    }
                    .mobile-footer {
                        padding: 6px !important;
                        font-size: ${Math.max(10, props.customStyling.labelSize * 0.8)}px !important;
                    }
                    .mobile-loading, .mobile-error {
                        padding: ${Math.max(6, props.customStyling.padding * 0.3)}px !important;
                    }
                    .mobile-loading-inner, .mobile-error-inner {
                        padding: 16px !important;
                        max-width: 90vw !important;
                    }
                    .mobile-loading-icon {
                        font-size: 36px !important;
                    }
                    .mobile-error-icon {
                        font-size: 36px !important;
                    }
                    ` : ''}
                }

                /* Single breakpoint only */
            `}</style>
            {/* Chart Container */}
            <div style={{
                flex: 1, position: "relative",
                display: "flex", flexDirection: "column",
                padding: 0,
                overflow: "visible",
            }} className="mobile-chart-container">
                {/* Header */}
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    gap: 6,
                    marginBottom: 8,
                    paddingBottom: 4,
                    borderBottom: `1px solid ${props.customStyling.gridColor}`,
                }}>
                    {(props.title || props.subtitle) && (
                        <div style={{ width: "100%" }}>
                            {props.title && (
                                <h2 style={{
                                    margin: 0, fontSize: props.customStyling.titleSize,
                                    color: props.customStyling.titleColor,
                                    fontWeight: props.customStyling.titleWeight,
                                    lineHeight: 1.1,
                                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                                }} className="mobile-responsive mobile-title">
                                    {props.title}
                                </h2>
                            )}
                            {props.subtitle && (
                                <p style={{
                                    margin: "2px 0 0 0", fontSize: props.customStyling.subtitleSize,
                                    color: props.customStyling.subtitleColor,
                                    fontWeight: props.customStyling.subtitleWeight,
                                    lineHeight: 1.2,
                                }} className="mobile-responsive mobile-subtitle">
                                    {props.subtitle}
                                </p>
                            )}
                        </div>
                    )}
                    <div
                        role="group" aria-label="Chart type"
                        style={{
                            position: "relative", display: "inline-grid", gridTemplateColumns: "1fr 1fr",
                            alignItems: "center", gap: 0, borderRadius: 12,
                            border: `1px solid ${props.customStyling.gridColor}`,
                            backgroundColor: "transparent", userSelect: "none",
                            padding: 2, overflow: "hidden",
                            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
                        }}
                        className="mobile-toggle"
                    >
                        <div
                            aria-hidden
                            style={{
                                position: "absolute", top: 2, left: 2,
                                height: "calc(100% - 4px)", width: "calc(50% - 2px)",
                                backgroundColor: props.primaryColor, borderRadius: 10,
                                transform: selectedChartType === "bar" ? "translateX(0)" : "translateX(calc(100% + 2px))",
                                transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)", pointerEvents: "none", zIndex: 0,
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                            }}
                            className="toggle-slider"
                        />
                        <button
                            type="button" onClick={() => setSelectedChartType("bar")}
                            aria-pressed={selectedChartType === "bar"}
                            style={{
                                appearance: "none", border: "none", background: "transparent",
                                color: selectedChartType === "bar" ? "#ffffff" : props.customStyling.labelColor,
                                padding: "4px 10px", borderRadius: 10,
                                cursor: "pointer", fontFamily: resolvedFontFamily,
                                fontSize: props.customStyling.fontSize,
                                fontWeight: "500",
                                transition: "color 250ms ease, transform 150ms ease",
                                zIndex: 1,
                                transform: "scale(1)",
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
                            onTouchStart={(e) => {
                                e.currentTarget.style.transform = "scale(0.98)"
                                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)"
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.transform = "scale(1)"
                                e.currentTarget.style.backgroundColor = "transparent"
                            }}
                            className="mobile-responsive"
                        >
                            Bar Chart
                        </button>
                        <button
                            type="button" onClick={() => setSelectedChartType("line")}
                            aria-pressed={selectedChartType === "line"}
                            style={{
                                appearance: "none", border: "none", background: "transparent",
                                color: selectedChartType === "line" ? "#ffffff" : props.customStyling.labelColor,
                                padding: "4px 10px", borderRadius: 10,
                                cursor: "pointer", fontFamily: resolvedFontFamily,
                                fontSize: props.customStyling.fontSize,
                                fontWeight: "500",
                                transition: "color 250ms ease, transform 150ms ease",
                                zIndex: 1,
                                transform: "scale(1)",
                                WebkitTapHighlightColor: "transparent",
                                touchAction: "manipulation",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
                            onTouchStart={(e) => {
                                e.currentTarget.style.transform = "scale(0.98)"
                                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)"
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.transform = "scale(1)"
                                e.currentTarget.style.backgroundColor = "transparent"
                            }}
                            className="mobile-responsive"
                        >
                            Line Chart
                        </button>
                    </div>
                </div>
                <div style={{
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    position: "relative",
                    overflow: "visible"
                }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {renderChart()}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer */}
            {lastFetch && (
                <div style={{
                    textAlign: "center",
                    fontSize: props.customStyling.labelSize * 0.85,
                    color: props.customStyling.labelColor, opacity: 0.7,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    minHeight: loading && data?.data.length ? 24 : undefined,
                    padding: "4px 8px 8px 8px",
                    backgroundColor: "transparent",
                    borderTop: `1px solid ${props.customStyling.gridColor}`,
                }} className="mobile-responsive mobile-footer">
                    <div>
                        Last updated: {lastFetch.toLocaleTimeString()}
                        {props.autoRefresh && (
                            <span> • Auto-refresh: {props.refreshInterval}s</span>
                        )}
                    </div>
                    {loading && data?.data.length && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 4,
                            color: props.customStyling.labelColor,
                            fontSize: props.customStyling.labelSize, opacity: 0.8,
                        }}>
                            <style>{`@keyframes dg-spin { to { transform: rotate(360deg); } }`}</style>
                            <span
                                aria-label="Refreshing" title="Refreshing"
                                style={{
                                    width: 12, height: 12,
                                    border: `2px solid ${props.customStyling.gridColor}`,
                                    borderTopColor: props.primaryColor, borderRadius: "50%",
                                    display: "inline-block", animation: "dg-spin 1s linear infinite",
                                }}
                            />
                            <span style={{ userSelect: "none", fontWeight: "500" }}>Refreshing…</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
    // #endregion
}

// #region Default Props and Framer Controls
DynamicGraph.defaultProps = {
    googleSheetsUrl: "",
    useApiKey: false,
    apiKey: "",
    primaryColor: "#8884d8",
    secondaryColor: "#82ca9d",
    backgroundColor: "#ffffff",
    showGrid: true,
    showLegend: true,
    showTooltip: true,
    animationDuration: 1000,
    title: "Dynamic Graph",
    subtitle: "",
    width: 800,
    height: 400,
    autoRefresh: false,
    refreshInterval: 30,
    customStyling: {
        fontFamily: "Inter, system-ui, sans-serif",
        useProjectFonts: true,
        fontSize: 12,
        titleSize: 18,
        subtitleSize: 14,
        labelSize: 12,
        titleColor: "#333333",
        subtitleColor: "#555555",
        labelColor: "#a8a8a8",
        gridColor: "#e0e0e0",
        borderRadius: 8,
        padding: 16,
        titleWeight: "600",
        subtitleWeight: "400",
        enableMobileResponsive: true,
    },
} as const

DynamicGraph.displayName = "DynamicGraph"

// Property Controls for Framer
addPropertyControls(DynamicGraph, {
    googleSheetsUrl: {
        type: ControlType.String,
        title: "Google Sheets URL",
        placeholder: "https://docs.google.com/spreadsheets/d/...",
    },
    useApiKey: {
        type: ControlType.Boolean,
        title: "Use API Key",
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    apiKey: {
        type: ControlType.String,
        title: "Google API Key",
        obscured: true,
        placeholder: "Your API key",
        hidden(props) {
            return !props.useApiKey
        },
    },
    title: {
        type: ControlType.String,
        title: "Chart Title",
    },
    subtitle: {
        type: ControlType.String,
        title: "Chart Subtitle",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
    },
    showGrid: {
        type: ControlType.Boolean,
        title: "Show Grid",
        enabledTitle: "Grid On",
        disabledTitle: "Grid Off",
    },
    showLegend: {
        type: ControlType.Boolean,
        title: "Show Legend",
        enabledTitle: "Legend On",
        disabledTitle: "Legend Off",
    },
    showTooltip: {
        type: ControlType.Boolean,
        title: "Show Tooltip",
        enabledTitle: "Tooltip On",
        disabledTitle: "Tooltip Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        min: 0,
        max: 3000,
        step: 100,
        unit: "ms",
    },
    autoRefresh: {
        type: ControlType.Boolean,
        title: "Auto Refresh",
        enabledTitle: "Auto-refresh On",
        disabledTitle: "Auto-refresh Off",
    },
    refreshInterval: {
        type: ControlType.Number,
        title: "Refresh Interval",
        min: 5,
        max: 3600,
        step: 5,
        unit: "s",
        hidden(props) {
            return !props.autoRefresh
        },
    },
    customStyling: {
        type: ControlType.Object,
        title: "Custom Styling",
        controls: {
            useProjectFonts: {
                type: ControlType.Boolean,
                title: "Use Project Font",
                defaultValue: true,
            },
            fontFamily: {
                type: ControlType.String,
                title: "Font Family",
                defaultValue: "Inter, system-ui, sans-serif",
                hidden(props: any) { return !!props.customStyling?.useProjectFonts }
            },
            fontSize: {
                type: ControlType.Number,
                title: "Base Font Size",
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
                defaultValue: 12,
            },
            titleSize: {
                type: ControlType.Number,
                title: "Title Size",
                min: 12,
                max: 48,
                step: 1,
                unit: "px",
                defaultValue: 18,
            },
            subtitleSize: {
                type: ControlType.Number,
                title: "Subtitle Size",
                min: 10,
                max: 32,
                step: 1,
                unit: "px",
                defaultValue: 14,
            },
            labelSize: {
                type: ControlType.Number,
                title: "Label Size",
                min: 8,
                max: 20,
                step: 1,
                unit: "px",
                defaultValue: 12,
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#333333",
            },
            subtitleColor: {
                type: ControlType.Color,
                title: "Subtitle Color",
                defaultValue: "#555555",
            },
            labelColor: {
                type: ControlType.Color,
                title: "Label Color",
                defaultValue: "#666666",
            },
            gridColor: {
                type: ControlType.Color,
                title: "Grid Color",
                defaultValue: "#e0e0e0",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                defaultValue: 8,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
                defaultValue: 16,
            },
            titleWeight: {
                type: ControlType.Enum,
                title: "Title Weight",
                options: ["300", "400", "500", "600", "700", "800"],
                optionTitles: ["Light", "Normal", "Medium", "Semi-bold", "Bold", "Extra-bold"],
                defaultValue: "600",
            },
            subtitleWeight: {
                type: ControlType.Enum,
                title: "Subtitle Weight",
                options: ["300", "400", "500", "600", "700"],
                optionTitles: ["Light", "Normal", "Medium", "Semi-bold", "Bold"],
                defaultValue: "400",
            },
            enableMobileResponsive: {
                type: ControlType.Boolean,
                title: "Enable Mobile Responsive",
                defaultValue: true,
            },
        },
    },
})
// #endregion