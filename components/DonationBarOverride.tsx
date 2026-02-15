/**
 * DonationBarOverride.tsx
 *
 * Framer Code Override for the "Donation Bar (Progress)" component.
 * Reads Razorpay transaction data from a Google Sheet, sums captured
 * payment amounts, and dynamically updates:
 *   1. The progress bar fill width (via the "layer" child)
 *   2. The current donation amount text
 *   3. The target amount text
 *
 * ─── GOOGLE SHEET FORMAT ─────────────────────────────────────────────
 *   Payment_id  |  Amount  |  Currency  |  Status   |  Date
 *   pay_xxx...  |  500.00  |  INR       |  captured  |  30/01/2026 21:43
 *
 * Only rows with Status === "captured" are summed.
 *
 * ─── SETUP ────────────────────────────────────────────────────────────
 * 1. Set GOOGLE_SHEETS_URL below (or keep the pre-configured one).
 * 2. Share your sheet: "Anyone with the link" → Viewer.
 * 3. In Framer:
 *    • Apply  withDonationProgress  to the FILL BAR layer (the coloured bar)
 *    • Apply  withCurrentAmount     to the current-amount text layer
 *    • Apply  withTargetAmount      to the target-amount text layer
 * ──────────────────────────────────────────────────────────────────────
 *
 * @version 2.0.0
 */

import {
    forwardRef,
    useState,
    useEffect,
    type ComponentType,
} from "react"

// ─────────────────────────────────────────────
// #region  Global Configuration
// ─────────────────────────────────────────────

/**
 * Target donation amount in ₹ (rupees).
 * Change this to whatever goal your campaign has.
 * Default: 60,00,000 (60 lacs)
 */
const DONATION_TARGET: number = 6_000_000

/**
 * Your Google Sheet URL.
 * The sheet MUST be shared with "Anyone with the link" → Viewer.
 *
 * Expected columns (from Razorpay transaction history):
 *   Payment_id | Amount | Currency | Status | Date
 *
 * The override sums all "Amount" values where "Status" === "captured".
 */
const GOOGLE_SHEETS_URL: string =
    "https://docs.google.com/spreadsheets/d/1C3OR5gRiicSjB99IBUrl27fBQJOePnDTbWf656LQerE/edit#gid=0"

/**
 * Optional Google Sheets API key for private sheets.
 * Leave empty ("") for public/shared sheets — gviz CSV endpoint will be used.
 */
const GOOGLE_SHEETS_API_KEY: string = ""

/**
 * Column heading for the Amount values.
 * Must match the heading in your Google Sheet (case-insensitive).
 */
const COL_AMOUNT: string = "Amount"

/**
 * The label used in the Payment_id (first) column to identify
 * the summary row maintained by the Google Apps Script.
 *
 * Example row:  Total Amount  |  35223.00  |  INR  |  |  
 */
const TOTAL_ROW_LABEL: string = "Total Amount"

/**
 * Polling interval in milliseconds.
 * Default: 30 000 ms = 30 seconds.
 */
const POLL_INTERVAL_MS: number = 30_000

/**
 * Indian Rupee formatter (₹ 1,07,483 style — en-IN locale).
 */
const formatINR = (value: number): string => {
    return `₹ ${new Intl.NumberFormat("en-IN").format(Math.round(value))}`
}

// #endregion

// ─────────────────────────────────────────────
// #region  CSV Parsing & Google Sheets Helpers
// ─────────────────────────────────────────────

/**
 * Minimal, spec-aware CSV parser that handles quoted fields correctly.
 */
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

    // Push the last field / row
    row.push(field)
    if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row)
    }

    return rows
}

/**
 * Parse CSV text into an array of objects keyed by column headers.
 */
