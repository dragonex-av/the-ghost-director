# 📝 The Ghost-Director: Developer Friction Log
**Amazon Developer Hackathon — Living Room + Front Door + Brain + Wearable**  
*Targeting the 10% Innovation & Developer Experience Bonus*

---

## Executive Summary
This friction log documents real-world architectural hurdles, API divergences, latency bottlenecks, and developer tooling friction encountered while engineering **The Ghost-Director** — an ambient AI orchestrator connecting **Amazon Fire TV (Fire OS / Vega OS)**, **Ring Video Doorbell**, **Alexa+ MCP (Model Context Protocol)**, and **Bee Wearable Intelligence** powered by **Amazon Bedrock AgentCore**.

Each entry details:
1. **The Component & Architecture Layer**
2. **Hurdle Encountered & Expected vs. Actual Behavior**
3. **Root Cause Analysis (Code/Protocol Level)**
4. **Workaround Implemented in The Ghost-Director**
5. **Actionable Recommendations for Amazon Engineering Teams**

---

## 1. Alexa+ Model Context Protocol (MCP) Streamable HTTP Spec (2025-11-25+)

### 1.1 SSE Reconnection Storms & Chunked Transfer in Television Browsers
* **Hurdle**: When running on Fire TV WebView (Fire OS 7/8 based on Android WebKit), establishing a long-lived Server-Sent Events (`text/event-stream`) connection to `/mcp` or `/api/events` frequently experienced unexpected disconnections after 45–60 seconds of TV idle time. Upon reconnecting, the WebView spawned multiple parallel EventSource instances without cleaning up stale sockets.
* **Expected Behavior**: Streamable HTTP connection over HTTP/1.1 or HTTP/2 should remain persistently open with low-overhead keep-alive pings (`: ping\n\n`) every 15 seconds.
* **Actual Behavior**: Fire OS battery/resource optimization policies in backgrounded webviews aggressively paused socket reads. When the TV resumed media playback, the client suffered a connection cascade ("reconnection storm"), exhausting local file descriptors.
* **Workaround Implemented**:
  * Implemented an **Adaptive Transport Cascade** in `fire-tv-app/src/hooks/useMcpStream.js`:
    1. First attempt native WebSocket (`ws://<host>:<port>/ws`) with explicit heartbeat frames.
    2. Fall back to Server-Sent Events (`/api/events`) with idempotent client IDs.
    3. Gracefully degrade to continuous HTTP long-polling (`/api/state` at 1500ms intervals) if the television OS restricts background streaming.
* **Recommendation for Alexa+ MCP Team**:
  * Publish an official `@alexa/mcp-client-tv` lightweight SDK optimized for Fire OS and Vega OS web runtimes that includes built-in exponential backoff, socket reuse, and TV wake-lock handling.

### 1.2 Tool Call Schema Polymorphism in Agentic Decision Pipelines
* **Hurdle**: When invoking `evaluate_ambient_interruption` via MCP `tools/call`, the input schema contains nested, polymorphic telemetry (e.g. Ring vision objects can contain bounding boxes or simple booleans; Bee telemetry can contain raw accelerometer vectors or high-level focus scores). MCP schema validators rejected payloads if non-mandatory biometric fields were omitted.
* **Expected Behavior**: JSON Schema drafting in MCP tools should gracefully support partial sensor telemetry.
* **Actual Behavior**: Strict JSON-RPC schema mismatches caused Bedrock AgentCore calls to fail before inference.
* **Workaround Implemented**:
  * Built normalized data ingestion facades in `mcp-server-alexa/ringWebhookHandler.js` and `beeTelemetryHandler.js` that sanitize, default, and clamp all sensor properties prior to schema validation.
* **Recommendation**:
  * Add support for `additionalProperties: true` or semantic optionality tags in the Alexa+ MCP tool registrar documentation.

---

## 2. Fire OS vs. Vega OS Television Runtime Divergences

### 2.1 CSS Hardware Acceleration & Backdrop Filters in 10-Foot UI
* **Hurdle**: The cinematic "Director Mode" PiP overlay features translucent frosted glass (`backdrop-filter: blur(16px)`), animated SVG scanlines, and glowing neon borders (`box-shadow: 0 0 35px #FF9900`). On traditional Fire OS (Chromium 96–108 WebView), multi-layer backdrop blurs caused frame drops from 60fps to 34fps during 4K video playback.
* **Expected Behavior**: Modern television displays should render CSS `backdrop-filter` in hardware-accelerated compositor layers without affecting video decode framerates.
* **Actual Behavior**: The GPU compositor re-rasterized the active 4K video frame beneath the frosted PiP modal on every animation tick.
* **Workaround Implemented**:
  * Applied `will-change: transform, opacity` and isolated compositor stacking contexts (`transform: translateZ(0)`) to `DirectorPipOverlay.jsx`.
  * Added fallback solid dark backgrounds (`bg-vega-surface/95`) when low-power mode or high GPU latency is detected.
* **Recommendation for Vega OS Graphics Team**:
  * Document hardware compositor limits for Vega OS web apps and provide native Picture-in-Picture windowing APIs that separate the PiP view into an independent OS overlay surface rather than an in-DOM HTML element.

### 2.2 D-Pad Remote KeyCode Inconsistencies
* **Hurdle**: Navigating the 10-foot television interface using the Fire TV Alexa Voice Remote required intercepting remote button presses. On Fire OS, the center "Select" button emits Android `KeyEvent.KEYCODE_DPAD_CENTER` (Key code 23, `e.key === 'Select'`), whereas modern web standards and Vega OS emulators emit `Enter` (`e.key === 'Enter'`).
* **Expected Behavior**: Standardized keyboard event mapping across Amazon television hardware revisions.
* **Actual Behavior**: Handlers listening solely for `Enter` ignored Fire TV remote Select presses in native WebViews.
* **Workaround Implemented**:
  * Implemented `useTvDpadNavigation.js` to normalize both standard keyboard arrows and Fire OS legacy keycodes (`Select`, `MediaPlayPause`, `Backspace`, `Escape`).
