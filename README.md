# Dynamic Graph Component for Framer

A powerful, intelligent data visualization component for Framer that automatically fetches data from Google Sheets and creates beautiful, interactive charts.

## Features

### 🚀 **Smart Data Analysis**
- Automatically detects data types (numbers, dates, categories)
- Intelligently suggests the best chart type for your data
- Handles mixed data types gracefully
- Supports multiple data series

### 📊 **Multiple Chart Types**
- **Line Charts** - Perfect for time series and trend data
- **Bar Charts** - Great for categorical comparisons
- **Area Charts** - Show cumulative values over time
- **Pie Charts** - Display proportional data
- **Scatter Plots** - Visualize correlations between variables
- **Auto-detection** - Let the component choose the best chart type

### 🎨 **Rich Customization**
- Full color control (primary, secondary, background)
- Typography settings (font family, size, colors)
- Toggle grid lines, legends, and tooltips
- Animation controls
- Responsive design

### 🔄 **Real-time Updates**
- Auto-refresh functionality
- Configurable refresh intervals
- Manual refresh capability
- Live data synchronization

### 🛡️ **Robust Error Handling**
- Clear error messages
- Retry functionality
- Loading states
- Data validation

## Setup Instructions

### 1. Google Sheets Configuration

#### Option A: Public Sheets (No API Key Required) ⭐ **Recommended for getting started**

1. **Create your Google Sheet**
   - Organize your data with headers in the first row
   - Use clear, descriptive column names
   - Ensure data consistency within columns

2. **Make your sheet public**
   - Go to File → Share → Share with others
   - Click "Change to anyone with the link"
   - Set permissions to "Viewer"
   - Copy the share link

3. **Use in your component**
   - Paste the Google Sheets URL in the component
   - **Leave the API Key field empty**
   - The component will automatically fetch data using the public CSV export

#### Option B: Private Sheets with API Key (For sensitive data)

1. **Set up Google Sheets API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google Sheets API
   - Create credentials (API Key)
   - Restrict the API key to Google Sheets API for security

2. **Configure your private sheet**
   - Keep your sheet private or share with specific people
   - Copy the Google Sheets URL
   - Enter both URL and API key in the component

### 2. Component Configuration

1. **Add the component to your Framer project**
   - Copy the `DynamicGraph.tsx` file to your Framer project
   - The component will appear in your assets panel

2. **Configure the data source**
   - **Google Sheets URL**: Full URL of your Google Sheet
   - **API Key**: Your Google Sheets API key (only required for private sheets - leave empty for public sheets)

3. **Customize the appearance**
   - Choose chart type or use auto-detection
   - Set colors, fonts, and styling
   - Configure titles and labels

## Data Structure Guidelines

### Optimal Data Organization

#### For Line Charts (Time Series)
```
Date       | Sales | Revenue | Users
2024-01-01 | 120   | 2400    | 45
2024-01-02 | 135   | 2700    | 52
2024-01-03 | 142   | 2840    | 48
```

#### For Bar Charts (Categories)
```
Product   | Q1 Sales | Q2 Sales | Q3 Sales
Laptop    | 250      | 280      | 320
Desktop   | 180      | 165      | 190
Tablet    | 320      | 360      | 380
```

#### For Pie Charts (Single Category)
```
Region    | Sales
North     | 2500
South     | 1800
East      | 2200
West      | 1950
```

#### For Scatter Plots (Correlation)
```
Height | Weight | Age
170    | 65     | 25
175    | 72     | 30
168    | 58     | 22
```

### Data Type Detection

The component automatically detects:
- **Numeric data**: Numbers, percentages, currencies
- **Date data**: Various date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)
- **Categorical data**: Text labels, categories, names

## Property Controls Reference

### Data Source
- **Google Sheets URL**: The complete URL of your Google Sheet
- **Google API Key**: API key for accessing private sheets (leave empty for public sheets)

### Chart Configuration
- **Chart Type**: Auto-detect, Line, Bar, Pie, Area, or Scatter
- **Chart Title**: Main heading for your chart
- **Chart Subtitle**: Additional descriptive text

### Visual Styling
- **Primary Color**: Main color for data series
- **Secondary Color**: Color for secondary elements
- **Background Color**: Component background
- **Show Grid**: Toggle grid lines on/off
- **Show Legend**: Toggle legend display
- **Show Tooltip**: Toggle interactive tooltips

### Animation & Behavior
- **Animation Duration**: Chart animation speed (0-3000ms)
- **Auto Refresh**: Enable automatic data updates
- **Refresh Interval**: Update frequency (5-3600 seconds)

### Typography
- **Font Family**: Choose your preferred font
- **Font Size**: Text size for labels and data
- **Title Color**: Color for chart titles
- **Label Color**: Color for axis labels and text

## Advanced Usage Tips

### 1. **Optimizing Performance**
- Keep datasets under 1000 rows for best performance
- Use appropriate refresh intervals (avoid < 30 seconds)
- Consider caching for frequently accessed data

### 2. **Data Quality**
- Ensure consistent data formats within columns
- Handle missing values appropriately
- Use clear, descriptive column headers

### 3. **Chart Selection**
- **Line charts**: Best for trends over time
- **Bar charts**: Great for comparing categories
- **Pie charts**: Use when showing parts of a whole (< 7 categories)
- **Area charts**: Show cumulative values
- **Scatter plots**: Reveal correlations between variables

### 4. **Responsive Design**
- The component automatically adapts to its container
- Test on different screen sizes
- Consider mobile viewing when setting font sizes

## Troubleshooting

### Common Issues

**"Invalid Google Sheets URL"**
- Ensure you're using the complete Google Sheets URL
- Check that the sheet ID is correctly extracted
- Verify the sheet is accessible

**"API Error: 403 Forbidden"**
- Check your API key is valid and active
- Ensure the Google Sheets API is enabled
- Verify the sheet has proper sharing permissions

**"No data found in the sheet"**
- Confirm the sheet contains data
- Check that the first row contains headers
- Ensure there are data rows below the headers

**"Failed to fetch data"**
- Check your internet connection
- Verify the Google Sheets service is available
- Try refreshing the component

### Best Practices

1. **Security**: Use API keys for private data, public sharing for non-sensitive information
2. **Performance**: Set reasonable refresh intervals based on data update frequency
3. **User Experience**: Provide clear titles and labels for better understanding
4. **Design**: Choose colors that work well with your overall design system
5. **Data Quality**: Clean and validate your data before visualization

## Examples

### Sales Dashboard
```
Date       | Product Sales | Service Revenue | Total Customers
2024-01-01 | 15000        | 8000           | 245
2024-01-02 | 18000        | 9500           | 267
2024-01-03 | 16500        | 8800           | 251
```
*Result: Automatic line chart with multiple series*

### Market Share Analysis
```
Company | Market Share
Apple   | 28.5
Samsung | 22.1
Google  | 15.8
Others  | 33.6
```
*Result: Automatic pie chart showing proportions*

### Performance Metrics
```
Month | Conversion Rate | Click Rate | Bounce Rate
Jan   | 3.2            | 12.5       | 45.2
Feb   | 3.8            | 13.1       | 42.8
Mar   | 4.1            | 14.2       | 40.5
```
*Result: Automatic bar chart comparing metrics*

## Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Verify your data structure follows the guidelines
3. Test with a simple dataset first
4. Review the property controls for correct configuration

The Dynamic Graph component is designed to be intuitive and powerful, automatically handling complex data analysis while providing extensive customization options for your specific needs.
