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

// Optimized data utilities
const dataUtils = {
    findKey: (obj: Record<string, unknown>, candidates: string[]): string | null => {
        const keys = Object.keys(obj || {})
        if (!keys.length) return null
        
        const lowerMap = new Map(keys.map(k => [k.toLowerCase(), k]))
        
        // Exact matches first
        for (const cand of candidates) {
            const exact = lowerMap.get(cand.toLowerCase())
            if (exact) return exact
        }
        
        // Then substring matches
        for (const cand of candidates) {
            const c = cand.toLowerCase()
            const hit = keys.find(k => k.toLowerCase().includes(c))
            if (hit) return hit
        }
        return null
    },

    isMoneyishKey: (key: string): boolean => 
        /(amount|amt|debit|expense|spent|spend|value|total|price|cost|payment|paid|withdrawal|outflow)/i.test(key),

    parseAmount: (val: unknown): number => {
        if (typeof val === "number") return Number.isFinite(val) ? val : 0
        if (val == null) return 0
        
        let s = String(val).replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ").trim()
        if (!s) return 0
        
        // Handle parentheses for negatives
        let negative = false
        if (s.startsWith("(") && s.endsWith(")")) {
            negative = true
            s = s.slice(1, -1)
        }
        
        // Clean currency symbols
        s = s.replace(/inr|rs\.?|rupees?/gi, "")
             .replace(/[₹]/g, "")
             .replace(/\/-?$/g, "")
             .replace(/[^0-9.,\-a-zA-Z ]/g, "")
             .trim()

        // Handle Indian notation (L = lakh, Cr = crore)
        const lc = s.toLowerCase()
        const lakhMatch = lc.match(/^([\-+]?[0-9]*\.?[0-9]+)\s*l(akh)?s?$/)
        if (lakhMatch) {
            const n = Number(lakhMatch[1])
            return (negative ? -1 : 1) * (Number.isFinite(n) ? n * 100000 : 0)
        }
        const crMatch = lc.match(/^([\-+]?[0-9]*\.?[0-9]+)\s*c(r|rore)?s?$/)
        if (crMatch) {
            const n = Number(crMatch[1])
            return (negative ? -1 : 1) * (Number.isFinite(n) ? n * 10000000 : 0)
        }

        // Handle thousand separators
        const hasComma = s.includes(",")
        const hasDot = s.includes(".")
        let cleaned = s.replace(/[^0-9,.-]/g, "")
        
        if (hasComma && hasDot) {
            cleaned = cleaned.replace(/,/g, "")
        } else if (hasComma && !hasDot) {
            cleaned = cleaned.replace(/,/g, "")
        }
        
        cleaned = cleaned.replace(/(?!^)-/g, "")
        let num = Number(cleaned)
        if (!Number.isFinite(num)) num = 0
        if (negative && num > 0) num = -num
        return num
    }
}

// #endregion

