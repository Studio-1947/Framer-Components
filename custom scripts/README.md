# Framer Custom Scripts

A collection of custom code snippets to enhance your Framer websites.

---

## 📁 Available Scripts

### 1. Performance Script (`performance.html`)

Automatically detects low-performance devices and reduces visual effects for a smoother experience.

| File               | Size       |
| ------------------ | ---------- |
| `performance.html` | **~1.2KB** |

> **Note:** Minified to fit Framer's custom code character limit.

---

### Features

- 🎮 **GPU Detection** - WebGL-based renderer check
- 🧠 **Memory Detection** - Uses `navigator.deviceMemory`
- ⚙️ **CPU Detection** - Uses `navigator.hardwareConcurrency`
- ♿ **Accessibility** - Respects `prefers-reduced-motion`
- 💾 **Persistent** - Saves user preference to localStorage
- 🎛️ **Manual Override** - Console API for testing

---

### What Gets Disabled in Lite Mode (v2.1+)

**Only applies to semantic UI elements:** `<nav>`, `<footer>`, `<header>`, `<button>` and their ARIA role equivalents.

| Effect            | Status                                  |
| ----------------- | --------------------------------------- |
| `box-shadow`      | ❌ Disabled on targeted elements        |
| `backdrop-filter` | ❌ Disabled on targeted elements        |
| `filter`          | ❌ Disabled on targeted elements        |
| `animation`       | ❌ Disabled on targeted elements        |
| `transition`      | ⚡ Reduced to 0.1s on targeted elements |

---

### Targeted vs Preserved Elements (v2.1+)

| Targeted (Effects Reduced) | Preserved (Effects Kept) |
| -------------------------- | ------------------------ |
| `<nav>`                    | `<div>`                  |
| `<footer>`                 | `<section>`              |
| `<header>`                 | `<article>`              |
| `<button>`                 | `<main>`                 |
| `[role=navigation]`        | `<aside>`                |
| `[role=banner]`            | Custom elements          |
| `[role=contentinfo]`       | Intentional blur effects |
| `[role=button]`            | All other elements       |

> **Why this matters:** In Framer, most custom blur effects are applied to `<div>` elements. By targeting only semantic UI components, your intentional design choices are preserved while still optimizing performance on low-end devices.

---

### Installation

1. Open your Framer project
2. Go to **Site Settings** → **Custom Code**
3. Copy contents of `performance.html`
4. Paste into **End of `<body>`**
5. Publish your site

---

### Console Commands

```javascript
// Force lite mode
window.setFP("low");

// Force full effects mode
window.setFP("high");

// Check current mode
console.log(window.fpMode);
```

---

### CSS Classes

| Class     | When Applied                        |
| --------- | ----------------------------------- |
| `.fp-low` | Body class when lite mode is active |

Use this to create custom overrides:

```css
/* Example: Hide heavy video backgrounds in lite mode */
.fp-low .hero-video {
  display: none;
}
```

---

### Detection Logic

```
┌─────────────────────────────────────┐
│         User Preference Set?         │
│         (localStorage)               │
└──────────────┬──────────────────────┘
               │ No
               ▼
┌─────────────────────────────────────┐
│         GPU Check (WebGL)            │
│  - SwiftShader, LLVM, Software?     │
│  - Basic Render, Mesa, VirtualBox?  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Hardware Check               │
│  - Memory < 4GB?                    │
│  - CPU Cores ≤ 2?                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         User Preferences             │
│  - prefers-reduced-motion?          │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │             │
    [LOW MODE]   [HIGH MODE]
```

---

### Lite Mode Indicator

When lite mode is active, a small **"⚡Lite"** badge appears in the bottom-right corner of the page (opacity 50%).

To disable this indicator, remove this part from the minified script:

```css
body.fp-low::after{content:'⚡Lite';...}
```

---

## 🚀 Usage in Framer

All scripts should be added via **Site Settings** → **Custom Code**.

| Position            | Best For                                    |
| ------------------- | ------------------------------------------- |
| Start of `<head>`   | Critical CSS, fonts, meta tags              |
| End of `<head>`     | Analytics, preconnect hints                 |
| Start of `<body>`   | Loading screens, early DOM scripts          |
| **End of `<body>`** | ✅ Performance scripts, third-party widgets |

---

## ⚠️ Notes

- Always test scripts on staging before publishing to production
- The script runs automatically on page load
- User preferences persist across sessions via localStorage
- Clear localStorage to reset: `localStorage.removeItem('fp-m')`
