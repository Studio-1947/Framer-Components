# Framer Components Collection

A comprehensive collection of dynamic, customizable React components for Framer, featuring modern animations and data visualization capabilities.

## 🚀 Components

### 🔤 FlipWords ✨ NEW
An animated text component that cycles through words with smooth transitions, inspired by Aceternity UI.

**Features:**
- 5 animation types: fade, slide, flip, bounce, scale
- Customizable timing and easing
- Mobile responsive design
- Pause on hover functionality
- Random or sequential word order
- Full styling control through Framer property controls

**Example:**
```tsx
<FlipWords
  words={["amazing", "beautiful", "fantastic", "incredible"]}
  textBefore="Build"
  textAfter="websites"
  duration={3000}
  animation={{
    animationType: "fade",
    pauseOnHover: true
  }}
/>
```

## 🛠 Installation

### For Framer Projects

1. **Clone the repository:**
```bash
git clone https://github.com/Cykeek/Framer-Components.git
cd Framer-Components
```

2. **Install dependencies:**
```bash
npm install
```

3. **Copy components to your Framer project:**
Copy the desired component files from the `components/` directory to your Framer project's code components folder.

### Manual Installation

1. Download the component files you need from the `components/` directory
2. Import them into your Framer project
3. Configure the component properties in Framer's property panel

## 📖 Usage

### DynamicGraph Component

```tsx
import DynamicGraph from './components/DynamicGraph'

// Basic usage
<DynamicGraph
  googleSheetsUrl="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID"
  useApiKey={false}
  primaryColor="#8884d8"
  showGrid={true}
  showLegend={true}
  title="Sales Data"
  subtitle="Monthly performance metrics"
/>
```

## 🎨 Customization

All components support extensive customization through Framer's property controls:

### Common Properties
- **Colors**: Primary, secondary, background, and accent colors
- **Typography**: Font family, size, weight, and color inheritance
- **Spacing**: Padding, margins, and layout controls
- **Animation**: Duration, easing, and interaction settings

### Advanced Configuration
- **Performance**: Quality presets and optimization settings
- **Accessibility**: ARIA labels and keyboard navigation
- **Responsive**: Breakpoint-specific configurations

## 🔧 Development

### Project Structure
```
Framer-Components/
├── components/           # Main component files
│   ├── DynamicGraph.tsx
│   ├── Accordion.tsx
│   ├── ContactCard.tsx
│   ├── FeatureCard.tsx
│   ├── GoogleSheetsSetup.tsx
│   └── HoverImageSection.tsx
├── examples/            # Usage examples
├── utils/               # Utility functions
├── types/               # TypeScript definitions
├── tests/               # Test files
├── __mocks__/           # Mock data and utilities
└── .github/             # GitHub configuration
```

### Building Components

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Development server (if available)
npm run dev
```

### Component Development Guidelines

1. **TypeScript**: Use strict TypeScript with proper type definitions
2. **Framer Integration**: Implement `addPropertyControls` for all configurable properties
3. **Error Handling**: Include comprehensive error boundaries and fallbacks
4. **Performance**: Optimize for performance with proper memoization and lazy loading
5. **Accessibility**: Follow WCAG guidelines and include proper ARIA attributes
6. **Documentation**: Document all props and usage examples

## 🧪 Testing

The repository includes comprehensive test suites:

```bash
# Run all tests
npm test

# Run specific component tests
npm test -- --testPathPattern=DynamicGraph

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Framer Team**: For creating an amazing design tool
- **React Community**: For the powerful React ecosystem
- **Open Source Contributors**: For their valuable contributions

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Cykeek/Framer-Components/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Cykeek/Framer-Components/discussions)
- **Documentation**: See individual component files for detailed documentation

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core components
- DynamicGraph component with Google Sheets integration
- UI components (Accordion, ContactCard, FeatureCard, HoverImageSection)
- GoogleSheetsSetup component
- Comprehensive test suite
- Full TypeScript support

---

**Made with ❤️ for the Framer community**

*If you find this repository helpful, please give it a ⭐ on GitHub!*
