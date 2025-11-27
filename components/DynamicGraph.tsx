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
titleAlign: {
    type: ControlType.Enum,
        title: "Title Align",
            options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                    defaultValue: "left",
                        displaySegmentedControl: true,
            },
subtitleAlign: {
    type: ControlType.Enum,
        title: "Subtitle Align",
            options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                    defaultValue: "left",
                        displaySegmentedControl: true,
            },
enableMobileResponsive: {
    type: ControlType.Boolean,
        title: "Enable Mobile Responsive",
            defaultValue: true,
            },
        },
    },
})