function parseCsvToObjects(csvText: string): Record<string, string>[] {
    const rows = parseCsv(csvText).filter((r) =>
        r.some((cell) => (cell ?? "").toString().trim() !== "")
    )

    if (rows.length < 2) {
        throw new Error(
            "Google Sheet must have at least a header row and one data row."
        )
    }

    const headers = rows[0].map((h) => h.replace(/"/g, "").trim())
    const dataRows = rows.slice(1)

    return dataRows.map((values) => {
        const obj: Record<string, string> = {}
        headers.forEach((h, idx) => {
            obj[h] = (values[idx] ?? "").toString().trim()
        })
        return obj
    })
}

/**
 * Extract the spreadsheet ID from a Google Sheets URL.
 */
const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
}

/**
 * Extract the GID (sheet tab identifier) from a Google Sheets URL.
 * Defaults to "0" if not specified.
 */
const extractGid = (url: string): string => {
    const gidMatch = url.match(/[?#&]gid=(\d+)/)
    return gidMatch ? gidMatch[1] : "0"
}

/**
 * Parse a potentially formatted Indian number string to a float.
 * Handles formats like: "1,07,483", "₹ 10,50,000", "1050000", "10.5"
 */
function parseIndianNumber(raw: string): number {
    if (!raw || typeof raw !== "string") return 0
    // Strip ₹ symbol, spaces, commas
    const cleaned = raw.replace(/[₹,\s]/g, "").trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
}

// #endregion

// ─────────────────────────────────────────────
// #region  Shared Data Store (Singleton)
// ─────────────────────────────────────────────

/**
 * Module-level singleton so that ALL overrides (progress bar,
 * current-amount text, target-amount text) share the same fetch
 * result without redundant network calls.
 */

type Listener = () => void

interface DonationData {
    currentAmount: number
    targetAmount: number
    percentage: number
    allData: Record<string, string>[]
    lastUpdated: number | null
    error: string | null
    isLoading: boolean
}

const DEFAULT_DATA: DonationData = {
    currentAmount: 0,
    targetAmount: DONATION_TARGET,
    percentage: 0,
    allData: [],
    lastUpdated: null,
    error: null,
    isLoading: true,
}

let _sharedData: DonationData = { ...DEFAULT_DATA }
let _listeners: Set<Listener> = new Set()
let _pollingTimer: ReturnType<typeof setInterval> | null = null
let _subscriberCount = 0
let _isFetching = false

function _notify(): void {
    _listeners.forEach((fn) => {
        try {
            fn()
        } catch {
            // swallow listener errors
        }
    })
}

async function _fetchSheetData(): Promise<void> {
    if (_isFetching) return
    if (!GOOGLE_SHEETS_URL) {
        _sharedData = {
            ..._sharedData,
            error: "GOOGLE_SHEETS_URL is not set. Please configure it in DonationBarOverride.tsx.",
            isLoading: false,
        }
        _notify()
        return
    }

    _isFetching = true

    try {
        const sheetId = extractSheetId(GOOGLE_SHEETS_URL)
        if (!sheetId) {
            throw new Error(
                "Invalid Google Sheets URL. Could not extract spreadsheet ID."
            )
        }

        const gid = extractGid(GOOGLE_SHEETS_URL)
        let csvText: string

        if (GOOGLE_SHEETS_API_KEY) {
            // Private sheet via API v4
            const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:ZZ?key=${GOOGLE_SHEETS_API_KEY}`
            const response = await fetch(apiUrl)
            if (!response.ok) {
                throw new Error(
                    `Google Sheets API error: ${response.status} ${response.statusText}`
                )
            }
            const json = await response.json()
            const rows: string[][] = json.values || []
            csvText = rows
                .map((row: string[]) =>
                    row.map((cell: string) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
                )
                .join("\n")
        } else {
            // Shared sheet via Google Visualization API (gviz) — works for
            // sheets shared with "Anyone with the link" without needing
            // File → Share → Publish to Web.
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
            const response = await fetch(csvUrl)
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch sheet: ${response.status} ${response.statusText}. ` +
                    `Ensure the sheet is shared with \"Anyone with the link\".`
                )
            }
            csvText = await response.text()
        }

        const parsedData = parseCsvToObjects(csvText)

        // ────────────────────────────────────────────────────
        // Read the "Total Amount" summary row
        // (maintained by the Google Apps Script automation)
        // ────────────────────────────────────────────────────
        let currentAmount = 0

        if (parsedData.length > 0) {
            const sampleRow = parsedData[0]
            const amountKey = Object.keys(sampleRow).find(
                (k) => k.toLowerCase().trim() === COL_AMOUNT.toLowerCase().trim()
            )
            // Use the first column key to find the Total Amount row
            const firstColKey = Object.keys(sampleRow)[0]

            for (const row of parsedData) {
                const cellValue = firstColKey
                    ? (row[firstColKey] || "").toString().trim().toLowerCase()
                    : ""

                if (cellValue === TOTAL_ROW_LABEL.toLowerCase().trim()) {
                    const rawTotal = amountKey ? row[amountKey] : ""
                    currentAmount = parseIndianNumber(rawTotal)
                    break
                }
            }
        }

        const percentage = Math.min(
            (currentAmount / DONATION_TARGET) * 100,
            100
        )

        _sharedData = {
            currentAmount,
            targetAmount: DONATION_TARGET,
            percentage,
            allData: parsedData,
            lastUpdated: Date.now(),
            error: null,
            isLoading: false,
        }
    } catch (err: unknown) {
        const errorMessage =
            err instanceof Error ? err.message : "Unknown error fetching sheet data"

        // Keep last good data if available, just update error
        _sharedData = {
            ..._sharedData,
            error: errorMessage,
            isLoading: false,
        }
    } finally {
        _isFetching = false
    }

    _notify()
}

function _subscribe(listener: Listener): () => void {
    _listeners.add(listener)
    _subscriberCount++

    // Start polling when first subscriber connects
    if (_subscriberCount === 1) {
        _fetchSheetData() // initial fetch
        _pollingTimer = setInterval(_fetchSheetData, POLL_INTERVAL_MS)
    }

    return () => {
        _listeners.delete(listener)
        _subscriberCount--

        // Stop polling when all subscribers disconnect
        if (_subscriberCount <= 0) {
            _subscriberCount = 0
            if (_pollingTimer !== null) {
                clearInterval(_pollingTimer)
                _pollingTimer = null
            }
        }
    }
}

/**
 * React hook that subscribes to the shared donation data store.
 */
function useDonationData(): DonationData {
    const [, forceRender] = useState(0)

    useEffect(() => {
        const unsubscribe = _subscribe(() => {
            forceRender((n) => n + 1)
        })
        return unsubscribe
    }, [])

    return _sharedData
}

// #endregion

// ─────────────────────────────────────────────
// #region  Exported Overrides
// ─────────────────────────────────────────────

/**
 * Override: withDonationProgress
 *
 * ⚠️  Apply this to the FILL BAR layer (the coloured bar that grows),
 *     NOT the outer container. In Framer, each override targets one
 *     specific layer — you can't reliably modify children from a parent.
 *
 * Sets the layer's width to the current donation percentage and
 * adds a smooth transition so the bar animates when data refreshes.
 */
export const withDonationProgress = (
    Component: ComponentType<any>
): ComponentType => {
    const Wrapped = forwardRef((props: any, ref) => {
        const data = useDonationData()
        const pct = data.percentage

        return (
            <Component
                ref={ref}
                {...props}
                style={{
                    ...props?.style,
                    width: `${pct}%`,
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            />
        )
    })
    Wrapped.displayName = "withDonationProgress"
    return Wrapped
}

/**
 * Override: withCurrentAmount
 *
 * Apply this to the text layer showing the current donation total
 * (e.g. ₹ 1,07,483). Dynamically sets the text to the live total
 * read from the "Total Amount" row in Google Sheets.
 */
export const withCurrentAmount = (
    Component: ComponentType<any>
): ComponentType => {
    const Wrapped = forwardRef((props: any, ref) => {
        const data = useDonationData()

        const displayText = data.isLoading
            ? "Loading..."
            : data.error && data.lastUpdated === null
                ? "—"
                : formatINR(data.currentAmount)

        return (
            <Component
                ref={ref}
                {...props}
                text={displayText}
            />
        )
    })
    Wrapped.displayName = "withCurrentAmount"
    return Wrapped
}

/**
 * Override: withTargetAmount
 *
 * Apply this to the text layer showing the campaign target
 * (e.g. ₹ 60,00,000). Sets the text to the configured DONATION_TARGET.
 */
export const withTargetAmount = (
    Component: ComponentType<any>
): ComponentType => {
    const Wrapped = forwardRef((props: any, ref) => {
        const data = useDonationData()

        return (
            <Component
                ref={ref}
                {...props}
                text={formatINR(data.targetAmount)}
            />
        )
    })
    Wrapped.displayName = "withTargetAmount"
    return Wrapped
}

// #endregion
