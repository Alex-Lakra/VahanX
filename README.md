# VahanX: Dual-Protocol Vehicle Telematics and Diagnostics System

## Overview

VahanX is a dual-protocol automotive and heavy-duty vehicle telematics, diagnostics, and predictive health monitoring platform. Engineered for both Light Motor Vehicles (LMV) operating on standard OBD-II (ISO 15765-4 / SAE J1979) and Heavy-Duty Vehicles (HDV) such as agricultural tractors and commercial machinery operating on SAE J1939 and ISO 11783 (ISOBUS), VahanX delivers real-time telemetry processing, algorithmic health synthesis, automated safety interventions, and offline-first cloud synchronization.

The application operates as a high-performance web application as well as a native Android tablet/mobile application packaged via Capacitor. Hardware data ingestion is decoupled from the user interface using HTML5 Web Workers, ensuring non-blocking 20 Hz telemetry parsing under high CAN bus load.

---

## Technical Stack and Tooling Inventory

The following comprehensive inventory documents every language, library, framework, hardware interface, database, and development tool utilized in the VahanX project.

### 1. Programming Languages and Runtimes

| Tool / Technology | Version | Purpose in Project |
| :--- | :--- | :--- |
| TypeScript | 5.5.4 | Primary development language for application logic, strict type contracts, and protocol schemas |
| JavaScript (ES Modules) | ES2022 | Module format utilized across runtime bundles and simulation services |
| Node.js | 18+ / 20+ | Execution environment for the development server, build toolchain, and LAN CAN simulator |
| Java / Kotlin | JDK 17 | Underlying Android native platform runtime |
| HTML5 / CSS3 | Modern | Foundational layout, Canvas rendering, and Web Worker execution |

### 2. Frontend Framework and User Interface

| Tool / Technology | Package / Version | Purpose in Project |
| :--- | :--- | :--- |
| React | react v18.3.1 | Core UI framework for component architecture and reactive lifecycle management |
| React DOM | react-dom v18.3.1 | Document Object Model rendering engine |
| React Router | react-router-dom v6.26.0 | Client-side routing utilizing HashRouter for seamless mobile WebView execution |
| Lucide React | lucide-react v0.453.0 | Vector iconography for automotive indicators, gauges, and navigation elements |
| Tailwind CSS | tailwindcss v3.4.13 | Utility-first CSS framework customized with dark high-contrast automotive color palette |
| PostCSS | postcss v8.4.47 | CSS transformation and pipeline processing engine |
| Autoprefixer | autoprefixer v10.4.20 | Vendor prefix automation for cross-browser and WebView compatibility |

### 3. Application State and Performance Management

| Tool / Technology | Package / Version | Purpose in Project |
| :--- | :--- | :--- |
| Zustand | zustand v4.5.5 | Lightweight, high-speed centralized state management (Connection, Telemetry, DTC, Health, Tuning) |
| HTML5 Web Workers | Native API | Dedicated off-thread worker (`ecuWorker.ts`) parsing raw CAN frames at 20 Hz without UI latency |
| Ring Buffer | Custom Implementation | Fixed-capacity memory structure (`RingBuffer.ts`) for continuous frame sniffing without GC pauses |

### 4. Native Mobile Runtime and Platform Bridges

| Tool / Technology | Package / Version | Purpose in Project |
| :--- | :--- | :--- |
| Capacitor CLI | @capacitor/cli v6.1.2 | Command-line toolchain managing native platform compilation and asset syncing |
| Capacitor Core | @capacitor/core v6.1.2 | Bridge layer between JavaScript WebView and native Android runtime |
| Capacitor Android | @capacitor/android v6.1.2 | Native Android platform container, Activity orchestration, and Gradle configuration |
| Capacitor App | @capacitor/app v6.0.1 | Native app state listeners (background, foreground, termination) |
| Capacitor Haptics | @capacitor/haptics v6.0.1 | Physical vibration feedback upon critical vehicle warnings and mode triggers |
| Capacitor Geolocation | @capacitor/geolocation v6.0.1 | Location services for nearest repair facility routing |
| Android SDK / Gradle | Gradle 8.2 / AGP 8.2.1 | Android build automation system targeting SDK 34 (Android 14) with minimum SDK 22 (Android 5.1) |

