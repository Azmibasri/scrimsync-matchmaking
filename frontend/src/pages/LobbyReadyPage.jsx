import React, { useEffect, useState } from 'react';
import { Check, X, Timer, RefreshCw, ShieldAlert } from 'lucide-react';

export default function LobbyReadyPage({
  lobby,
  currentUser,
  onReadyAction,
  onTimeoutCheck,
  onResetLobbyDemo,
  loading,
}) {
  const [secondsLeft, setSecondsLeft] = useState(45);

  useEffect(() => {
    if (!lobby || lobby.status_sesi !== 'READY_CHECK') {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(lobby.batas_ready_check).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lobby]);

  if (!lobby) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
        <p className="text-slate-400">Tidak ada lobby aktif saat ini.</p>
      </div>
    );
  }

  const alphaTeam = lobby.partisipan.filter((p) => p.tim === 'ALPHA');
  const betaTeam = lobby.partisipan.filter((p) => p.tim === 'BETA');
  const myParticipant = lobby.partisipan.find((p) => p.id_pengguna === currentUser.id_pengguna);

  const acceptedCount = lobby.partisipan.filter((p) => p.status_konfirmasi === 'ACCEPTED').length;

  const renderStatusBadge = (status) => {
    if (status === 'ACCEPTED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-300">
          <Check className="h-3 w-3" /> ACCEPTED
        </span>
      );
    }
    if (status === 'DECLINED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 font-mono text-xs font-semibold text-rose-300">
          <X className="h-3 w-3" /> DECLINED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-300">
        PENDING
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Ready Check Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-cyan-400">
              GET /api/lobbies/active • POST /api/matches/{lobby.id_sesi}/ready
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
              Sesi #{lobby.id_sesi} ({lobby.kode_season})
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold text-white">Lobby & Fase Ready Check (5v5)</h2>
          <p className="mt-1 text-sm text-slate-400">
            Status Sesi:{' '}
            <span className="font-mono font-semibold text-cyan-300">{lobby.status_sesi}</span> •
            Konfirmasi Terkumpul:{' '}
            <span className="font-mono font-semibold text-white">
              {acceptedCount} / {lobby.partisipan.length}
            </span>
          </p>
        </div>

        {/* Countdown Box */}
        <div className="flex items-center gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3">
          <Timer className="h-7 w-7 text-amber-400" />
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-200/80">
              Batas Ready Check
            </div>
            <div className="font-mono text-2xl font-bold text-amber-300">
              00:{String(secondsLeft).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Action Panel for Current User */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <div className="text-sm">
          {myParticipant ? (
            <p className="text-slate-300">
              Anda terdaftar di <strong className="text-white">Tim {myParticipant.tim}</strong>{' '}
              sebagai <strong className="text-cyan-300">{myParticipant.role_diambil}</strong>.
              Status Anda saat ini: {renderStatusBadge(myParticipant.status_konfirmasi)}
            </p>
          ) : (
            <p className="text-slate-400">
              Akun aktif (<span className="text-white">{currentUser.username}</span>) tidak berada di
              sesi ini. Ganti akun uji di atas ke <strong>moula_zaki</strong> atau{' '}
              <strong>khalifi_pro</strong> untuk menekan Accept/Decline.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {myParticipant && lobby.status_sesi === 'READY_CHECK' && (
            <>
              <button
                onClick={() => onReadyAction(lobby.id_sesi, 'ACCEPTED')}
                disabled={loading || myParticipant.status_konfirmasi === 'ACCEPTED'}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Accept Match</span>
              </button>
              <button
                onClick={() => onReadyAction(lobby.id_sesi, 'DECLINED')}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-500 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                <span>Decline (Dodge)</span>
              </button>
            </>
          )}

          <button
            onClick={() => onTimeoutCheck(lobby.id_sesi)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/25"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Pemicu Timeout Check</span>
          </button>

          <button
            onClick={onResetLobbyDemo}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Simulasi Lobby</span>
          </button>
        </div>
      </div>

      {/* 5v5 Team Roster Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* TIM ALPHA */}
        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-cyan-400">TIM ALPHA (Blue Side)</h3>
            <span className="font-mono text-xs text-slate-400">5 Slots</span>
          </div>
          <div className="space-y-2.5">
            {alphaTeam.map((player) => (
              <div
                key={player.id_partisipan}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  player.id_pengguna === currentUser.id_pengguna
                    ? 'border-cyan-500/50 bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-950/70'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{player.username}</span>
                    {player.id_pengguna === currentUser.id_pengguna && (
                      <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                        ANDA
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    {player.role_diambil} • {player.mmr_saat_ini} MMR
                  </div>
                </div>
                {renderStatusBadge(player.status_konfirmasi)}
              </div>
            ))}
          </div>
        </div>

        {/* TIM BETA */}
        <div className="rounded-2xl border border-rose-500/30 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-rose-400">TIM BETA (Red Side)</h3>
            <span className="font-mono text-xs text-slate-400">5 Slots</span>
          </div>
          <div className="space-y-2.5">
            {betaTeam.map((player) => (
              <div
                key={player.id_partisipan}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  player.id_pengguna === currentUser.id_pengguna
                    ? 'border-rose-500/50 bg-rose-950/30'
                    : 'border-slate-800 bg-slate-950/70'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{player.username}</span>
                    {player.id_pengguna === currentUser.id_pengguna && (
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                        ANDA
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    {player.role_diambil} • {player.mmr_saat_ini} MMR
                  </div>
                </div>
                {renderStatusBadge(player.status_konfirmasi)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
