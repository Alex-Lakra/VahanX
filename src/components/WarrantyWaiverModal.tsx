import React, { useState } from 'react';
import { useTuningStore } from '../stores/tuningStore';
import { AlertOctagon, CheckSquare, Square, Lock } from 'lucide-react';

interface WarrantyWaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WarrantyWaiverModal: React.FC<WarrantyWaiverModalProps> = ({ isOpen, onClose }) => {
  const unlockWithWaiver = useTuningStore((s) => s.unlockWithWaiver);

  const [box1Checked, setBox1Checked] = useState(false);
  const [box2Checked, setBox2Checked] = useState(false);
  const [typedString, setTypedString] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const REQUIRED_PHRASE = 'I ACCEPT FULL RISK';
  const isPhraseMatched = typedString.trim() === REQUIRED_PHRASE;
  const canUnlock = box1Checked && box2Checked && isPhraseMatched;

  const handleConfirm = async () => {
    if (!canUnlock) {
      setErrorMsg('You must check both liability waivers and type the exact required phrase.');
      return;
    }
    await unlockWithWaiver();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0e121a] border-2 border-red-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl glow-danger text-slate-100">
        <div className="flex items-center gap-3 border-b border-red-900/60 pb-4">
          <AlertOctagon className="w-8 h-8 text-red-500 animate-pulse shrink-0" />
          <div>
            <h3 className="font-mono text-lg font-black text-red-400 tracking-wider uppercase">
              ECU Calibration & Warranty Waiver
            </h3>
            <p className="text-xs text-slate-400">Power-User Mechanical Interlock</p>
          </div>
        </div>

        <div className="my-4 text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
          <p className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 font-mono text-red-200">
            WARNING: Modifying factory ECU calibrations directly affects engine thermal load, emissions compliance,
            and component lifespan. Altering boost pressure or RPM limits may immediately VOID the manufacturer
            warranty and can result in catastrophic engine, transmission, or turbocharger failure.
          </p>

          {/* Checkbox 1 */}
          <div
            onClick={() => setBox1Checked(!box1Checked)}
            className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer transition-colors"
          >
            {box1Checked ? (
              <CheckSquare className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            )}
            <span className="text-xs text-slate-300">
              I understand that modifying boost, torque droop, or governor limits will void all factory powertrain warranties.
            </span>
          </div>

          {/* Checkbox 2 */}
          <div
            onClick={() => setBox2Checked(!box2Checked)}
            className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer transition-colors"
          >
            {box2Checked ? (
              <CheckSquare className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            )}
            <span className="text-xs text-slate-300">
              I accept full operational, legal, and financial liability for any mechanical damage or engine seizure.
            </span>
          </div>

          {/* Phrase Confirmation Input */}
          <div className="pt-2">
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Type <strong className="text-red-400 font-bold">{REQUIRED_PHRASE}</strong> to confirm:
            </label>
            <input
              type="text"
              value={typedString}
              onChange={(e) => {
                setTypedString(e.target.value);
                setErrorMsg('');
              }}
              placeholder={REQUIRED_PHRASE}
              className="w-full bg-black border border-slate-700 focus:border-red-500 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {errorMsg && <p className="text-xs text-red-400 font-mono">{errorMsg}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel & Keep Locked
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canUnlock}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all ${
              canUnlock
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg glow-danger'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Lock className="w-4 h-4" />
            Unlock Calibration
          </button>
        </div>
      </div>
    </div>
  );
};

