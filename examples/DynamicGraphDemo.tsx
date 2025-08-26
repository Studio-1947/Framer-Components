import React from "react"
import { addPropertyControls, ControlType } from "framer"
import DynamicGraph from "../components/DynamicGraph"

// Example component with sample data for demonstration
export default function DynamicGraphDemo(props: { 
  demoType: "sales" | "analytics" | "finance" | "custom"
  customUrl?: string
  customApiKey?: string
}) {
    
    // Sample data URLs for demonstration
    const sampleSheets = {
        sales: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
        analytics: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit", 
        finance: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
    }
    
    const getSheetUrl = () => {
        if (props.demoType === "custom" && props.customUrl) {
            return props.customUrl
        }
        if (props.demoType === "custom") {
            return sampleSheets.sales // fallback
        }
        return sampleSheets[props.demoType]
    }
    
    const getTitle = () => {
        switch (props.demoType) {
            case "sales": return "Sales Performance Dashboard"
            case "analytics": return "Website Analytics Overview"
            case "finance": return "Financial Metrics Report"
            case "custom": return "Custom Data Visualization"
            default: return "Dynamic Graph Demo"
        }
    }
    
    const getSubtitle = () => {
        switch (props.demoType) {
            case "sales": return "Real-time sales data from Google Sheets"
            case "analytics": return "Traffic and engagement metrics"
            case "finance": return "Revenue and cost analysis"
            case "custom": return "Your custom dataset visualization"
            default: return "Demonstrating automatic chart generation"
        }
    }
    
    return (
        <DynamicGraph
            googleSheetsUrl={getSheetUrl()}
            useApiKey={!!props.customApiKey}
            apiKey={props.customApiKey || ""}
            title={getTitle()}
            subtitle={getSubtitle()}
            primaryColor="#2563eb"
            secondaryColor="#10b981"
            backgroundColor="#f8fafc"
            showGrid={true}
            showLegend={true}
            showTooltip={true}
            animationDuration={1200}
            width={800}
            height={500}
            autoRefresh={false}
            refreshInterval={60}
            customStyling={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: 12,
                titleSize: 18,
                subtitleSize: 14,
                labelSize: 12,
                titleColor: "#1e293b",
                subtitleColor: "#64748b",
                labelColor: "#64748b",
                gridColor: "#e0e0e0",
                borderRadius: 8,
                padding: 20,
                titleWeight: "600",
                subtitleWeight: "400"
            }}
        />
    )
}

DynamicGraphDemo.defaultProps = {
    demoType: "sales",
    customUrl: "",
    customApiKey: ""
}

addPropertyControls(DynamicGraphDemo, {
    demoType: {
        type: ControlType.Enum,
        title: "Demo Type",
        description: "Choose a demo dataset or use your custom data",
        options: ["sales", "analytics", "finance", "custom"],
        optionTitles: ["Sales Data", "Analytics Data", "Finance Data", "Custom Data"]
    },
    customUrl: {
        type: ControlType.String,
        title: "Custom Google Sheets URL",
        description: "Your own Google Sheets URL (only when Custom Data is selected)",
        hidden(props) {
            return props.demoType !== "custom"
        }
    },
    customApiKey: {
        type: ControlType.String,
        title: "Custom API Key",
        description: "Your Google Sheets API key (optional for public sheets)",
        obscured: true,
        hidden(props) {
            return props.demoType !== "custom"
        }
    }
})
