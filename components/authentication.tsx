import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import * as FramerNS from "framer"

/**
 * Authentication component
 * - Validates via either a single password OR a routes[] mapping.
 * - Honors deep link via ?next=<path> set by AuthGate.
 * - Mints a scoped token for the destination gate (gateId = pathname of destination).
 * - Redirects using SPA navigation if available, else location.replace.
 */

type RouteMap = { password: string; url: string }

type AuthenticationProps = {
  correctPassword?: string
  redirectUrl?: string | null
  routes?: Array<RouteMap>
  width?: number | string
  height?: number | string
  className?: string
  useProjectFonts?: boolean
  fontFamily?: string
  placeholder?: string
  wrongMessage?: string
  popupMs?: number
  // New
  ttlHours?: number
  storage?: "session" | "local"
}

const TOKEN_PREFIX = "framer.auth."
const now = () => Date.now()
const getParam = (name: string) => {
  try {
    const url = new URL(window.location.href)
    return url.searchParams.get(name)
  } catch {
    return null
  }
}

function gateKey(gateId: string) {
  return TOKEN_PREFIX + gateId
}

function setAuth(gateId: string, ttlHours: number, storage: "session" | "local") {
  const store = storage === "session" ? window.sessionStorage : window.localStorage
  const expiresAt = now() + Math.max(1, ttlHours) * 60 * 60 * 1000
  store.setItem(gateKey(gateId), JSON.stringify({ grantedAt: now(), expiresAt }))
}

function isExternalUrl(url: string) {
  return /^(https?:)?\/\//i.test(url)
}

function toPathname(url: string) {
  try {
    // For internal paths return as-is; for full URLs return its pathname
    if (!isExternalUrl(url)) return url.split("?")[0]
    const u = new URL(url)
    return u.pathname || "/"
  } catch {
    return "/"
  }
}

export default function Authentication({
  correctPassword = "password",
  redirectUrl = "/",
  routes = [],
  width = 532,
  height = 515,
  className,
  useProjectFonts = true,
  fontFamily = "Inter, system-ui, sans-serif",
  placeholder = "Enter Password",
  wrongMessage = "Wrong password. Try again.",
  popupMs = 3000,
  ttlHours = 12,
  storage = "session",
}: AuthenticationProps) {
  const navigate = (FramerNS as any).useNavigation?.() as undefined | ((to: string) => void)
  const [value, setValue] = React.useState("")
  const [showPopup, setShowPopup] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const timeoutRef = React.useRef<number | null>(null)

  const navigateTo = React.useCallback(
    (link: string) => {
      const url = (link ?? "").trim()
      if (!url || typeof window === "undefined") return
      const external = isExternalUrl(url)
      if (!external && typeof navigate === "function") {
        navigate(url)
      } else if (external) {
        window.location.assign(url)
      } else {
        window.location.replace(url)
      }
    },
    [navigate]
  )

  const error = React.useCallback(() => {
    setShowPopup(true)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setShowPopup(false), popupMs) as unknown as number
  }, [popupMs])

  const submit = React.useCallback(() => {
    const nextParam = getParam("next") // provided by AuthGate when deep-linking

    // Validation & destination resolution
    let dest: string | null = null

    if (Array.isArray(routes) && routes.length > 0) {
      const match = routes.find((r) => r && r.password === value)
      if (!match) return error()
      dest = (nextParam && nextParam.length > 0) ? nextParam : match.url
    } else {
      if (value !== correctPassword) return error()
      dest = (nextParam && nextParam.length > 0) ? nextParam : (redirectUrl || "/")
    }

    if (!dest) return error()

    // Mint token for the destination gate id (pathname based)
    const gateId = toPathname(dest)
    try {
      setAuth(gateId, ttlHours, storage)
    } catch {
      // Storage might fail (private mode); allow navigation but gate will bounce back.
    }

    navigateTo(dest)
  }, [routes, value, correctPassword, redirectUrl, popupMs, ttlHours, storage, navigateTo, error])

  const onKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLInputElement>>(
    (e) => {
      if (e.key === "Enter") submit()
    },
    [submit]
  )

  // UI
  const btnDefault = "#177AF9"
  const btnHover = "#144FB9"
  const resolvedFontFamily: string = useProjectFonts ? "inherit" : fontFamily

  React.useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
  }, [])

  return (
    <div
      className={className}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        padding: 24,
        boxSizing: "border-box",
        fontFamily: resolvedFontFamily,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 320,
          height: 320,
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 28,
          boxSizing: "border-box",
        }}
      >
        {showPopup && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#fff6f6",
              color: "#8b0000",
              border: "1px solid #ffd4d4",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              zIndex: 30,
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              fontFamily: resolvedFontFamily,
            }}
          >
            {wrongMessage}
          </div>
        )}

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Enter Password"
          style={{
            width: "100%",
            maxWidth: 220,
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.08)",
            outline: "none",
            fontSize: 14,
            color: "#333",
            textAlign: "center",
            marginBottom: 18,
            background: "#f7fbff",
            fontFamily: resolvedFontFamily,
          }}
        />

        <button
          type="button"
          onClick={submit}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            border: "none",
            cursor: "pointer",
            padding: "10px 22px",
            borderRadius: 8,
            color: "#fff",
            background: hover ? btnHover : btnDefault,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 6px 12px rgba(23,122,249,0.12)",
            fontFamily: resolvedFontFamily,
          }}
        >
          Submit
        </button>

        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 8,
            height: 8,
            borderRadius: 8,
            background: "rgba(0,0,0,0.06)",
          }}
        />
      </div>
    </div>
  )
}

addPropertyControls(Authentication, {
  routes: {
    type: ControlType.Array,
    title: "Password Routes",
    description: "Map passwords to specific URLs. First match wins.",
    maxCount: 20,
    control: {
      type: ControlType.Object,
      controls: {
        password: { type: ControlType.String, title: "Password", obscured: true },
        url: { type: ControlType.String, title: "URL", placeholder: "/dashboard or https://..." },
      },
    },
    defaultValue: [],
  },
  correctPassword: {
    type: ControlType.String,
    title: "Password",
    obscured: true,
    defaultValue: "password",
    hidden(props: any) {
      return Array.isArray(props.routes) && props.routes.length > 0
    },
  },
  redirectUrl: {
    type: ControlType.String,
    title: "Redirect URL",
    placeholder: "/home or https://example.com",
    defaultValue: "/",
    hidden(props: any) {
      return Array.isArray(props.routes) && props.routes.length > 0
    },
  },
  placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "Enter Password" },
  wrongMessage: { type: ControlType.String, title: "Error Text", defaultValue: "Wrong password. Try again." },
  popupMs: { type: ControlType.Number, title: "Popup ms", min: 500, max: 20000, step: 100, defaultValue: 3000 },
  useProjectFonts: { type: ControlType.Boolean, title: "Use Project Font", defaultValue: true },
  fontFamily: { type: ControlType.String, title: "Font Family", hidden(props: any) { return !!props.useProjectFonts } },
  ttlHours: { type: ControlType.Number, title: "TTL (hrs)", min: 1, max: 168, step: 1, defaultValue: 12 },
  storage: { type: ControlType.Enum, title: "Storage", options: ["session", "local"], optionTitles: ["Session", "Local"], defaultValue: "session" },
})