### 5. Storage, Persistence, and Cloud Synchronization

| Tool / Technology | Package / Version | Purpose in Project |
| :--- | :--- | :--- |
| Dexie.js | dexie v4.0.8 | IndexedDB abstraction providing transactional offline-first storage for telemetry and driver logs |
| Supabase Client | @supabase/supabase-js v2.45.4 | Backend-as-a-Service client for cloud upserts of health metrics and driving event telemetry |
| PostgreSQL | Supabase Backend | Relational cloud database schema hosting historical telemetry and fleet analytics |

### 6. Hardware Connectivity and Simulation Infrastructure

| Tool / Technology | Package / Version | Purpose in Project |
| :--- | :--- | :--- |
| WebSocket Server | ws v8.18.0 | Node.js WebSocket engine powering `sim-server` for LAN broadcasting of simulated CAN traffic |
| Bluetooth SPP Adapter | Native / Serial Port | Serial Port Profile bridge for classic Bluetooth ELM327 and OBDLink interfaces |
| Bluetooth LE Adapter | Native Web Bluetooth | Low-energy GATT profile communication adapter |
| Wi-Fi TCP/UDP Adapter | Network Socket | Raw socket adapter communicating with wireless OBD-II adapters over local IP |
| USB OTG Adapter | USB Serial CDC | Direct Android USB host serial communication for FTDI, CP210x, and CH340 chips |
| Hardware Simulator | In-Memory Engine | Software-driven cyclic frame generator for standalone testing without physical vehicle bus |

### 7. Build Tools, Compilers, and Quality Assurance

| Tool / Technology | Package / Version | Purpose in Project |
| :--- | :--- | :--- |
| Vite | vite v5.4.8 | Next-generation ESM bundler and ultra-fast Hot Module Replacement development server |
| Vite React Plugin | @vitejs/plugin-react v4.3.2 | Fast Refresh and JSX/TSX compilation via Babel/BOM |
| TypeScript Compiler | tsc v5.5.4 | Type validation, static analysis, and interface enforcement |
| Type Definitions | @types/node, @types/react, @types/react-dom | Strict typings across development dependencies |

---

## Automotive Protocols and Standards Implementation

### SAE J1939 (Heavy-Duty & Agricultural Machinery)
- **CAN Architecture**: 29-bit extended CAN identifier decoding.
- **Protocol Data Units (PDU)**: Automated parsing of PDU1 (point-to-point) and PDU2 (broadcast) formats.
- **Parameter Group Numbers (PGNs) Handled**:
  - `PGN 61444 (0x0CF004)`: EEC1 - Electronic Engine Controller 1 (Engine RPM via SPN 190).
  - `PGN 65265 (0x18FEF1)`: CCVS - Cruise Control / Vehicle Speed (Wheel-based speed via SPN 84).
  - `PGN 65262 (0x18FEEE)`: ET1 - Engine Temperature 1 (Coolant Temp via SPN 110, Oil Temp via SPN 175).
  - `PGN 65270 (0x18FEF6)`: IC1 - Inlet / Exhaust Conditions (Turbocharger Boost Pressure via SPN 102).
  - `PGN 65271 (0x18FEF7)`: VEP1 - Vehicle Electrical Power 1 (Battery Potential via SPN 168).
  - `PGN 65248 (0x18FEE0)`: VD - Vehicle Distance (Total Vehicle Distance via SPN 245).
  - `PGN 65253 (0x18FEE5)`: Engine Hours (Total Operating Hours).
  - `PGN 65198 (0x18FEAE)`: Air Brake System (Circuit 1 & Circuit 2 pressures via SPN 1087 & SPN 1088).
  - `PGN 65258 (0x18FEEA)`: Axle Loadings (Front and rear axle weight measurement).
  - `PGN 61462 (0x0CFE66)`: Air Suspension Height.
  - `PGN 61442 (0x0CF002)`: ETC1 - Automated Mechanical Transmission (AMT Clutch Slip Percentage).
  - `PGN 61440 (0x0CF000)`: ERC1 - Electronic Retarder Controller (Retarder stage and torque percentage).
  - `PGN 65264 (0x18FEF0)`: Power Take-Off (PTO engagement status, output shaft RPM).
  - `PGN 65226 (0x18FECA)`: DM1 - Active Diagnostic Trouble Codes (Red Stop, Amber Warning, Protect lamps, SPN, FMI, and Occurrence count).
  - `PGN 65300 (0x18FE14)`: Agricultural Hydraulics and auxiliary implement sensors.
  - `PGN 0 (0x0C0000)`: TSC1 - Torque / Speed Control 1 (Limp Mode broadcast message enforcing 20 km/h speed and 1200 RPM limit).

