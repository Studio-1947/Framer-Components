## Framer Components Collection

A comprehensive collection of dynamic, customizable React components for Framer, featuring modern animations and data visualization capabilities.

## Components


### Weather
A real-time weather display component that fetches current temperature and air quality data.

**Features:**
- Real-time temperature and AQI data from Open-Meteo APIs
- **NEW** Dynamic weather icons based on conditions
- **NEW** Local caching for instant load times
- **NEW** Auto-retry logic for network resilience
- Configurable location coordinates
- Automatic data refresh intervals
- Clean, minimal design with transparent background
- Comprehensive typography controls
- Error handling with user feedback
- Mobile responsive design

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

### FAQ
A customizable FAQ component with smooth expand/collapse animations and extensive styling controls.

**Features:**
- Expandable/collapsible items with smooth height transitions
- Customizable icons (Plus/Minus, Lines, Chevron) with color control
- Unified typography controls for questions and answers
- Configurable divider styles
- Responsive design with flexible alignment

### Razorpay
A wrapper component for easily integrating Razorpay payment buttons with automatic styling.

**Features:**
- Seamless integration of Razorpay payment buttons
- Automatic rounded corner styling to match modern UI
- Alignment controls (Left, Center, Right)
- Custom Button ID support via property controls

### ScrollRotator
An interactive component that rotates its content based on scroll direction.

**Features:**
- Scroll-direction aware rotation (Clockwise on scroll down, Anticlockwise on scroll up)
- Customizable rotation speed and size
- Slot support for multiple items
- Optional background with color control
- Optimized for performance with `useAnimationFrame`

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

### v1.4.0 (Current)
- **Weather**: Major enhancements including local caching, retry logic, dynamic weather icons, and streamlined property controls.
- **Weather**: Updated default location to "Mirik, Darjeeling India".

### v1.3.0
- **FAQ**: Refactored properties for better usability, unified font controls, added icon color.
- **Razorpay**: Added Razorpay payment button component with auto-styling.
- **ScrollRotator**: Added scroll-aware rotation component.

### v1.2.0
- **NEW**: Weather component with real-time data fetching
- Added Open-Meteo API integration for temperature and air quality
- Optimized font control patterns for better Framer compatibility
- Updated component documentation with font handling best practices
- Enhanced typography controls across all components

### v1.1.0
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

