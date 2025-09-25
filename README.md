## Framer Components Collection

A comprehensive collection of dynamic, customizable React components for Framer, featuring modern animations and data visualization capabilities.

## Components

### Mouse Triggers
Interactive components that work together to create sophisticated click tracking and view counting systems.

#### ViewCounter
A social media-style view counter component with smooth animations and multiple display formats.

**Features:**
- Animated count-up transitions with easing
- Multiple format styles (compact: 1.2K, full: 1,200, custom suffix)
- Icon types: eye, views, heart, star, or custom SVG
- Event-based communication system
- Parent frame click support
- Mobile responsive design
- Full accessibility support

#### ClickTrigger
An invisible overlay component that captures clicks and communicates with ViewCounter components.

**Features:**
- Completely transparent click capture area
- Event-based communication with ViewCounter
- Debug mode with visible outline
- Flexible positioning and sizing
- Configurable increment amounts
- Multiple instance support with unique targeting

**Usage Example:**
```tsx
// Step 1: Add ViewCounter with unique ID
<ViewCounter
  componentId="productCard1"
  listenToTriggers={true}
  disableDirectClick={true}
/>

// Step 2: Add ClickTrigger targeting the counter
<ClickTrigger
  targetComponentId="productCard1"
  incrementAmount={1}
/>
```

### CircularText
A rotating text component that displays text in a circular pattern with customizable animation.

**Features:**
- Customizable text, speed, direction
- Font and color controls
- Adjustable circle size and radius
- Smooth rotation animation

### FlipWords
An animated text component that cycles through words with smooth transitions, inspired by Aceternity UI.

**Features:**
- 5 animation types: fade, slide, flip, bounce, scale
- Customizable timing and easing
- Mobile responsive design
- Pause on hover functionality
- Random or sequential word order
- Full styling control through Framer property controls

## Customization

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

## Acknowledgments

- **Framer Team**: For creating an amazing design tool
- **React Community**: For the powerful React ecosystem
- **Open Source Contributors**: For their valuable contributions

## Version History

### v1.1.0 (Current)
- **NEW**: Mouse Triggers system with ViewCounter and ClickTrigger components
- Added sophisticated click tracking and view counting functionality
- Event-based component communication system
- Modular component architecture for flexible integration
- Comprehensive demo examples and documentation
- Organized components into logical subfolders

### v1.0.0
- Initial release with core components
- DynamicGraph component with Google Sheets integration
- UI components (Accordion, ContactCard, FeatureCard, HoverImageSection)
- GoogleSheetsSetup component
- Comprehensive test suite
- Full TypeScript support

---

**Made with love for the Framer community**

*If you find this repository helpful, please give it a ⭐ on GitHub!*