### ISO 11783 (ISOBUS)
- In-cab implement communication telematics.
- Implement identification, working width, draft resistance force (kN), tongue weight (kg), and real-time application rates (kg/ha, L/ha).

### ISO 15765-4 / SAE J1979 (Passenger Cars / LMV)
- Standard OBD-II Mode 01 PID decoding:
  - `PID 0x0C`: Engine RPM.
  - `PID 0x0D`: Vehicle Speed (km/h).
  - `PID 0x05`: Engine Coolant Temperature.
  - `PID 0x5C`: Engine Oil Temperature.
  - `PID 0x0B`: Manifold Absolute Pressure (MAP).
  - `PID 0x70`: Boost Pressure.
  - `PID 0x42`: Control Module Voltage.
  - `PID 0x5B`: Battery State of Charge (SoC).
  - `PID 0x31` / `PID 0xA6`: Odometer and distance since DTC reset.
- Mode 03 / Mode 07 Trouble Code parsing (P0xxx, P1xxx, P2xxx, P3xxx, C0xxx, B0xxx, U0xxx).

---

## Core System Modules

```
+-------------------------------------------------------------------------------+
|                                VahanX Runtime                                 |
+-------------------------------------------------------------------------------+
|  UI Layer (React 18 + Tailwind CSS + Lucide Icons + React Router)             |
|  - TelemetryDashboard  - FaultExplorer      - TuningPage                      |
|  - HealthScoreboard    - HDVTelemetryPage   - PTODrawbarPage                  |
|  - HydraulicsPage      - DriverProfilePage                                    |
+---------------------------------------+---------------------------------------+
|  Zustand State Stores                 |  Services & Controllers               |
|  - connectionStore     - dtcStore     |  - HealthScoreEngine (Weighted 0-100) |
|  - healthStore         - tuningStore  |  - HydraulicsHealthEngine (9-Part)    |
|  - telemetryStore                     |  - LimpModeController (TSC1 Safe DER)|
|                                       |  - CloudSyncEngine (Offline Queue)    |
+---------------------------------------+---------------------------------------+
|  HTML5 Web Worker (ecuWorker.ts)                                              |
|  - 3-Second Dual-Protocol Bus Auto-Handshake                                  |
|  - J1939 PGN Parser (29-bit CAN)      - OBD-II PID Parser (ISO 15765-4)       |
+---------------------------------------+---------------------------------------+
|  Hardware Communication Adapters (IHardwareAdapter)                           |
|  - Bluetooth SPP       - BLE          - Wi-Fi Socket  - USB OTG               |
|  - Local Simulator     - Network LAN WebSocket (sim-server)                   |
+---------------------------------------+---------------------------------------+
|  Data Storage Layer                                                           |
|  - Dexie.js (IndexedDB local cache)   - Supabase / PostgreSQL (Cloud sync)   |
+-------------------------------------------------------------------------------+
```