// #region Type Definitions
interface TransactionBoxData {
    heading: string
    amount: number
    tags: string[]
    reason?: string
}

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
    variant: "desktop" | "mobile"
    leftPaneWidth: number
    transactionBoxes: TransactionBoxData[]
    transactionTextStyles?: {
        headingSize: number
        headingColor: string
        amountSize: number
        amountColor: string
        tagsSize: number
        tagsColor: string
        boxBackground: string
        tagsBackground: string
    }
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
                apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=${props.apiKey}`
            } else {
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

                rawData = parseCsvToObjects(csvText).filter((obj) =>
                    Object.values(obj).some((val) => val !== "")
                )
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
    const yAxisGutter = useMemo(() => {
        if (!data) return 0
        const labelSize = props.customStyling.labelSize || 12

        const barKey = data.xKey
        const longestCategoryLen = data.data.reduce((max: number, row) => {
            const str = String(row[barKey] ?? "")
            return Math.max(max, str.length)
        }, 0)
        const barApproxWidth = Math.ceil(longestCategoryLen * labelSize * 0.6)
        const barTotal = barApproxWidth + 12

        let longestNumericLen = 0
        for (const row of data.data) {
            for (const key of data.yKeys) {
                const v = row[key]
                if (typeof v === "number" && !Number.isNaN(v)) {
                    const s = v.toLocaleString()
                    if (s.length > longestNumericLen) longestNumericLen = s.length
                }
            }
        }
        if (longestNumericLen === 0) longestNumericLen = 3
        const lineApproxWidth = Math.ceil(longestNumericLen * labelSize * 0.6)
        const lineTotal = lineApproxWidth + 16

        const total = Math.max(barTotal, lineTotal)
        return Math.min(220, Math.max(28, total))
    }, [data, props.customStyling.labelSize])

    const tickLabelStyle = useMemo(
        () => ({
            fontSize: props.customStyling.labelSize,
            fill: props.customStyling.labelColor,
            fontFamily: resolvedFontFamily,
        }),
        [props.customStyling.labelSize, props.customStyling.labelColor, resolvedFontFamily]
    )

    const inrNumberFormatter = useMemo(
        () => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }),
        []
    )

    // Clean transaction boxes computation
    const computedTransactionBoxes = useMemo(() => {
        if (!rawRows?.length) return []

        const sample = rawRows[0]
        const keys = {
            type: dataUtils.findKey(sample, ["type", "txn type", "transaction type", "category"]),
            amount: dataUtils.findKey(sample, ["amount", "debit amount", "expense", "value", "amt"]),
            reason: dataUtils.findKey(sample, ["reason", "heading", "title", "description"]),
            tags: dataUtils.findKey(sample, ["tags", "label", "labels"])
        }

        const getRowAmount = (row: Record<string, unknown>) => {
            if (keys.amount) {
                const parsed = dataUtils.parseAmount(row[keys.amount])
                if (parsed !== 0) return parsed
            }
            
            let bestAmount = 0
            for (const [key, value] of Object.entries(row)) {
                if (dataUtils.isMoneyishKey(key)) {
                    const parsed = dataUtils.parseAmount(value)
                    if (Math.abs(parsed) > Math.abs(bestAmount)) {
                        bestAmount = parsed
                    }
                }
            }
            return bestAmount
        }

        let filteredRows = rawRows
        
        if (keys.type) {
            const debitRows = rawRows.filter(row => 
                String(row[keys.type!] || "").toLowerCase() === "debit"
            )
            if (debitRows.length > 0) filteredRows = debitRows
        } else {
            const debitLikeRows = rawRows.filter(row => {
                const amount = getRowAmount(row)
                return amount < 0 || Object.keys(row).some(key => 
                    dataUtils.isMoneyishKey(key) && /debit|expense|spent|withdrawal|outflow/i.test(key)
                )
            })
            if (debitLikeRows.length > 0) filteredRows = debitLikeRows
        }

        const topRows = filteredRows
            .map(row => ({ row, amount: getRowAmount(row) }))
            .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
            .slice(0, 4)

        return topRows.map(({ row, amount }, idx) => ({
            heading: String(row[keys.reason!] || row.reason || row.Reason || row.heading || row.Heading || `Transaction ${idx + 1}`),
            amount: Math.abs(amount),
            tags: (() => {
                const tagsValue = row[keys.tags!] || row.tags || row.Tags || ""
                return Array.isArray(tagsValue) 
                    ? tagsValue as string[]
                    : String(tagsValue).split(",").map(t => t.trim()).filter(Boolean)
            })(),
            reason: String(row[keys.reason!] || row.reason || row.Reason || "")
        }))
    }, [rawRows])
    // #endregion

    // #region Render Functions
    const renderChart = () => {
        if (!data?.data.length) {
            return (
                <div style={{
                    textAlign: "left", padding: "20px", color: props.customStyling.labelColor,
                    fontSize: props.customStyling.fontSize, fontFamily: resolvedFontFamily,
                }}>
                    No chart data available
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
                    <LineChart {...commonProps}>
                        {props.showGrid && (
                            <CartesianGrid strokeDasharray="3 3" stroke={props.customStyling.gridColor} />
                        )}
                        <XAxis
                            dataKey={data.xKey} tick={tickLabelStyle} angle={-45}
                            textAnchor="end" height={80} tickMargin={4}
                        />
                        <YAxis tick={tickLabelStyle} width={yAxisGutter} />
                        {props.showTooltip && (
                            <Tooltip
                                contentStyle={{ fontFamily: resolvedFontFamily }}
                                labelStyle={{ fontFamily: resolvedFontFamily }}
                                itemStyle={{ fontFamily: resolvedFontFamily }}
                            />
                        )}
                        {props.showLegend && (
                            <Legend wrapperStyle={{ fontFamily: resolvedFontFamily }} />
                        )}
                        {data.yKeys.map((key: string, index: number) => (
                            <Line
                                key={key} type="monotone" dataKey={key}
                                name={prettySeriesName(key)}
                                stroke={index === 0 ? props.primaryColor : COLOR_PALETTE[index % COLOR_PALETTE.length]}
                                strokeWidth={2} animationDuration={props.animationDuration}
                            />
                        ))}
                    </LineChart>
                )

            case "bar":
                return (
                    <BarChart {...commonProps} layout="vertical" barCategoryGap="15%">
                        {props.showGrid && (
                            <CartesianGrid strokeDasharray="3 3" stroke={props.customStyling.gridColor} />
                        )}
                        <XAxis
                            type="number" domain={[0, "dataMax"]} allowDecimals={false}
                            tick={tickLabelStyle} tickMargin={4}
                        />
                        <YAxis
                            type="category" dataKey={data.xKey}
                            tick={tickLabelStyle} width={yAxisGutter}
                        />
                        {props.showTooltip && (
                            <Tooltip
                                cursor={{ fill: "transparent" }}
                                contentStyle={{ fontFamily: resolvedFontFamily }}
                                labelStyle={{ fontFamily: resolvedFontFamily }}
                                itemStyle={{ fontFamily: resolvedFontFamily }}
                            />
                        )}
                        {props.showLegend && (
                            <Legend wrapperStyle={{ fontFamily: resolvedFontFamily }} />
                        )}
                        {data.yKeys.map((key: string, index: number) => (
                            <Bar
                                key={key} dataKey={key} name={prettySeriesName(key)}
                                fill={index === 0 ? props.primaryColor : COLOR_PALETTE[index % COLOR_PALETTE.length]}
                                animationDuration={props.animationDuration}
                                activeBar={{
                                    style: {
                                        transform: "scaleX(1.02)", transformOrigin: "center left",
                                        transition: "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), filter 0.4s ease",
                                        filter: "brightness(1.12)", cursor: "pointer",
                                    },
                                }}
                            />
                        ))}
                    </BarChart>
                )

            default:
                return (
                    <div style={{
                        textAlign: "center", padding: "20px", color: props.customStyling.labelColor,
                        fontSize: props.customStyling.fontSize, fontFamily: resolvedFontFamily,
                    }}>
                        Unsupported chart type
                    </div>
                )
        }
    }

    const TransactionBox = ({ box, index }: { box: TransactionBoxData, index: number }) => {
        const styleCfg = props.transactionTextStyles
        const isDesktop = props.variant === "desktop"

        return (
            <div
                key={index}
                className={`${instanceClass.current}-box`}
                style={{
                    background: styleCfg?.boxBackground ?? "#ffffff",
                    border: `1px solid ${props.customStyling.gridColor}`,
                    borderRadius: 12,
                    padding: isDesktop ? 16 : 12,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: isDesktop ? 12 : 8,
                    fontFamily: resolvedFontFamily,
                    minHeight: 0,
                    transition: "border-color 160ms, background-color 160ms",
                    boxShadow: isDesktop ? undefined : "0 1px 3px rgba(0,0,0,0.06)",
                }}
            >
                <div style={{
                    fontSize: styleCfg?.headingSize ?? props.customStyling.labelSize + 1,
                    fontWeight: 600,
                    color: styleCfg?.headingColor ?? props.customStyling.titleColor,
                    lineHeight: 1.2,
                }}>
                    {box.heading || `Box ${index + 1}`}
                </div>
                <div style={{
                    display: "inline-flex", alignItems: "baseline", gap: 6,
                    fontWeight: 700, color: styleCfg?.amountColor ?? props.primaryColor,
                    lineHeight: 1.1, whiteSpace: "nowrap",
                }}>
                    <span aria-hidden style={{ fontSize: (styleCfg?.amountSize ?? 31) * 0.8 }}>₹</span>
                    <span style={{ fontSize: styleCfg?.amountSize ?? 31 }}>
                        {inrNumberFormatter.format(Number(box.amount) || 0)}
                    </span>
                </div>
                {box.tags?.length > 0 && (
                    <div style={{
                        display: "flex", flexWrap: "wrap", gap: 6,
                        paddingTop: isDesktop ? 8 : 6, marginTop: isDesktop ? 4 : 2,
                        borderTop: `1px solid ${props.customStyling.gridColor}`,
                    }}>
                        {box.tags.map((tag, tIdx) => (
                            <span key={tIdx} style={{
                                background: styleCfg?.tagsBackground ?? "rgba(0,0,0,0.06)",
                                padding: isDesktop ? "4px 12px" : "3px 10px",
                                borderRadius: 999,
                                fontSize: styleCfg?.tagsSize ?? props.customStyling.labelSize - 1,
                                lineHeight: 1.1,
                                color: styleCfg?.tagsColor ?? props.customStyling.labelColor,
                                fontWeight: 500, whiteSpace: "nowrap",
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const renderTransactionBoxes = () => {
        if (!computedTransactionBoxes?.length) return null

        if (props.variant === "desktop") {
            const visible = computedTransactionBoxes
            const columns = visible.length <= 2 ? 1 : 2
            const rows = Math.ceil(visible.length / columns)
            return (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: 12, flex: 1, height: "100%",
                }}>
                    {visible.map((box, i) => (
                        <TransactionBox key={i} box={box} index={i} />
                    ))}
                </div>
            )
        } else {
            return (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))",
                    gap: 12, alignContent: "flex-start",
                }}>
                    {computedTransactionBoxes.map((box, i) => (
                        <TransactionBox key={i} box={box} index={i} />
                    ))}
                </div>
            )
        }
    }
    // #endregion

    // Loading state
    if (loading && (!data?.data.length)) {
        return (
            <div style={{
                width: props.width, height: props.height,
                backgroundColor: props.backgroundColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: resolvedFontFamily, fontSize: props.customStyling.fontSize,
                color: props.customStyling.labelColor,
                borderRadius: props.customStyling.borderRadius,
                padding: props.customStyling.padding,
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "10px" }}>📊</div>
                    <div>Loading data...</div>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div style={{
                width: props.width, height: props.height,
                backgroundColor: props.backgroundColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: resolvedFontFamily, fontSize: props.customStyling.fontSize,
                color: "#ff4444", textAlign: "center",
                padding: props.customStyling.padding,
                borderRadius: props.customStyling.borderRadius,
                boxSizing: "border-box",
            }}>
                <div>
                    <div style={{ marginBottom: "10px" }}>⚠️</div>
                    <div>Error: {error}</div>
                    <button
                        onClick={fetchData}
                        style={{
                            marginTop: "10px", padding: "8px 16px",
                            backgroundColor: props.primaryColor, color: "white",
                            border: "none", borderRadius: props.customStyling.borderRadius,
                            cursor: "pointer", fontFamily: resolvedFontFamily,
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    // #region Main Render
    return (
        <div style={{
            width: props.width, height: props.height,
            backgroundColor: props.backgroundColor, fontFamily: resolvedFontFamily,
            padding: props.customStyling.padding,
            borderRadius: props.customStyling.borderRadius,
            boxSizing: "border-box", display: "flex", flexDirection: "column",
        }}>
            {/* Hover styles */}
            <style>{`
                .${instanceClass.current}-box { 
                    position:relative; transform: translateY(0) scale(1); 
                    box-shadow: 0 0.5px 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
                    transition: box-shadow 280ms cubic-bezier(.4,.14,.3,1), 
                                transform 280ms cubic-bezier(.4,.14,.3,1), 
                                border-color 200ms ease, background-color 200ms ease; 
                    will-change: transform, box-shadow; 
                }
                .${instanceClass.current}-box:hover { 
                    box-shadow: 0 3px 6px rgba(0,0,0,0.07), 0 6px 12px rgba(0,0,0,0.06), 0 10px 20px -6px rgba(0,0,0,0.05); 
                    transform: translateY(-2px) scale(1.02); z-index:2; 
                }
            `}</style>

            {/* Content Split */}
            {props.variant === "desktop" ? (
                <div style={{ display: "flex", flexDirection: "row", gap: 20, flex: 1, width: "100%", overflow: "visible" }}>
                    {/* Left Pane */}
                    <div style={{
                        flexBasis: `${Math.min(Math.max(props.leftPaneWidth, 15), 60)}%`,
                        maxWidth: `${Math.min(Math.max(props.leftPaneWidth, 15), 60)}%`,
                        flexShrink: 0, display: "flex", flexDirection: "column", overflow: "visible",
                        paddingLeft: 10, paddingTop: 10, paddingBottom: 10, paddingRight: 4,
                    }}>
                        {renderTransactionBoxes()}
                    </div>
                    {/* Right Pane */}
                    <div style={{
                        flex: 1, minHeight: 160, position: "relative",
                        display: "flex", flexDirection: "column", gap: 12,
                    }}>
                        {/* Header */}
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "flex-start",
                            gap: 12, paddingLeft: yAxisGutter,
                        }}>
                            {(props.title || props.subtitle) && (
                                <div style={{ flex: 1, minWidth: "200px" }}>
                                    {props.title && (
                                        <h2 style={{
                                            margin: 0, fontSize: props.customStyling.titleSize,
                                            color: props.customStyling.titleColor,
                                            fontWeight: props.customStyling.titleWeight,
                                        }}>
                                            {props.title}
                                        </h2>
                                    )}
                                    {props.subtitle && (
                                        <p style={{
                                            margin: "4px 0 0 0", fontSize: props.customStyling.subtitleSize,
                                            color: props.customStyling.subtitleColor,
                                            fontWeight: props.customStyling.subtitleWeight,
                                        }}>
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
                                    backgroundColor: "rgba(0,0,0,0.04)", userSelect: "none",
                                    padding: 2, overflow: "hidden",
                                }}
                            >
                                <div
                                    aria-hidden
                                    style={{
                                        position: "absolute", top: 2, left: 2,
                                        height: "calc(100% - 4px)", width: "calc(50% - 2px)",
                                        backgroundColor: props.primaryColor, borderRadius: 10,
                                        transform: selectedChartType === "bar" ? "translateX(0)" : "translateX(calc(100% + 2px))",
                                        transition: "transform 200ms ease", pointerEvents: "none", zIndex: 0,
                                    }}
                                />
                                <button
                                    type="button" onClick={() => setSelectedChartType("bar")}
                                    aria-pressed={selectedChartType === "bar"}
                                    style={{
                                        appearance: "none", border: "none", background: "transparent",
                                        color: "#000000", padding: "6px 12px", borderRadius: 10,
                                        cursor: "pointer", fontFamily: resolvedFontFamily,
                                        fontSize: props.customStyling.fontSize,
                                        transition: "color 200ms ease", zIndex: 1,
                                    }}
                                >
                                    Bar Chart
                                </button>
                                <button
                                    type="button" onClick={() => setSelectedChartType("line")}
                                    aria-pressed={selectedChartType === "line"}
                                    style={{
                                        appearance: "none", border: "none", background: "transparent",
                                        color: "#000000", padding: "6px 12px", borderRadius: 10,
                                        cursor: "pointer", fontFamily: resolvedFontFamily,
                                        fontSize: props.customStyling.fontSize,
                                        transition: "color 200ms ease", zIndex: 1,
                                    }}
                                >
                                    Line Chart
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                {renderChart()}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, width: "100%", overflow: "visible" }}>
                    {/* Chart first on mobile */}
                    <div style={{
                        flex: 0, minHeight: 160, position: "relative",
                        display: "flex", flexDirection: "column", gap: 12,
                    }}>
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "flex-start",
                            gap: 10, paddingLeft: 0, width: "100%",
                        }}>
                            {(props.title || props.subtitle) && (
                                <div style={{ width: "100%", minWidth: "160px", textAlign: "left" }}>
                                    {props.title && (
                                        <h2 style={{
                                            margin: 0, fontSize: props.customStyling.titleSize,
                                            color: props.customStyling.titleColor,
                                            fontWeight: props.customStyling.titleWeight, textAlign: "left",
                                        }}>
                                            {props.title}
                                        </h2>
                                    )}
                                    {props.subtitle && (
                                        <p style={{
                                            margin: "4px 0 0 0", fontSize: props.customStyling.subtitleSize,
                                            color: props.customStyling.subtitleColor,
                                            fontWeight: props.customStyling.subtitleWeight, textAlign: "left",
                                        }}>
                                            {props.subtitle}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div
                                role="group" aria-label="Chart type"
                                style={{
                                    position: "relative", display: "inline-grid", gridTemplateColumns: "1fr 1fr",
                                    alignItems: "center", borderRadius: 10,
                                    border: `1px solid ${props.customStyling.gridColor}`,
                                    backgroundColor: "rgba(0,0,0,0.04)", userSelect: "none",
                                    padding: 2, overflow: "hidden",
                                }}
                            >
                                <div
                                    aria-hidden
                                    style={{
                                        position: "absolute", top: 2, left: 2,
                                        height: "calc(100% - 4px)", width: "calc(50% - 2px)",
                                        backgroundColor: props.primaryColor, borderRadius: 8,
                                        transform: selectedChartType === "bar" ? "translateX(0)" : "translateX(calc(100% + 2px))",
                                        transition: "transform 200ms ease", pointerEvents: "none", zIndex: 0,
                                    }}
                                />
                                <button
                                    type="button" onClick={() => setSelectedChartType("bar")}
                                    aria-pressed={selectedChartType === "bar"}
                                    style={{
                                        appearance: "none", border: "none", background: "transparent",
                                        color: "#000000", padding: "6px 10px", borderRadius: 8,
                                        cursor: "pointer", fontFamily: resolvedFontFamily,
                                        fontSize: props.customStyling.fontSize,
                                        transition: "color 200ms ease", zIndex: 1,
                                    }}
                                >
                                    Bar
                                </button>
                                <button
                                    type="button" onClick={() => setSelectedChartType("line")}
                                    aria-pressed={selectedChartType === "line"}
                                    style={{
                                        appearance: "none", border: "none", background: "transparent",
                                        color: "#000000", padding: "6px 10px", borderRadius: 8,
                                        cursor: "pointer", fontFamily: resolvedFontFamily,
                                        fontSize: props.customStyling.fontSize,
                                        transition: "color 200ms ease", zIndex: 1,
                                    }}
                                >
                                    Line
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ResponsiveContainer width="100%" height={260}>
                                {renderChart()}
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* Boxes under chart */}
                    <div style={{ paddingTop: 4 }}>{renderTransactionBoxes()}</div>
                </div>
            )}

            {/* Footer */}
            {lastFetch && (
                <div style={{
                    marginTop: 10, textAlign: "center",
                    fontSize: props.customStyling.labelSize * 0.85,
                    color: props.customStyling.labelColor, opacity: 0.6,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    minHeight: loading && data?.data.length ? 40 : undefined,
                }}>
                    <div>
                        Last updated: {lastFetch.toLocaleTimeString()}
                        {props.autoRefresh && (
                            <span> • Auto-refresh: {props.refreshInterval}s</span>
                        )}
                    </div>
                    {loading && data?.data.length && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 8,
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
                                    display: "inline-block", animation: "dg-spin 0.8s linear infinite",
                                }}
                            />
                            <span style={{ userSelect: "none" }}>Refreshing…</span>
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
    variant: "desktop",
    leftPaneWidth: 35,
    transactionBoxes: [
        { heading: "January", amount: 125000, tags: ["Alice", "Bob"] },
        { heading: "February", amount: 98000, tags: ["Carol"] },
        { heading: "March", amount: 152500, tags: ["Dave", "Eve"] },
        { heading: "April", amount: 76500, tags: ["Frank"] },
    ],
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
        padding: 20,
        titleWeight: "600",
        subtitleWeight: "400",
    },
    transactionTextStyles: {
        headingSize: 13,
        headingColor: "#333333",
        amountSize: 31,
        amountColor: "#f2b800",
        tagsSize: 11,
        tagsColor: "#777777",
        boxBackground: "#ffffff",
        tagsBackground: "rgba(0,0,0,0.06)",
    },
} as const

export { DynamicGraph }
DynamicGraph.displayName = "DynamicGraph"

// Property Controls for Framer
addPropertyControls(DynamicGraph, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["desktop", "mobile"],
        optionTitles: ["Desktop", "Mobile"],
        defaultValue: "desktop",
    },
    leftPaneWidth: {
        type: ControlType.Number,
        title: "Left %",
        min: 15,
        max: 60,
        step: 1,
        description: "Width % of boxes pane (desktop)",
        hidden(props) {
            return props.variant !== "desktop"
        },
    },
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
                defaultValue: 20,
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
        },
    },
    transactionTextStyles: {
        type: ControlType.Object,
        title: "Txn Text Styles",
        controls: {
            headingSize: {
                type: ControlType.Number,
                title: "Heading Size",
                min: 8,
                max: 40,
                defaultValue: 13,
            },
            headingColor: {
                type: ControlType.Color,
                title: "Heading Color",
                defaultValue: "#333333",
            },
            amountSize: {
                type: ControlType.Number,
                title: "Amount Size",
                min: 12,
                max: 72,
                defaultValue: 31,
            },
            amountColor: {
                type: ControlType.Color,
                title: "Amount Color",
                defaultValue: "#f2b800",
            },
            tagsSize: {
                type: ControlType.Number,
                title: "Tags Size",
                min: 6,
                max: 28,
                defaultValue: 11,
            },
            tagsColor: {
                type: ControlType.Color,
                title: "Tags Color",
                defaultValue: "#777777",
            },
            boxBackground: {
                type: ControlType.Color,
                title: "Box BG",
                defaultValue: "#ffffff",
            },
            tagsBackground: {
                type: ControlType.Color,
                title: "Tags BG",
                defaultValue: "rgba(0,0,0,0.06)",
            },
        },
    },
})
// #endregion
