import React from 'react';
import { useTuningStore } from '../stores/tuningStore';
import { AlertOctagon, X, Unlock } from 'lucide-react';

interface WarrantyWaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WarrantyWaiverModal: React.FC<WarrantyWaiverModalProps> = ({ isOpen, onClose }) => {
  const unlockWithWaiver = useTuningStore((s) => s.unlockWithWaiver);

  if (!isOpen) return null;

  const handleUnlock = async () => {
    await unlockWithWaiver();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <div className="bg-[#0c1018] border-2 border-red-600/90 rounded-3xl max-w-md w-full p-6 shadow-[0_0_35px_rgba(239,68,68,0.4)] text-slate-100">
        <div className="flex items-center justify-between border-b border-red-900/60 pb-4">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-7 h-7 text-red-500 animate-pulse shrink-0" />
            <div>
              <h3 className="font-mono text-base font-black text-red-400 tracking-wider uppercase">
                Unlock ECU Tuning
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Calibration Parameters Confirmation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 text-xs text-slate-300 space-y-3 font-mono leading-relaxed">
          <p className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200">
            NOTICE: Modifying boost target, peak RPM, or pedal sensitivity overrides factory engine protection profiles.
            All parameter modifications are permanently logged to the tamper-evident local database.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#172130]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUnlock}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all hover:scale-105"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock ECU Tuning</span>
          </button>
        </div>
      </div>
    </div>
  );
};
