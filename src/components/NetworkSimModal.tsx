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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <div className="bg-[#0c1018] border-2 border-cyan-500/80 rounded-3xl max-w-md w-full p-6 shadow-[0_0_35px_rgba(0,212,255,0.3)] text-slate-100">
        <div className="flex items-center justify-between border-b border-[#1b2536] pb-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Wifi className="w-5 h-5" />
            <h3 className="font-mono text-base font-bold uppercase tracking-wider">
              LAN WebSocket Simulator Setup
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4 text-xs font-mono">
          <p className="text-slate-300 leading-relaxed font-sans">
            Accepts real-time vehicle telemetry frames broadcast by a second computer running{' '}
            <code className="text-cyan-300 font-mono">sim-server</code> on the local network.
          </p>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">
              Host IP Address
            </label>
            <div className="flex items-center gap-2 bg-[#06080d] border border-[#223045] rounded-xl px-3 py-2.5">
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
            <label className="block font-mono text-[11px] text-slate-400 uppercase tracking-wider mb-1">
              WebSocket Port
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
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
            {isTesting ? 'Connecting...' : 'Connect to LAN Sim'}
          </button>
        </div>
      </div>
    </div>
  );
};