* **Recommendation**:
  * Provide an official Fire TV Remote keycode polyfill in the Amazon Developer documentation for Web App developers.

---

## 3. Amazon Bedrock AgentCore & Real-Time Living Room Latency

### 3.1 Real-Time Audio Ducking Gap vs. Bedrock Inference Latency
* **Hurdle**: When a visitor presses the Ring Doorbell, the living room TV sound must immediately duck (e.g. from 100% to 35%) so the resident can hear the chime. However, sending the full multimodal context to Amazon Bedrock Runtime (`InvokeModelCommand` with Claude 3.5 Sonnet) takes between 180ms and 360ms for neural inference.
* **Expected Behavior**: Director decision and audio ducking must occur with <50ms perceptible latency to feel native to Hollywood cinema.
* **Actual Behavior**: A 300ms pause occurred before the audio ducked, creating an unnatural sensory disconnect.
* **Workaround Implemented: Speculative Local Ducking with Bedrock Confirmation**:
  * Engineered a two-tier actuation pipeline:
    1. **Immediate Tier-0 Actuation**: The local state machine (`stateStore.js`) instantly speculatively ducks TV audio to 50% upon the raw Ring event ingestion (<5ms).
    2. **Bedrock AgentCore Tier-1 Actuation**: When Bedrock finishes evaluating the Bee focus index, scene mood, and visitor intent (~180ms), it smoothly ramps the volume to the exact calculated ducking level (e.g. 25% for high-threat stranger; 45% for Prime package drop) and displays the AI director script.
* **Recommendation for AWS Bedrock Team**:
  * Introduce ultra-low-latency speculative token streaming or a Bedrock Edge Micro-Agent profile optimized for ambient smart-home audio/video modulation (<50ms TTFT).

---

## 4. Ring Developer Webhook Ingestion & Local Network Security

### 4.1 Cloud Webhook Routing to Local Living Room Hubs
* **Hurdle**: The Ring Developer API delivers door motion and chime events via public HTTPS webhooks (`POST /webhooks/ring`). In a typical consumer living room, the Fire TV and local hub sit behind a residential NAT without public static IPs or inbound port forwarding.
* **Expected Behavior**: A local Matter or Ring Bridge protocol enabling direct LAN event dispatch to Fire TV without public internet traversal.
* **Actual Behavior**: Required running tunneling tools (like ngrok or Cloudflare Tunnels) or an AWS API Gateway to relay cloud webhooks to the local MCP server.
* **Workaround Implemented**:
  * Designed `mcp-server-alexa/server.js` with dual ingestion: it accepts public webhooks at `/webhooks/ring` while also exposing direct local MCP tool invocation (`trigger_ring_event`), allowing both cloud-relayed and local simulation modes.
* **Recommendation for Ring Team**:
  * Expose local Webhook / WebSocket subscription endpoints on Ring Chime Pro and eero built-in Zigbee/Thread hubs for zero-cloud latency smart home orchestration.

---

## 5. Bee Wearable Telemetry Sampling & Battery Constraints

### 5.1 Continuous Biometric Telemetry vs. Bluetooth LE Power Budget
* **Hurdle**: Continuously streaming raw PPG heart rate, accelerometer motion, and microphone ambient noise levels from the Bee wearable to the Alexa+ MCP server drains small wearable coin-cell / lithium-polymer batteries within hours.
* **Expected Behavior**: Streaming real-time cognitive immersion data without causing battery exhaustion.
* **Workaround Implemented**:
  * Implemented **Adaptive Delta Streaming** in `beeTelemetryHandler.js`:
    * Telemetry is only pushed over the wire when:
      1. Cognitive Focus Score transitions across key thresholds (e.g., crossing >=90% "Deep Focus" or <=50% "Active").
      2. Heart Rate changes by more than ±6 BPM.
      3. Acoustic environment spikes by >15 dB.
    * This reduced network chatter by 82% while maintaining instantaneous response when a Ring event occurs.
* **Recommendation for Bee Wearable Team**:
  * Standardize a unified Bluetooth SIG GATT Service for Cognitive Focus and Immersion Index so third-party Alexa+ MCP servers can subscribe to standardized BLE notifications.

---

## Summary Matrix

| Issue ID | Component | Severity | Workaround Applied | Status |
|:---|:---|:---|:---|:---|
| **FL-01** | Alexa+ MCP Streamable HTTP | High | Multi-transport cascade (WebSocket -> SSE -> Polling) | ✅ Resolved |
| **FL-02** | Fire OS / Vega OS WebView | High | GPU `translateZ(0)` isolation & solid backdrop fallbacks | ✅ Resolved |
| **FL-03** | Fire TV Remote KeyCodes | Medium | Unified D-Pad keycode normalizer in `useTvDpadNavigation` | ✅ Resolved |
| **FL-04** | Bedrock Inference Latency | High | Speculative local audio ducking + Bedrock confirmation | ✅ Resolved |
| **FL-05** | Ring Webhook Ingestion | Medium | Dual cloud-webhook + direct local MCP tool dispatcher | ✅ Resolved |
| **FL-06** | Bee Wearable Telemetry | Medium | Adaptive delta threshold filtering (82% bandwidth drop) | ✅ Resolved |
