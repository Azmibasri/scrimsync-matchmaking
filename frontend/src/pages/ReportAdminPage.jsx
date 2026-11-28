import React, { useState } from 'react';
import { FileCheck2, ShieldCheck, ExternalLink, Send, CheckCircle2, XCircle } from 'lucide-react';

export default function ReportAdminPage({
  currentUser,
  reports,
  onSubmitReport,
  onVerifyReport,
  loading,
}) {
  const [idSesi, setIdSesi] = useState('901');
  const [timPemenang, setTimPemenang] = useState('ALPHA');
  const [skorAkhir, setSkorAkhir] = useState('2 - 0');
  const [buktiUrl, setBuktiUrl] = useState('https://imgur.com/scrimsync-proof-901.png');
  const [catatan, setCatatan] = useState('');

  const handleReportSubmit = (e) => {
    e.preventDefault();
    onSubmitReport({
      id_sesi: Number(idSesi),
      id_pelapor: currentUser.id_pengguna,
      tim_pemenang: timPemenang,
      skor_akhir: skorAkhir,
      bukti_url: buktiUrl,
      catatan,
    });
    setCatatan('');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <span className="font-mono text-xs text-cyan-400">
          POST /api/matches/:id/report • POST /api/admin/reports/:id/verify
        </span>
        <h2 className="mt-1 text-2xl font-bold text-white">Laporan Skor Kapten & Panel Verifikasi Admin</h2>
        <p className="mt-1 text-sm text-slate-400">
          Kapten tim mengunggah bukti hasil pertandingan. Saat Admin memverifikasi laporan, prosedur{' '}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
            sp_update_mmr
          </code>{' '}
          menghitung naik/turun MMR 10 pemain secara atomik dalam satu transaksi.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Form Laporan Skor Kapten */}
        <form
          onSubmit={handleReportSubmit}
          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCheck2 className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Form Laporan Hasil Pertandingan</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">ID Sesi Pertandingan</label>
            <input
              type="number"
              required
              value={idSesi}
              onChange={(e) => setIdSesi(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 font-mono text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300">Tim Pemenang</label>
              <select
                value={timPemenang}
                onChange={(e) => setTimPemenang(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="ALPHA">TIM ALPHA</option>
                <option value="BETA">TIM BETA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300">Skor Akhir</label>
              <input
                type="text"
                required
                placeholder="2 - 0"
                value={skorAkhir}
                onChange={(e) => setSkorAkhir(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Tautan Bukti Screenshot Scoreboard
            </label>
            <input
              type="url"
              required
              value={buktiUrl}
              onChange={(e) => setBuktiUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Opsional: keterangan jika ada pause atau dispute"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>Kirim Laporan Skor</span>
          </button>
        </form>

        {/* Right: Admin Dispute & Verification Queue */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Antrean Verifikasi Admin / Moderator</h3>
            </div>
            <span className="rounded bg-slate-800 px-2.5 py-0.5 font-mono text-xs text-slate-300">
              Role Aktif: {currentUser.role_sistem}
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => {
              const isPending = rep.status_verifikasi !== 'VERIFIED' && rep.status_verifikasi !== 'REJECTED';
              return (
                <div
                  key={rep.id_laporan}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          Laporan #{rep.id_laporan} • Sesi #{rep.id_sesi}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                            rep.status_verifikasi === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : rep.status_verifikasi === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {rep.status_verifikasi}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Pelapor: <strong className="text-slate-200">{rep.nama_pelapor}</strong> •
                        Pemenang Klaim:{' '}
                        <strong className="text-cyan-300">Tim {rep.tim_pemenang}</strong> (
                        {rep.skor_akhir})
                      </p>
                    </div>

                    <a
                      href={rep.bukti_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-cyan-300 hover:bg-slate-800"
                    >
                      <span>Lihat Bukti</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {rep.catatan && (
                    <p className="mt-2 rounded-lg bg-slate-900/90 px-3 py-2 text-xs text-slate-300">
                      "{rep.catatan}"
                    </p>
                  )}

                  {isPending && (
                    <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
                      <button
                        type="button"
                        onClick={() => onVerifyReport(rep.id_laporan, 'REJECTED')}
                        disabled={loading}
                        className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Tolak Laporan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onVerifyReport(rep.id_laporan, 'VERIFIED')}
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Verifikasi & Eksekusi sp_update_mmr</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
