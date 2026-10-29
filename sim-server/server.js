import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8765;
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

const clients = new Set();
let activeScenario = 'J1939_NORMAL';
let tickCount = 0;

console.log(`=======================================================`);
console.log(`  VAHANX LAN WEBSOCKET SIMULATION SERVER`);
console.log(`  Listening on: ws://0.0.0.0:${PORT}`);
console.log(`  Connect from Android app on same Wi-Fi using laptop IP`);
console.log(`  Active Scenario: ${activeScenario}`);
console.log(`=======================================================`);

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[VahanX Sim] New Android client connected from ${ip}`);
  clients.add(ws);

  ws.on('message', (message) => {
    const str = message.toString().trim();
    // Check if JSON control message
    if (str.startsWith('{')) {
      try {
        const cmd = JSON.parse(str);
        if (cmd.type === 'SET_SCENARIO' && cmd.scenario) {
          activeScenario = cmd.scenario;
          tickCount = 0;
          console.log(`[VahanX Sim] Switched active scenario to: ${activeScenario}`);
          ws.send(`ACK_SCENARIO_${activeScenario}\r`);
        }
      } catch (e) {
        console.warn('[VahanX Sim] Failed to parse command JSON', e);
      }
      return;
    }

    // Check for OBD-II commands (e.g. 0100, 010C)
    if (str.includes('0100')) {
      ws.send('41 00 BE 3E B8 11\r');
    } else if (str.includes('010C')) {
      ws.send('41 0C 1A F8\r');
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[VahanX Sim] Client disconnected`);
  });
});

function broadcast(frame) {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(frame + '\r');
    }
  }
}

// Stream simulated vehicle CAN frames at 20 Hz (every 50 ms)
setInterval(() => {
  if (clients.size === 0) return;
  tickCount++;
  const t = tickCount;

  if (activeScenario.startsWith('J1939')) {
    generateJ1939Frames(t);
  } else {
    generateOBD2Frames(t);
  }
}, 50);

function generateOBD2Frames(t) {
  if (t % 40 === 0) {
    broadcast('41 00 BE 3E B8 11');
  }

  const isOverheat = activeScenario === 'OBD2_OVERHEAT';
  const hasDTC = activeScenario === 'OBD2_DTC';

  // Speed
  const speed = Math.round(60 + 10 * Math.sin(t * 0.04));
  broadcast(`41 0D ${speed.toString(16).padStart(2, '0')}`);

  // RPM
  const rpm = Math.round(2100 + 350 * Math.sin(t * 0.06));
  const rawRpm = Math.round(rpm * 4);
  const rpmA = (rawRpm >> 8) & 0xFF;
  const rpmB = rawRpm & 0xFF;
  broadcast(`41 0C ${rpmA.toString(16).padStart(2, '0')} ${rpmB.toString(16).padStart(2, '0')}`);

  // Coolant Temp
  const coolant = isOverheat ? 111 : 90 + Math.round(2 * Math.sin(t * 0.02));
  broadcast(`41 05 ${(coolant + 40).toString(16).padStart(2, '0')}`);

  // Oil Temp
  const oil = isOverheat ? 128 : 96;
  broadcast(`41 5C ${(oil + 40).toString(16).padStart(2, '0')}`);

  // Boost
  const mapKpa = Math.round(140 + 20 * Math.sin(t * 0.05));
  broadcast(`41 0B ${mapKpa.toString(16).padStart(2, '0')}`);

  // Voltage
  const volts = 14100;
  broadcast(`41 42 ${((volts >> 8) & 0xFF).toString(16).padStart(2, '0')} ${(volts & 0xFF).toString(16).padStart(2, '0')}`);

  // SoC
  broadcast(`41 5B ${Math.round((92 * 255) / 100).toString(16).padStart(2, '0')}`);

  if (hasDTC && t % 20 === 0) {
    broadcast('43 01 05 24 00 00'); // P0524 Low oil pressure
  }
}

function generateJ1939Frames(t) {
  const isLimp = activeScenario === 'J1939_LIMP';

  // EEC1 PGN 61444 - RPM
  const rpm = isLimp ? 1150 : Math.round(1650 + 100 * Math.sin(t * 0.05));
  const rawRpm = Math.round(rpm / 0.125);
  broadcast(`0CF00400 F0 7D 82 ${(rawRpm & 0xFF).toString(16).padStart(2, '0')} ${((rawRpm >> 8) & 0xFF).toString(16).padStart(2, '0')} F0 FF FF`);

  // CCVS PGN 65265 - Speed
  const speed = isLimp ? 18.5 : Number((22 + 6 * Math.sin(t * 0.04)).toFixed(1));
  const rawSpeed = Math.round(speed * 256);
  broadcast(`18FEF100 00 ${(rawSpeed & 0xFF).toString(16).padStart(2, '0')} ${((rawSpeed >> 8) & 0xFF).toString(16).padStart(2, '0')} FF FF FF FF FF`);

  // ET1 PGN 65262 - Coolant & Oil Temp
  const coolantRaw = 88 + 40;
  const rawOil = Math.round((94 + 273) / 0.03125);
  broadcast(`18FEEE00 ${coolantRaw.toString(16).padStart(2, '0')} FF ${(rawOil & 0xFF).toString(16).padStart(2, '0')} ${((rawOil >> 8) & 0xFF).toString(16).padStart(2, '0')} FF FF FF FF`);

  // VEP1 PGN 65271 - Voltage 28.2V
  const rawVolts = Math.round(28.2 / 0.05);
  broadcast(`18FEF700 FF FF FF FF ${(rawVolts & 0xFF).toString(16).padStart(2, '0')} ${((rawVolts >> 8) & 0xFF).toString(16).padStart(2, '0')} FF FF`);

  // Air Brakes PGN 65198
  const p1Raw = isLimp ? 60 : 102; // 4.8 bar in limp vs 8.2 bar normal
  broadcast(`18FEAE00 ${p1Raw.toString(16).padStart(2, '0')} 68 FF FF FF FF FF FF`);

  // Hydraulics PGN 65300
  const rawPress = Math.round(185 / 0.1);
  broadcast(`18FF6400 54 66 6E ${(rawPress & 0xFF).toString(16).padStart(2, '0')} ${((rawPress >> 8) & 0xFF).toString(16).padStart(2, '0')} A5 00 00`);

  // PTO PGN 65264
  const rawPto = Math.round(540 / 0.125);
  broadcast(`18FEF000 01 ${(rawPto & 0xFF).toString(16).padStart(2, '0')} ${((rawPto >> 8) & 0xFF).toString(16).padStart(2, '0')} FF FF FF FF FF`);

  // DM1 Red Stop fault in Limp mode
  if (isLimp && t % 20 === 0) {
    broadcast('18FECA00 10 FF 64 00 01 01 FF FF'); // SPN 100 FMI 1 Red Stop Lamp
  }
}