### 1. ECU Worker Multithreading Architecture (`ecuWorker.ts`)
Decouples serial CAN frame ingestion from the React render thread. Performs automatic protocol negotiation during a 3-second handshake sequence:
- If 29-bit broadcast J1939 frames are detected, switches automatically to Heavy-Duty Vehicle (HDV) mode.
- If standard 11-bit OBD-II responses are received, switches to Light Motor Vehicle (LMV) mode.
- Continuously parses raw hexadecimal CAN strings into typed telemetry state structures.

### 2. Algorithmic Health Score Engine (`HealthScoreEngine.ts`)
Synthesizes all active vehicle telemetry into a single 0 to 100 health index based on five weighted operational categories:
- **Active DTCs & Lubrication Pressure (35%)**: Penalizes critical diagnostic codes and oil temperature extremes (>125 deg C).
- **Thermal & Coolant Stability (25%)**: Penalizes coolant boiling (>103 deg C HDV, >105 deg C LMV) and turbo overboost spikes.
- **Drivetrain, Brakes & Hydraulics (20%)**: Integrates hydraulic subsystem health and pneumatic brake pressures (<5.5 bar).
- **Electrical & Battery SoC (10%)**: Monitors battery voltage anomalies and low State of Charge (<25%).
- **Emissions & Service Schedule (10%)**: Monitors DPF soot saturation, AdBlue / DEF levels, and maintenance mileage.

Health classification bands:
- `80 - 100 (GREEN)`: Nominal operating condition.
- `40 - 79 (AMBER)`: Advisory warnings; service required.
- `0 - 39 (RED)`: Critical mechanical hazard; automated Limp Mode activation.

### 3. Comprehensive Hydraulics Health Engine (`HydraulicsHealthEngine.ts`)
Evaluates agricultural tractor hydraulic integrity across nine specialized components:
1. Hydraulic Pump (Flow rate, discharge pressure, volumetric efficiency) - 30%
2. Oil Reservoir (Fluid level, temperature, aeration index) - 25%
3. Hydraulic Filter (Differential pressure delta P, bypass valve state) - 15%
4. Selective Control Valves / SCVs (Solenoid current, spool position) - 12%
5. Pressure Relief Valve (Cracking pressure, blow-by detection) - 8%
6. Hydraulic Lines & Hoses (Dynamic leak risk analysis) - 3%
7. Hydraulic Cylinders & Pistons (Drift rate per minute) - 3%
8. Piston Rod & Linkage (Strain gauge microstrain) - 2%
9. Three-Point Hitch (Rockshaft positioning and payload weight) - 2%

### 4. Limp Mode Controller (`LimpModeController.ts`)
When critical engine conditions occur (low oil pressure, thermal boiling, air brake failure, or master health score <= 39), the system engages a protective vehicle derate:
- Limits vehicle speed to 20 km/h.
- Limits engine speed to 1200 RPM.
- Broadcasts SAE J1939 Torque/Speed Control 1 (`TSC1`, PGN 0) CAN frames over the bus.
- Provides a protected 5-second press-and-hold driver override with legal liability logging in local database storage.

### 5. Offline-First Cloud Sync Engine (`CloudSyncEngine.ts`)
Designed for rural agricultural environments where internet connectivity is intermittent:
- Telemetry snapshots and driver behavior logs are stored locally in Dexie.js (IndexedDB).
- Network listeners detect when cellular or Wi-Fi data becomes available.
- Batches of records (100 per transaction) are uploaded to Supabase cloud tables with automatic retry strategies.

---

## Repository Structure

