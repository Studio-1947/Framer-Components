import React from "react"
import FeatureCard from "../components/FeatureCard"

export default function FeatureCardDemo() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 32,
      padding: 40,
      backgroundColor: "#f5f5f5",
      minHeight: "100vh"
    }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700 }}>
        FeatureCard Component Demo
      </h1>
      
      {/* Responsive Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 24,
        width: "100%"
      }}>
        {/* Default Card */}
        <FeatureCard
          heading="Features"
          features={[
            { text: "Lorem Ipsum" },
            { text: "Lorem Ipsum" },
            { text: "Lorem Ipsum" },
            { text: "Lorem Ipsum" },
            { text: "Lorem Ipsum" }
          ]}
        />
        
        {/* Dark Background Card */}
        <FeatureCard
          heading="Premium Features"
          features={[
            { text: "Advanced Analytics" },
            { text: "Priority Support" },
            { text: "Custom Integrations" },
            { text: "White-label Options" }
          ]}
          
        />
        
        {/* Light Gray Background */}
        <FeatureCard
          heading="Basic Plan"
          features={[
            { text: "5 Projects" },
            { text: "10GB Storage" },
            { text: "Email Support" }
          ]}
          width={250}
          height={220}
          padding={20}
          headingFontSize={18}
        />
        
        {/* Larger Card */}
        <FeatureCard
          heading="Enterprise Solution"
          features={[
            { text: "Unlimited Projects" },
            { text: "Dedicated Support" },
            { text: "Custom Branding" },
            { text: "API Access" },
            { text: "Advanced Security" },
            { text: "Team Collaboration" }
          ]}
          width={300}
          height={350}
          headingFontSize={24}
          headingFontWeight={700}
        />
      </div>
      
      {/* Flex Layout Example */}
      <div>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 24, fontWeight: 600 }}>
          Flexible Layout Examples
        </h2>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "stretch"
        }}>
          <FeatureCard
            heading="Compact"
            features={[
              { text: "Feature 1" },
              { text: "Feature 2" }
            ]}
            width={180}
            height={160}
          />
          <FeatureCard
            heading="Standard"
            features={[
              { text: "Feature 1" },
              { text: "Feature 2" },
              { text: "Feature 3" },
              { text: "Feature 4" }
            ]}
            width={220}
          />
          <FeatureCard
            heading="Extended"
            features={[
              { text: "Feature 1" },
              { text: "Feature 2" },
              { text: "Feature 3" },
              { text: "Feature 4" },
              { text: "Feature 5" },
              { text: "Feature 6" },
              { text: "Feature 7" }
            ]}
            width={260}
            height={320}
          />
        </div>
      </div>
      
      <div style={{
        marginTop: 32,
        padding: 24,
        backgroundColor: "white",
        borderRadius: 8,
        border: "1px solid #e0e0e0"
      }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 24, fontWeight: 600 }}>
          Component Features
        </h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          <li><strong>Smart Color Logic:</strong> Automatically adjusts text colors based on background</li>
          <li><strong>Responsive Design:</strong> Flexible width with proper alignment for all screen sizes</li>
          <li><strong>Simplified Controls:</strong> Essential controls only - no overwhelming options</li>
          <li><strong>Left Alignment:</strong> Content stays left-aligned for better readability</li>
          <li><strong>Auto Hover States:</strong> Smart defaults for hover effects (yellow heading on dark background)</li>
          <li><strong>Framer Shadow Controls:</strong> Built-in shadow customization</li>
          <li><strong>Smooth Animations:</strong> Framer Motion transitions for professional feel</li>
        </ul>
      </div>
    </div>
  )
}
