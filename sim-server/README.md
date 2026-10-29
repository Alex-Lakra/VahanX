# VahanX LAN WebSocket Simulation Server

This simulator server runs on a secondary laptop connected to the same Wi-Fi network as the Android tablet/phone running VahanX.

## Requirements
- Node.js v18+

## Quick Start on Second Laptop

1. Install dependencies:
```bash
npm install
```

2. Start the simulation server:
```bash
npm start
```
The server will bind on `0.0.0.0:8765`.

3. Find the laptop's LAN IP address:
- **Windows**: Run `ipconfig` (look for IPv4 Address on Wi-Fi, e.g. `192.168.1.50`)
- **macOS / Linux**: Run `ifconfig` or `ip addr`

4. On the Android phone / tablet running VahanX:
- Tap the **Wi-Fi icon** in the top navigation bar.
- Enter the laptop's IP address (e.g. `192.168.1.50`) and port (`8765`).
- Select the desired simulation scenario and tap **"Connect to LAN Sim"**.

## Available Scenarios
- `J1939_NORMAL`: Agricultural tractor working in field (1650 RPM, 8.2 bar air brakes, 540 RPM PTO, 185 bar hydraulics).
- `J1939_LIMP`: Pneumatic air brake pressure drops to 4.8 bar and DM1 Red Stop fault triggers automated 20 km/h Limp Mode.
- `J1939_HDV_FULL`: Full tractor streaming including PTO slip, drawbar draft force, ISOBUS implement, and 9-part hydraulics.
- `OBD2_NORMAL`: Passenger car highway cruising (60 km/h, 2100 RPM, 90 °C coolant, 14.1V).
- `OBD2_OVERHEAT`: Coolant climbs to 111 °C, triggering immediate solid red dashboard highlighting and emergency thermal advice popup.
- `OBD2_DTC`: Injects active P0524 Low Engine Oil Pressure fault code.