```
VahanX/
├── android/                        Native Android Studio project directory
│   ├── app/
│   │   ├── build.gradle            Android application build settings (SDK 34)
│   │   └── src/main/AndroidManifest.xml
│   ├── build.gradle                Root Gradle project definition
│   └── variables.gradle            Dependency version specifications
├── sim-server/                     Standalone Node.js LAN CAN Bus simulator
│   ├── package.json                Simulator dependencies (ws)
│   ├── README.md                   LAN simulator setup instructions
│   └── server.js                   CAN frame generator broadcasting over port 8765
├── src/
│   ├── adapters/                   Hardware connectivity layer
│   │   ├── AdapterFactory.ts       Factory pattern instantiation for adapters
│   │   ├── BLEAdapter.ts           Bluetooth Low Energy adapter
│   │   ├── BluetoothSPPAdapter.ts  Bluetooth Serial Port Profile adapter
│   │   ├── IHardwareAdapter.ts     Unified hardware interface definition
│   │   ├── NetworkSimulatorAdapter.ts  LAN WebSocket client adapter
│   │   ├── SimulatorAdapter.ts     Local mock frame generator
│   │   ├── USBOTGAdapter.ts        USB serial OTG adapter
│   │   └── WiFiAdapter.ts          Wi-Fi TCP/UDP socket adapter
│   ├── components/                 Reusable UI components
│   │   ├── DashboardWarningPopup.tsx   Thermal and critical alert popup
│   │   ├── LimpModeOverlay.tsx     20 km/h Limp Mode warning banner and override
│   │   ├── Navbar.tsx              Header navigation and vehicle type selector
│   │   ├── NetworkSimModal.tsx     LAN simulation connection configuration
│   │   ├── RequireHeavyDuty.tsx    Route guard restricting HDV pages
│   │   ├── TelemetryCard.tsx       Modular telemetry readout gauge
│   │   └── WarrantyWaiverModal.tsx ECU tuning liability agreement modal
│   ├── config/
│   │   └── VehicleThresholds.ts    Safe, warning, and critical vehicle limits
│   ├── data/
│   │   └── dtcDictionary.ts        Automotive fault code database (OBD-II & J1939)
│   ├── db/
│   │   └── localDatabase.ts        Dexie.js IndexedDB schema definitions
│   ├── pages/                      Application view routes
│   │   ├── DriverProfilePage.tsx   Driver score, offline log queue, and cloud sync
│   │   ├── FaultExplorer.tsx       DTC reader, troubleshooting guide, repair routing
│   │   ├── HDVTelemetryPage.tsx    Pneumatic air brakes, AMT slip, axle loads
│   │   ├── HealthScoreboard.tsx    5-bucket weighted health score (0-100)
│   │   ├── HydraulicsPage.tsx      Dedicated 3-module sub-dashboard & 9-part scorecard
│   │   ├── PTODrawbarPage.tsx      PTO shaft telematics, draft force & ISOBUS implement
│   │   ├── TelemetryDashboard.tsx  Core real-time instrument cluster
│   │   └── TuningPage.tsx          ECU boost, rev governor, and throttle sensitivity
│   ├── services/                   Algorithmic and synchronization services
│   │   ├── CloudSyncEngine.ts      Offline queue manager and Supabase bridge
│   │   ├── HealthScoreEngine.ts    Composite health score calculator
│   │   ├── HydraulicsHealthEngine.ts 9-part hydraulic integrity calculator
│   │   └── LimpModeController.ts   Safety throttle governor and TSC1 CAN generator
│   ├── stores/                     Zustand reactive state stores
│   │   ├── connectionStore.ts      Connection parameters and frame sniffer
│   │   ├── dtcStore.ts             Fault code registry
│   │   ├── healthStore.ts          Vehicle health metrics state
│   │   ├── telemetryStore.ts       Core, HDV, and hydraulic telemetry state
│   │   └── tuningStore.ts          ECU calibration adjustments
│   ├── types/                      TypeScript domain interfaces
│   │   ├── protocols.ts            Adapter contracts and Worker message types
│   │   └── telemetry.ts            Telemetry value definitions and fault models
│   ├── utils/                      Utility helpers
│   │   ├── mapsNavigation.ts       Google Maps Intent and web fallback navigator
│   │   └── ringBuffer.ts           Fixed-capacity ring buffer data structure
│   ├── workers/                    Multithreaded execution layer
│   │   ├── ecuWorker.ts            Dedicated parsing web worker
│   │   └── parsers/
│   │       ├── j1939PGNParser.ts   SAE J1939 PGN extractor and decoder
│   │       └── obdPIDParser.ts     ISO 15765-4 OBD-II PID decoder
│   ├── App.tsx                     Application routing and worker coordination
│   ├── index.css                   Tailwind CSS directives and custom animations
│   └── main.tsx                    Application entry point
├── capacitor.config.ts             Capacitor mobile runtime configuration
├── index.html                      Single-page application HTML container
├── package.json                    Root package dependencies and script definitions
├── postcss.config.js               PostCSS configuration
├── tailwind.config.js              Tailwind CSS design system configuration
├── tsconfig.json                   TypeScript compiler configuration
├── tsconfig.node.json              TypeScript Node environment configuration
└── vite.config.ts                  Vite build configuration
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Android Studio (for compiling the native Android application)
- Android SDK Platform 34 and Build-Tools 34.0.0

### Installation

1. Clone the repository and navigate into the project root:
   ```bash
   git clone <repository-url>
   cd VahanX
   ```

2. Install root dependencies:
   ```bash
   npm install
   ```

3. Install simulation server dependencies:
   ```bash
   cd sim-server
   npm install
   cd ..
   ```

---

## Running the Application

### 1. Local Development Web Server
Start the Vite development server with hot module replacement:
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 2. Standalone LAN CAN Simulation Server
To broadcast simulated CAN bus traffic from a secondary computer to a test phone or tablet on the same Wi-Fi network:
```bash
cd sim-server
npm start
```
The simulation server binds to `0.0.0.0:8765`. On the VahanX frontend, click the Wi-Fi icon in the navigation bar, input the host machine IP address, and connect.

Supported simulation scenarios:
- `J1939_NORMAL`: Agricultural tractor operating in field under standard parameters (1650 RPM, 8.2 bar air brakes, 540 RPM PTO, 185 bar hydraulics).
- `J1939_LIMP`: Pneumatic brake pressure loss triggering an automated 20 km/h Limp Mode.
- `J1939_HDV_FULL`: Full implement streaming including drawbar draft force, PTO slip, and 9-part hydraulic diagnostics.
- `OBD2_NORMAL`: Passenger car highway cruising (60 km/h, 2100 RPM, 90 deg C coolant).
- `OBD2_OVERHEAT`: Coolant boiling scenario triggering thermal warning alerts.
- `OBD2_DTC`: Active P0524 Low Engine Oil Pressure fault injection.

---

## Building for Production

### Web Bundle
Compile the optimized production bundle:
```bash
npm run build
```
Build artifacts are placed in the `dist/` directory.

### Native Android Build (Capacitor)
1. Build the web assets and synchronize them with the Android project:
   ```bash
   npm run build
   npx cap sync android
   ```

2. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```

3. Connect an Android device with USB debugging enabled or launch an Android Virtual Device (AVD), then execute **Run > Run 'app'** from Android Studio or build an APK via:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The compiled APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Cloud Sync Configuration

To link VahanX with a Supabase PostgreSQL instance:
1. Provide the following environment variables or configure them directly via `CloudSyncEngine.initialize(supabaseUrl, supabaseKey)`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Ensure the remote database includes the following tables:
   - `vehicle_health_telemetry_logs`: Receives serialized `VehicleHealthLog` records.
   - `driver_behaviour_telemetry_logs`: Receives driving events, speeding violations, and limp mode override audits.

---

## Legal and Safety Disclaimer

VahanX interfaces with physical vehicle control systems and electronic control units (ECUs). The 20 km/h Limp Mode governor and tuning calibration adjustments produce real-time CAN commands (SAE J1939 TSC1). All tuning adjustments and mechanical overrides are logged for liability verification. Never execute parameter calibration or override safety derate modes on public roads or while equipment is operating in hazardous agricultural environments.
