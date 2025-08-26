// Utility functions for Google Sheets integration and data processing

export interface SheetData {
  values: string[][]
}

export interface DataPoint {
  [key: string]: string | number | Date
}

/**
 * Extract Google Sheets ID from various URL formats
 */
export function extractSheetId(url: string): string | null {
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/document\/d\/([a-zA-Z0-9-_]+)/,
    /spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

/**
 * Build Google Sheets API URL with proper parameters
 */
export function buildSheetsApiUrl(sheetId: string, apiKey: string, range = "A:Z"): string {
  const baseUrl = "https://sheets.googleapis.com/v4/spreadsheets"
  return `${baseUrl}/${sheetId}/values/${range}?key=${apiKey}&valueRenderOption=UNFORMATTED_VALUE`
}

/**
 * Convert sheet values array to objects with headers
 */
export function convertSheetToObjects(values: string[][]): DataPoint[] {
  if (!values || values.length < 2) {
    throw new Error("Sheet must have at least a header row and one data row")
  }
  
  const [headers, ...rows] = values
  
  return rows
    .filter(row => row.some(cell => cell !== "" && cell !== null && cell !== undefined))
    .map(row => {
      const obj: DataPoint = {}
      headers.forEach((header, index) => {
        const value = row[index]
        obj[header] = value || ""
      })
      return obj
    })
}

/**
 * Detect data types in columns
 */
export function analyzeColumnTypes(data: DataPoint[]): {
  numeric: string[]
  categorical: string[]
  date: string[]
  mixed: string[]
} {
  if (!data || data.length === 0) {
    return { numeric: [], categorical: [], date: [], mixed: [] }
  }
  
  const headers = Object.keys(data[0])
  const sampleSize = Math.min(20, data.length)
  const sample = data.slice(0, sampleSize)
  
  const result = {
    numeric: [] as string[],
    categorical: [] as string[],
    date: [] as string[],
    mixed: [] as string[]
  }
  
  headers.forEach(header => {
    const values = sample
      .map(row => row[header])
      .filter(val => val !== null && val !== undefined && val !== "")
    
    if (values.length === 0) {
      result.mixed.push(header)
      return
    }
    
    // Check for dates
    const dateCount = values.filter(val => {
      if (typeof val === "string") {
        const parsed = Date.parse(val)
        return !isNaN(parsed) && isNaN(Number(val))
      }
      return val instanceof Date
    }).length
    
    // Check for numbers
    const numericCount = values.filter(val => {
      if (typeof val === "number") return true
      if (typeof val === "string") {
        const num = parseFloat(val)
        return !isNaN(num) && isFinite(num)
      }
      return false
    }).length
    
    const dateRatio = dateCount / values.length
    const numericRatio = numericCount / values.length
    
    if (dateRatio > 0.7) {
      result.date.push(header)
    } else if (numericRatio > 0.7) {
      result.numeric.push(header)
    } else if (numericRatio > 0.3 || dateRatio > 0.3) {
      result.mixed.push(header)
    } else {
      result.categorical.push(header)
    }
  })
  
  return result
}

/**
 * Suggest the best chart type based on data structure
 */
export function suggestChartType(columnTypes: ReturnType<typeof analyzeColumnTypes>): string {
  const { numeric, categorical, date } = columnTypes
  
  // Time series data
  if (date.length > 0 && numeric.length > 0) {
    return "line"
  }
  
  // Single category with single numeric value - good for pie
  if (categorical.length === 1 && numeric.length === 1) {
    return "pie"
  }
  
  // Categories with multiple numeric values - bar chart
  if (categorical.length > 0 && numeric.length > 1) {
    return "bar"
  }
  
  // Two or more numeric columns - scatter plot
  if (numeric.length >= 2) {
    return "scatter"
  }
  
  // Default to bar chart
  return "bar"
}

/**
 * Clean and process data for charting
 */
export function processDataForChart(
  data: DataPoint[],
  columnTypes: ReturnType<typeof analyzeColumnTypes>
): DataPoint[] {
  return data.map(row => {
    const processedRow: DataPoint = {}
    
    Object.entries(row).forEach(([key, value]: [string, any]) => {
      let processedValue = value
      
      // Convert numeric columns
      if (columnTypes.numeric.includes(key)) {
        if (typeof value === "string" && value !== "") {
          const num = parseFloat(value)
          processedValue = isNaN(num) ? 0 : num
        } else if (typeof value === "number") {
          processedValue = value
        } else {
          processedValue = 0
        }
      }
      
      // Convert date columns
      else if (columnTypes.date.includes(key)) {
        if (typeof value === "string" && value !== "") {
          const date = new Date(value)
          processedValue = isNaN(date.getTime()) ? value : date.toLocaleDateString()
        }
      }
      
      // Keep categorical as string
      else {
        processedValue = String(value || "")
      }
      
      processedRow[key] = processedValue
    })
    
    return processedRow
  })
}

/**
 * Generate color palette for data series
 */
export function generateColorPalette(count: number, baseColor = "#8884d8"): string[] {
  const colors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1",
    "#d084d0", "#ffb347", "#87ceeb", "#dda0dd", "#98fb98",
    "#f0e68c", "#ff6347", "#40e0d0", "#ee82ee", "#90ee90"
  ]
  
  if (count <= colors.length) {
    return colors.slice(0, count)
  }
  
  // Generate additional colors if needed
  const result = [...colors]
  const baseHue = parseInt(baseColor.slice(1), 16)
  
  for (let i = colors.length; i < count; i++) {
    const hue = (baseHue + (i - colors.length) * 137.5) % 360
    const color = `hsl(${hue}, 70%, 60%)`
    result.push(color)
  }
  
  return result
}

/**
 * Validate Google Sheets API response
 */
export function validateSheetsResponse(response: any): SheetData {
  if (!response) {
    throw new Error("No response received from Google Sheets API")
  }
  
  if (response.error) {
    throw new Error(`Google Sheets API Error: ${response.error.message}`)
  }
  
  if (!response.values) {
    throw new Error("No data found in the sheet")
  }
  
  if (!Array.isArray(response.values) || response.values.length === 0) {
    throw new Error("Sheet contains no data")
  }
  
  return response as SheetData
}

/**
 * Format numbers for display in charts
 */
export function formatNumber(value: number, type: "currency" | "percentage" | "decimal" | "integer" = "decimal"): string {
  switch (type) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(value)
    
    case "percentage":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(value / 100)
    
    case "integer":
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0
      }).format(value)
    
    default:
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value)
  }
}
