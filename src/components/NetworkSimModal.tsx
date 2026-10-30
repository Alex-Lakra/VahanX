import React, { useState } from 'react';
import { useConnectionStore } from '../stores/connectionStore';
import { NetworkSimulatorAdapter } from '../adapters/NetworkSimulatorAdapter';
import { Wifi, Server, CheckCircle2, AlertCircle, X } from 'lucide-react';

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

  const [host, setHost] = useState(networkSimHost);
  const [port, setPort] = useState(String(networkSimPort));
  const [scenario, setScenario] = useState('J1939_NORMAL');
  const [statusMessage, setStatusMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndConnect = async () => {
    setIsTesting(true);
    setStatusMessage('Connecting to LAN WebSocket simulator on port ' + port + '...');

    try {
      const parsedPort = parseInt(port, 10) || 8765;
      setNetworkSimConfig(host, parsedPort);
      setAdapterType('SIM_NETWORK');

      await connect(scenario);
      setStatusMessage('Connected! Streaming live CAN frames from ' + host + ':' + parsedPort);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0f1422] border-2 border-cyan-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl glow-accent text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Wifi className="w-6 h-6" />
            <h3 className="font-mono text-base font-bold uppercase tracking-wider">
              LAN WebSocket Simulator Setup
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4 text-xs font-sans">
          <p className="text-slate-300 leading-relaxed">
            Accepts real-time vehicle telemetry frames broadcast by a second laptop running the{' '}
            <code className="text-cyan-300 font-mono">sim-server</code> on the same Wi-Fi network.
          </p>

          <div>
            <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider mb-1">
              Laptop IP Address (Host)
            </label>
            <div className="flex items-center gap-2 bg-black border border-slate-700 rounded-lg px-3 py-2">
              <Server className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="e.g. 192.168.1.50 or 127.0.0.1"
                className="w-full bg-transparent font-mono text-sm text-cyan-200 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                WebSocket Port
              </label>
              <div className="flex gap-1.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setPort('8080')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    port === '8080' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  8080 (VahanX Sim)
                </button>
                <button
                  type="button"
                  onClick={() => setPort('8765')}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    port === '8765' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  8765 (Legacy)
                </button>
              </div>
            </div>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="8080"
              className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 font-mono text-sm text-cyan-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider mb-1">
              Target Simulation Scenario
            </label>
            <select
              value={scenario}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-white focus:outline-none"
            >
              <option value="J1939_NORMAL">J1939: Heavy-Duty Tractor (Nominal Field Duty)</option>
              <option value="J1939_LIMP">J1939: Critical Fault / Low Air Brake (Auto Limp 20 km/h)</option>
              <option value="J1939_HDV_FULL">J1939: Full Multi-Module (PTO, ISOBUS & 9-Part Hydraulics)</option>
              <option value="OBD2_NORMAL">OBD-II: Passenger Car (Normal Highway Cruise)</option>
              <option value="OBD2_OVERHEAT">OBD-II: Thermal Runaway Coolant Alert (109 °C)</option>
              <option value="OBD2_DTC">OBD-II: Active P0524 Low Oil Pressure Fault</option>
            </select>
          </div>

          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 flex items-center gap-2 text-xs font-mono">
              {statusMessage.includes('Connected') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : statusMessage.includes('failed') ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
              )}
              <span className="text-slate-200">{statusMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndConnect}
            disabled={isTesting}
            className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg glow-accent flex items-center gap-2"
          >
            <Wifi className="w-4 h-4" />
            {isTesting ? 'Connecting...' : 'Connect to LAN Sim'}
          </button>
        </div>
      </div>
    </div>
  );
};

