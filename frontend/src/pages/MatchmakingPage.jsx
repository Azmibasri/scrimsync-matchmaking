import React, { useState } from 'react';
import { Swords, Clock, ShieldBan, Zap, Users, AlertCircle } from 'lucide-react';
import { GAME_ROLES } from '../data/mockData';

export default function MatchmakingPage({
  currentUser,
  queueList,
  logPenalti,
  onJoinQueue,
  onTriggerPair,
  onSimulateError,
  loading,
}) {
  const [selectedRole, setSelectedRole] = useState(currentUser.role_utama || 'JUNGLER');

  const isCooldownActive =
    currentUser.cooldown_hingga && new Date(currentUser.cooldown_hingga) > new Date();

  const myQueueEntry = queueList.find(
    (q) => q.id_pengguna === currentUser.id_pengguna && q.status_antrean === 'WAITING'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onJoinQueue(selectedRole);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-cyan-400">
            Endpoint: POST /api/queue/join & POST /api/matchmaking/pair
          </span>
          <h2 className="mt-1 text-2xl font-bold text-white">Competitive Matchmaking & Antrean</h2>
          <p className="mt-1 text-sm text-slate-400">
            Pilih role utama dan masuk ke antrean berbasis MMR. Sistem mengunci slot menggunakan{' '}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
              SELECT ... FOR UPDATE
            </code>{' '}
            untuk mencegah perebutan slot ganda.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-right">
          <div className="text-xs text-slate-400">MMR Aktif Anda</div>
          <div className="font-mono text-2xl font-bold text-cyan-400">{currentUser.mmr_aktif}</div>
          <div className="text-[11px] text-slate-500">Rentang Match: ±150 MMR</div>
        </div>
      </div>

      {/* Cooldown Warning Card if Active */}
      {isCooldownActive && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-5">
          <div className="flex items-start gap-3">
            <ShieldBan className="mt-0.5 h-6 w-6 shrink-0 text-rose-400" />
            <div>
              <h3 className="font-bold text-rose-200">
                Akun Terkena Cooldown Penalti Dodge (HTTP 403 Forbidden)
              </h3>
              <p className="mt-1 text-sm text-rose-200/80">
                Anda tidak dapat menekan Find Match hingga{' '}
                <span className="font-mono font-semibold text-white">
                  {new Date(currentUser.cooldown_hingga).toLocaleTimeString('id-ID')}
                </span>
                . Penalti ini dicatat otomatis oleh Trigger Oracle pada tabel{' '}
                <code className="font-mono text-xs">Log_Penalti</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Role Picker & Find Match */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">1. Pilih Role Utama Pertandingan</h3>
            <span className="font-mono text-xs text-slate-400">
              Pemain: {currentUser.username}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GAME_ROLES.map((role) => {
              const active = selectedRole === role.id;
              return (
                <button
                  type="button"
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400/50'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{role.label}</span>
                    {active && (
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">{role.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
            <button
              type="submit"
              disabled={loading || Boolean(myQueueEntry)}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Swords className="h-4 w-4" />
              <span>{myQueueEntry ? 'Sudah Dalam Antrean (WAITING)' : 'Find Match (Join Queue)'}</span>
            </button>

            <button
              type="button"
              onClick={onTriggerPair}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              <span>Jalankan sp_pasangkan_match</span>
            </button>
          </div>

          {/* Error Simulation Toolbar for Demo & Testing */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                Simulasi Uji Error HTTP (Target Hari 3-5):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSimulateError(400)}
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300 hover:border-amber-500/50 hover:text-amber-300"
                >
                  Test 400
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateError(403)}
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300 hover:border-rose-500/50 hover:text-rose-300"
                >
                  Test 403 Cooldown
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateError(409)}
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300 hover:border-rose-500/50 hover:text-rose-300"
                >
                  Test 409 Slot Penuh
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateError(503)}
                  className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-300 hover:border-rose-500/50 hover:text-rose-300"
                >
                  Test 503 DB Busy
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Right: Active Queue Status & Penalty Log */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Users className="h-4 w-4 text-cyan-400" />
                Antrean Aktif ({queueList.length})
              </h3>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                Composite Index Ready
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {queueList.map((item) => (
                <div
                  key={item.id_antrean}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{item.username}</div>
                    <div className="font-mono text-xs text-slate-400">
                      {item.role_pilihan} • {item.mmr_saat_ini} MMR
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                      item.status_antrean === 'WAITING'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {item.status_antrean}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Clock className="h-4 w-4 text-rose-400" />
              Log Penalti Terbaru (Immutable)
            </h3>
            <div className="mt-3 space-y-2">
              {logPenalti.map((log) => (
                <div
                  key={log.id_penalti}
                  className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-rose-200">
                    <span>{log.username}</span>
                    <span className="font-mono">+{log.durasi_menit} Menit</span>
                  </div>
                  <p className="mt-1 text-slate-400">
                    Sesi #{log.id_sesi}: {log.alasan}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
