import React, { useState } from 'react';
import { Trophy, RefreshCw, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { GAME_ROLES } from '../data/mockData';

export default function LeaderboardPage({ leaderboard, onRefreshLeaderboard, loading }) {
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedData = [...leaderboard]
    .sort((a, b) => b.mmr_aktif - a.mmr_aktif)
    .filter((row) => (roleFilter === 'ALL' ? true : row.role_utama === roleFilter))
    .filter((row) => row.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div>
          <span className="font-mono text-xs text-cyan-400">
            Endpoint: GET /api/leaderboard (View: v_leaderboard_mmr)
          </span>
          <h2 className="mt-1 text-2xl font-bold text-white">Real-Time MMR Leaderboard</h2>
          <p className="mt-1 text-sm text-slate-400">
            Peringkat diperbarui secara atomik setelah Admin memverifikasi hasil pertandingan dan
            dicatat otomatis oleh Trigger ke tabel <code className="font-mono text-xs">Riwayat_MMR</code>.
          </p>
        </div>

        <button
          onClick={onRefreshLeaderboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/25"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh View Oracle</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              roleFilter === 'ALL'
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Semua Role
          </button>
          {GAME_ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === r.id
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari username pemain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3.5">Rank</th>
                <th className="px-5 py-3.5">Pemain</th>
                <th className="px-5 py-3.5">Role Utama</th>
                <th className="px-5 py-3.5 text-right">MMR Aktif</th>
                <th className="px-5 py-3.5 text-right">Perubahan Terakhir</th>
                <th className="px-5 py-3.5 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {sortedData.map((player, index) => {
                const rank = index + 1;
                const winRate =
                  player.total_match > 0
                    ? Math.round((player.menang / player.total_match) * 100)
                    : 0;
                const delta = player.selisih_terakhir || 0;

                return (
                  <tr key={player.id_profil} className="transition hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-mono font-bold">
                      {rank === 1 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-amber-300">
                          <Trophy className="h-3.5 w-3.5" /> #1
                        </span>
                      ) : rank <= 3 ? (
                        <span className="text-cyan-300">#{rank}</span>
                      ) : (
                        <span className="text-slate-400">#{rank}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white">{player.username}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-0.5 font-mono text-xs text-slate-300">
                        {player.role_utama}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-base font-bold text-cyan-400">
                      {player.mmr_aktif}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold">
                      {delta >= 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <TrendingUp className="h-3.5 w-3.5" /> +{delta}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400">
                          <TrendingDown className="h-3.5 w-3.5" /> {delta}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-300">
                      {winRate}% ({player.menang}/{player.total_match})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
