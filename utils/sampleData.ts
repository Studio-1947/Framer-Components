// Sample data generator for testing and demonstration

export interface SampleDataConfig {
  type: "sales" | "analytics" | "finance" | "ecommerce" | "social" | "custom"
  rows: number
  startDate?: Date
  endDate?: Date
}

/**
 * Generate sample sales data
 */
export function generateSalesData(rows: number = 30): any[] {
  const data: any[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - rows)
  
  const products = ["Laptop", "Desktop", "Tablet", "Phone", "Headphones"]
  const regions = ["North", "South", "East", "West", "Central"]
  
  for (let i = 0; i < rows; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    data.push({
      Date: date.toISOString().split('T')[0],
      Product: products[i % products.length],
      Region: regions[i % regions.length],
      Sales: Math.floor(Math.random() * 5000) + 1000,
      Revenue: Math.floor(Math.random() * 50000) + 10000,
      Units: Math.floor(Math.random() * 100) + 10,
      "Profit Margin": (Math.random() * 0.3 + 0.1).toFixed(2)
    })
  }
  
  return data
}

/**
 * Generate sample website analytics data
 */
export function generateAnalyticsData(rows: number = 30): any[] {
  const data: any[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - rows)
  
  const sources = ["Organic", "Direct", "Social", "Email", "Paid"]
  const devices = ["Desktop", "Mobile", "Tablet"]
  
  for (let i = 0; i < rows; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    const sessions = Math.floor(Math.random() * 10000) + 1000
    const pageviews = sessions * (Math.random() * 3 + 1)
    const bounceRate = Math.random() * 0.6 + 0.2
    
    data.push({
      Date: date.toISOString().split('T')[0],
      Source: sources[i % sources.length],
      Device: devices[i % devices.length],
      Sessions: sessions,
      Pageviews: Math.floor(pageviews),
      "Bounce Rate": (bounceRate * 100).toFixed(1),
      "Avg Session Duration": (Math.random() * 300 + 60).toFixed(0),
      Conversions: Math.floor(sessions * 0.02 * Math.random() + 1)
    })
  }
  
  return data
}

/**
 * Generate sample financial data
 */
export function generateFinanceData(rows: number = 12): any[] {
  const data: any[] = []
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  let revenue = 100000
  let expenses = 70000
  
  for (let i = 0; i < rows; i++) {
    // Add some realistic growth and variance
    revenue = revenue * (1 + (Math.random() * 0.2 - 0.05))
    expenses = expenses * (1 + (Math.random() * 0.15 - 0.03))
    
    const profit = revenue - expenses
    const margin = (profit / revenue) * 100
    
    data.push({
      Month: months[i % 12],
      Revenue: Math.floor(revenue),
      Expenses: Math.floor(expenses),
      Profit: Math.floor(profit),
      "Profit Margin": margin.toFixed(1),
      "Growth Rate": ((Math.random() * 0.3 - 0.1) * 100).toFixed(1)
    })
  }
  
  return data
}

/**
 * Generate sample e-commerce data
 */
export function generateEcommerceData(rows: number = 50): any[] {
  const data: any[] = []
  const categories = ["Electronics", "Clothing", "Home", "Sports", "Books"]
  const brands = ["BrandA", "BrandB", "BrandC", "BrandD", "BrandE"]
  
  for (let i = 0; i < rows; i++) {
    const price = Math.random() * 500 + 20
    const rating = Math.random() * 2 + 3 // 3-5 star rating
    const orders = Math.floor(Math.random() * 1000) + 10
    
    data.push({
      "Product ID": `P${1000 + i}`,
      Category: categories[i % categories.length],
      Brand: brands[i % brands.length],
      Price: price.toFixed(2),
      Rating: rating.toFixed(1),
      "Orders": orders,
      "Revenue": (price * orders).toFixed(2),
      "Stock Level": Math.floor(Math.random() * 100) + 5,
      "Return Rate": (Math.random() * 0.1).toFixed(3)
    })
  }
  
  return data
}

/**
 * Generate sample social media data
 */
export function generateSocialMediaData(rows: number = 30): any[] {
  const data: any[] = []
  const platforms = ["Facebook", "Instagram", "Twitter", "LinkedIn", "TikTok"]
  const contentTypes = ["Photo", "Video", "Article", "Story", "Live"]
  
  for (let i = 0; i < rows; i++) {
    const followers = Math.floor(Math.random() * 100000) + 1000
    const engagement = Math.random() * 0.1 + 0.01
    
    data.push({
      Date: new Date(Date.now() - (rows - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Platform: platforms[i % platforms.length],
      "Content Type": contentTypes[i % contentTypes.length],
      Followers: followers,
      Likes: Math.floor(followers * engagement * Math.random()),
      Shares: Math.floor(followers * engagement * 0.1 * Math.random()),
      Comments: Math.floor(followers * engagement * 0.05 * Math.random()),
      "Engagement Rate": (engagement * 100).toFixed(2),
      Reach: Math.floor(followers * (Math.random() * 2 + 0.5))
    })
  }
  
  return data
}

/**
 * Convert data to CSV format for Google Sheets
 */
export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ""
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape values that contain commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(",")
    )
  ].join("\n")
  
  return csvContent
}

/**
 * Download data as CSV file
 */
export function downloadAsCSV(data: any[], filename: string = "sample-data.csv"): void {
  const csv = convertToCSV(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Generate sample data based on type
 */
export function generateSampleData(config: SampleDataConfig): any[] {
  const { type, rows } = config
  
  switch (type) {
    case "sales":
      return generateSalesData(rows)
    case "analytics":
      return generateAnalyticsData(rows)
    case "finance":
      return generateFinanceData(rows)
    case "ecommerce":
      return generateEcommerceData(rows)
    case "social":
      return generateSocialMediaData(rows)
    default:
      return generateSalesData(rows)
  }
}
