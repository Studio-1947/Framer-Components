import React from "react"
import Accordion from "../components/Accordion"

export default function AccordionDemo() {
    return (
        <div
            style={{
                padding: "40px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}
        >
            <div style={{ maxWidth: "600px", width: "100%" }}>
                <h1
                    style={{
                        textAlign: "center",
                        color: "white",
                        marginBottom: "40px",
                        fontSize: "2.5rem",
                        fontWeight: "bold"
                    }}
                >
                    FAQ
                </h1>
                
                <Accordion
                    items={[
                        {
                            id: "1",
                            heading: "What is Framer?",
                            content: "Framer is a powerful design and prototyping tool that allows you to create interactive designs, prototypes, and components with real code."
                        },
                        {
                            id: "2",
                            heading: "How do I use Code Components?",
                            content: "Code Components allow you to build custom interactive components using React. You can add property controls to make them customizable in the Framer interface."
                        },
                        {
                            id: "3",
                            heading: "Can I customize the animations?",
                            content: "Yes! This accordion component includes multiple animation types including smooth, bouncy, quick, slow, and spring animations. You can also customize colors, spacing, and more."
                        },
                        {
                            id: "4",
                            heading: "Is it responsive?",
                            content: "Absolutely! The accordion component is built to be fully responsive and works great on all screen sizes. It adapts to the container width automatically."
                        }
                    ]}
                    animationType="smooth"
                    width={600}
                    spacing={12}
                    padding={24}
                    borderRadius={16}
                    
                    headingTextStyle={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: "#333333"
                    }}
                    contentTextStyle={{
                        fontSize: 16,
                        lineHeight: 1.5
                    }}
                    contentAlign="left"
                    showIcon={true}
                    
                    iconSize={24}
                    iconType="plus"
                    
                />
            </div>
        </div>
    )
}
