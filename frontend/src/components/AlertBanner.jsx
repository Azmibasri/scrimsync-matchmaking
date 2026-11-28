import React from 'react';
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';

export default function AlertBanner({ alert, onClose }) {
  if (!alert) return null;

  const styles = {
    error: {
      wrapper: 'bg-rose-950/80 border-rose-500/60 text-rose-100',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      Icon: ShieldAlert,
    },
    success: {
      wrapper: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-100',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      Icon: CheckCircle2,
    },
    warning: {
      wrapper: 'bg-amber-950/80 border-amber-500/60 text-amber-100',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      Icon: AlertTriangle,
    },
    info: {
      wrapper: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-100',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      Icon: Info,
    },
  };

  const current = styles[alert.type] || styles.info;
  const Icon = current.Icon;

  return (
    <div className={`mb-6 rounded-xl border p-4 shadow-lg backdrop-blur-sm transition-all ${current.wrapper}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm">{alert.title}</span>
              {alert.statusCode && (
                <span className={`rounded border px-2 py-0.5 font-mono text-xs font-semibold ${current.badge}`}>
                  HTTP {alert.statusCode}
                </span>
              )}
              {alert.endpoint && (
                <span className="font-mono text-xs text-slate-400">{alert.endpoint}</span>
              )}
            </div>
            <p className="mt-1 text-sm opacity-90">{alert.message}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Tutup notifikasi"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}