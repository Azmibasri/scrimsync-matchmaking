import React from 'react';
import { Swords, Users, ShieldCheck, Trophy, Database, UserCircle } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'matchmaking', label: '1. Matchmaking & Antrean', icon: Swords },
  { id: 'lobby', label: '2. Lobby & Ready Check', icon: Users },
  { id: 'report', label: '3. Laporan Skor & Admin', icon: ShieldCheck },
  { id: 'leaderboard', label: '4. Real-Time Leaderboard', icon: Trophy },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  users,
  currentUser,
  onSelectUser,
  useMock,
  setUseMock,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Bar: Brand + Mode Switcher + User Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
              SS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">ScrimSync</h1>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-cyan-300">
                  SEASON S1-2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Competitive Esports Matchmaking • Oracle XE 21c + Express + React
              </p>
            </div>
          </div>

          {/* Controls: Mock vs Live API & Active User Simulator */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setUseMock(!useMock)}
              title="Beralih antara Data Mock Lokal (Hari 1-5) dan REST API Express (Hari 6-7)"
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                useMock
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>{useMock ? 'Mode: MOCK JSON' : 'Mode: LIVE API (:3000)'}</span>
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5">
              <UserCircle className="h-4 w-4 text-cyan-400" />
              <label htmlFor="user-switcher" className="text-xs text-slate-400">
                Akun Uji:
              </label>
              <select
                id="user-switcher"
                value={currentUser.id_pengguna}
                onChange={(e) => onSelectUser(Number(e.target.value))}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id_pengguna} value={u.id_pengguna} className="bg-slate-900 text-white">
                    {u.username} ({u.role_sistem}) — {u.mmr_aktif} MMR
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-1 overflow-x-auto pb-2" aria-label="Navigasi Utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-inset ring-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}