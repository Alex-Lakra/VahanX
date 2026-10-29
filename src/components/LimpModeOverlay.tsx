import React, { useState, useEffect, useRef } from 'react';
import { LimpModeController, LimpModeState } from '../services/LimpModeController';
import { AlertOctagon, ShieldAlert, KeyRound, CheckSquare, Square, X } from 'lucide-react';

export const LimpModeOverlay: React.FC = () => {
  const [limpState, setLimpState] = useState<LimpModeState>(LimpModeController.getState());
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [acknowledgedDamage, setAcknowledgedDamage] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const holdIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return LimpModeController.subscribe((s) => {
      setLimpState(s);
    });
  }, []);

  const startHolding = () => {
    if (!acknowledgedDamage) return;
    setHoldProgress(0);

    const startTime = Date.now();
    const duration = 5000; // 5 seconds required

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setHoldProgress(pct);

      if (elapsed >= duration) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        LimpModeController.overrideLimpMode();
        setIsOverrideModalOpen(false);
        setHoldProgress(0);
      }
    }, 50);
  };

  const cancelHolding = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  if (!limpState.isActive) {
    if (limpState.isOverridden) {
      return (
        <div className="bg-amber-950/80 border-b border-amber-600 px-4 py-2 flex items-center justify-between text-xs font-mono text-amber-200">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
            <span>⚠️ LIMP MODE OVERRIDDEN BY OPERATOR — MECHANICAL DAMAGE LIABILITY ACTIVE</span>
          </div>
          <span className="text-[10px] bg-amber-500 text-black font-bold px-2 py-0.5 rounded">
            UNGOVERNED
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Persistent Top Warning Strip */}
      <div className="bg-red-700 text-white px-4 py-2.5 shadow-xl flex items-center justify-between z-40 border-b-2 border-red-500 animate-pulse">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-white shrink-0" />
          <div>
            <span className="font-mono text-xs font-black tracking-widest uppercase block">
              20 KM/H LIMP MODE ACTIVE (J1939 TSC1 GOVERNOR ENGAGED)
            </span>
            <span className="text-[11px] text-red-100 font-sans block">
              {limpState.reason || 'Critical powertrain safety limit breached.'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsOverrideModalOpen(true)}
          className="bg-black/80 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase border border-red-400 transition-all shrink-0"
        >
          Emergency Override
        </button>
      </div>

      {/* Override Confirmation Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#100a0a] border-2 border-red-600 rounded-2xl max-w-md w-full p-6 shadow-2xl glow-danger text-slate-100">
            <div className="flex items-center justify-between border-b border-red-900/60 pb-3">
              <div className="flex items-center gap-2 text-red-500">
                <AlertOctagon className="w-6 h-6" />
                <h3 className="font-mono text-base font-bold uppercase tracking-wider text-red-400">
                  Limp Mode Liability Override
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-300 space-y-3 font-sans">
              <p className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-200 font-mono">
                DANGER: The vehicle governor is currently restricting road speed to 20 km/h and engine RPM to 1,200
                to protect against engine block seizure or brake hydraulic failure.
              </p>

              <div
                onClick={() => setAcknowledgedDamage(!acknowledgedDamage)}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 hover:bg-slate-900 cursor-pointer"
              >
                {acknowledgedDamage ? (
                  <CheckSquare className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                )}
                <span className="text-xs text-slate-200">
                  I acknowledge that overriding 20 km/h Limp Mode under active critical faults may cause immediate
                  and irreversible engine or drivetrain failure.
                </span>
              </div>

              {acknowledgedDamage && (
                <div className="p-3 bg-black/60 rounded-lg border border-slate-800 text-center space-y-2">
                  <span className="text-xs font-mono text-slate-400 block">
                    Press and hold button for 5 continuous seconds:
                  </span>

                  {/* Hold Progress Bar */}
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="bg-red-600 h-full transition-all duration-75 ease-linear"
                      style={{ width: `${holdProgress}%` }}
                    />
                  </div>

                  <button
                    onMouseDown={startHolding}
                    onMouseUp={cancelHolding}
                    onMouseLeave={cancelHolding}
                    onTouchStart={startHolding}
                    onTouchEnd={cancelHolding}
                    className="w-full py-3 rounded-lg bg-red-700 active:bg-red-600 text-white font-mono text-xs font-extrabold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 select-none"
                  >
                    <KeyRound className="w-4 h-4" />
                    {holdProgress > 0 ? `HOLDING (${Math.round(holdProgress)}%)...` : 'PRESS & HOLD TO OVERRIDE'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

