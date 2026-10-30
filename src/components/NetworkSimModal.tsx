import React, { useState } from 'react';
import { useConnectionStore } from '../stores/connectionStore';
import { NetworkSimulatorAdapter } from '../adapters/NetworkSimulatorAdapter';
import { Wifi, Server, CheckCircle2, AlertCircle, X, Radio, ArrowRight, Laptop } from 'lucide-react';

interface NetworkSimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkSimModal: React.FC<NetworkSimModalProps> = ({ isOpen, onClose }) => {
  const {
    networkSimHost,
    networkSimPort,
    setNetworkSimConfig,
    adapterInstance,
    adapterType,
    setAdapterType,
    connect,
  } = useConnectionStore();

  const detectedHost = typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.hostname : null;

  const [host, setHost] = useState(networkSimHost || detectedHost || '127.0.0.1');
  const [port, setPort] = useState(String(networkSimPort || 8765));
  const [scenario, setScenario] = useState('J1939_NORMAL');
  const [statusMessage, setStatusMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    setStatusMessage('');

    try {
      const parsedPort = parseInt(port, 10) || 8765;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`http://${host}:${parsedPort}/`, {
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setPingResult({
          ok: true,
          message: `✓ Simulator Relay Online on ${host}:${parsedPort}! (${data.clients ?? 0} clients connected)`,
        });
      } else {
        setPingResult({
          ok: false,
          message: `Host responded with HTTP ${res.status}. Verify wsRelay is running on port ${parsedPort}.`,
        });
      }
    } catch (err: unknown) {
      setPingResult({
        ok: false,
        message: `✕ Cannot reach ${host}:${port}. Verify Laptop 1 IP and ensure port ${port} is allowed in Windows Firewall.`,
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleSaveAndConnect = async () => {
    setIsTesting(true);
    setStatusMessage('Connecting to Wi-Fi WebSocket relay on ' + host + ':' + port + '...');

    try {
      const parsedPort = parseInt(port, 10) || 8765;
      setNetworkSimConfig(host, parsedPort);
      setAdapterType('SIM_NETWORK');

      await connect(scenario);
      setStatusMessage('Connected! Streaming live CAN telemetry from ' + host + ':' + parsedPort);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage('Connection failed: ' + msg);
    } finally {
      setIsTesting(false);
    }
  };

  const handleScenarioChange = (newScenario: string) => {
    setScenario(newScenario);
    if (adapterType === 'SIM_NETWORK' && adapterInstance instanceof NetworkSimulatorAdapter) {
      adapterInstance.setScenario(newScenario);
      setStatusMessage(`Scenario switched to ${newScenario}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <div className="bg-[#0c1018] border-2 border-cyan-500/80 rounded-3xl max-w-lg w-full p-6 shadow-[0_0_35px_rgba(0,212,255,0.3)] text-slate-100">
        <div className="flex items-center justify-between border-b border-[#1b2536] pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Wifi className="w-5 h-5 animate-pulse" />
            <h3 className="font-mono text-base font-bold uppercase tracking-wider">
              Wi-Fi / LAN Simulator Pairing
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4 text-xs font-mono">
          {/* Quick Guide for 2 Laptops */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[11px] font-sans text-cyan-200">
            <div className="font-bold flex items-center gap-1.5 text-cyan-400 font-mono text-xs uppercase mb-1">
              <Laptop className="w-4 h-4" /> 2-Laptop Wi-Fi Pairing Guide:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Connect both laptops to the <strong>same Wi-Fi network</strong>.</li>
              <li>On <strong>Laptop 1 (Simulator)</strong>: Run <code className="bg-black/50 px-1 py-0.5 rounded text-cyan-300 font-mono">ipconfig</code> to get its Wi-Fi IPv4 address.</li>
              <li>Ensure <code className="bg-black/50 px-1 py-0.5 rounded text-cyan-300 font-mono">npm run server</code> is running on Laptop 1 (port 8765).</li>
              <li>On <strong>Laptop 2 (This Dashboard)</strong>: Enter Laptop 1's IP address below and click <strong>Test Ping</strong>.</li>
            </ol>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Simulator Laptop IP Address
              </label>
              <div className="flex gap-1.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setHost('127.0.0.1')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    host === '127.0.0.1' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  127.0.0.1 (Same Laptop)
                </button>
                {detectedHost && (
                  <button
                    type="button"
                    onClick={() => setHost(detectedHost)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      host === detectedHost ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {detectedHost} (Detected)
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#06080d] border border-[#223045] rounded-xl px-3 py-2.5">
              <Server className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                value={host}
                onChange={(e) => {
                  setHost(e.target.value);
                  setPingResult(null);
                }}
                placeholder="e.g. 192.168.1.45 or 10.18.38.60"
                className="w-full bg-transparent font-mono text-sm text-cyan-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isPinging}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
              >
                {isPinging ? 'Pinging...' : 'Test Ping'}
              </button>
            </div>
            {pingResult && (
              <div className={`mt-1.5 text-[11px] font-mono ${pingResult.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                {pingResult.message}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                WebSocket Port
              </label>
              <div className="flex gap-1.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setPort('8765')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    port === '8765' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  8765 (Default wsRelay)
                </button>
                <button
                  type="button"
                  onClick={() => setPort('8080')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    port === '8080' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  8080
                </button>
              </div>
            </div>
            <input
              type="number"
              value={port}
              onChange={(e) => {
                setPort(e.target.value);
                setPingResult(null);
              }}
              placeholder="8765"
              className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-cyan-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
              Simulation Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="w-full bg-[#06080d] border border-[#223045] rounded-xl px-3 py-2.5 font-mono text-xs text-white focus:outline-none"
            >
              <option value="J1939_NORMAL">J1939: Heavy-Duty Tractor (Nominal Field Duty)</option>
              <option value="J1939_LIMP">J1939: Critical Fault / Low Air Brake (Auto Limp 20 km/h)</option>
              <option value="J1939_HDV_FULL">J1939: Full Implement, PTO Slip & Hydraulics</option>
              <option value="OBD2_NORMAL">OBD-II: Passenger Vehicle Highway Cruise (60 km/h)</option>
              <option value="OBD2_OVERHEAT">OBD-II: Coolant Overheat (Thermal Advisory)</option>
              <option value="OBD2_DTC">OBD-II: Low Oil Pressure Trouble Code (P0524)</option>
            </select>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-[#070b12] border border-[#1b2536] text-[11px] font-mono text-slate-300">
              {statusMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#172130]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndConnect}
            disabled={isTesting}
            className="px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_12px_rgba(0,212,255,0.4)] transition-all hover:scale-105"
          >
            {isTesting ? 'Connecting...' : 'Connect to Wi-Fi Sim'}
          </button>
        </div>
      </div>
    </div>
  );
};
