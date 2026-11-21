import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AlertBanner from './components/AlertBanner';
import MatchmakingPage from './pages/MatchmakingPage';
import LobbyReadyPage from './pages/LobbyReadyPage';
import ReportAdminPage from './pages/ReportAdminPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { USE_MOCK, apiRequest, mapHttpErrorMessage } from './config/api';
import {
    INITIAL_PENGGUNA,
    INITIAL_ANTREAN,
    INITIAL_ACTIVE_LOBBY,
    INITIAL_REPORTS,
    INITIAL_LEADERBOARD,
    INITIAL_LOG_PENALTI,
} from './data/mockData';

export default function App() {
    const [activeTab, setActiveTab] = useState('matchmaking');
    const [useMock, setUseMock] = useState(USE_MOCK);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

  // State Data (Mock di Hari 1-5, terisi dari REST API Express di Hari 6-7)
    const [users, setUsers] = useState(INITIAL_PENGGUNA);
    const [currentUserId, setCurrentUserId] = useState(101);
    const [queueList, setQueueList] = useState(INITIAL_ANTREAN);
    const [lobby, setLobby] = useState(INITIAL_ACTIVE_LOBBY);
    const [reports, setReports] = useState(INITIAL_REPORTS);
    const [leaderboard, setLeaderboard] = useState(INITIAL_LEADERBOARD);
    const [logPenalti, setLogPenalti] = useState(INITIAL_LOG_PENALTI);

    const currentUser = users.find((u) => u.id_pengguna === currentUserId) || users[0];

  // Simulasi Uji Error HTTP 400 / 403 / 409 / 503
    const handleSimulateError = (statusCode) => {
    setAlert({
        type: 'error',
        statusCode,
        endpoint: 'SIMULASI /api/queue/join',
        title: `Simulasi Respons Error HTTP ${statusCode}`,
        message: mapHttpErrorMessage(statusCode),
    });
    };

  // 1A. POST /api/queue/join
    const handleJoinQueue = async (rolePilihan) => {
    setLoading(true);
    setAlert(null);
    try {
        if (!useMock) {
        const { status, data } = await apiRequest('/api/queue/join', {
            method: 'POST',
            body: JSON.stringify({
            id_pengguna: currentUser.id_pengguna,
            role_pilihan: rolePilihan,
            mmr_saat_ini: currentUser.mmr_aktif,
            }),
        });
        setAlert({
            type: 'success',
            statusCode: status,
            endpoint: 'POST /api/queue/join',
            title: 'Berhasil Masuk Antrean Matchmaking',
            message: data?.message || 'Data antrean berhasil disimpan ke Oracle Database.',
        });
        return;
        }

      // Logika Mock Lokal
        if (currentUser.cooldown_hingga && new Date(currentUser.cooldown_hingga) > new Date()) {
        const err = new Error(
            `Pemain ${currentUser.username} masih terkena penalti dodge hingga ${new Date(
            currentUser.cooldown_hingga
            ).toLocaleTimeString('id-ID')}.`
        );
        err.status = 403;
        throw err;
        }

        const newEntry = {
        id_antrean: Date.now(),
        id_pengguna: currentUser.id_pengguna,
        username: currentUser.username,
        role_pilihan: rolePilihan,
        mmr_saat_ini: currentUser.mmr_aktif,
        status_antrean: 'WAITING',
        waktu_masuk: new Date().toISOString(),
        };

        setQueueList((prev) => [newEntry, ...prev]);
        setAlert({
        type: 'success',
        statusCode: 201,
        endpoint: 'POST /api/queue/join',
        title: 'Berhasil Masuk Antrean Matchmaking',
        message: `${currentUser.username} (${rolePilihan} • ${currentUser.mmr_aktif} MMR) masuk ke Antrean_Matchmaking.`,
        });
    } catch (err) {
        setAlert({
        type: 'error',
        statusCode: err.status || 500,
        endpoint: 'POST /api/queue/join',
        title: 'Gagal Masuk Antrean',
        message: mapHttpErrorMessage(err.status, err.message),
        });
    } finally {
        setLoading(false);
    }
    };

  // 1B. POST /api/matchmaking/pair
    const handleTriggerPair = async () => {
    setLoading(true);
    setAlert(null);
    try {
        if (!useMock) {
        const { status, data } = await apiRequest('/api/matchmaking/pair', {
            method: 'POST',
            body: JSON.stringify({ kode_season: 'S1-2026' }),
        });
        if (data?.lobby) setLobby(data.lobby);
        setAlert({
            type: 'success',
            statusCode: status,
            endpoint: 'POST /api/matchmaking/pair',
            title: 'Match Ditemukan!',
            message: 'sp_pasangkan_match berhasil mengunci 10 slot pemain dan membuka sesi Ready Check.',
        });
        setActiveTab('lobby');
        return;
        }

      // Simulasi Mock: reset lobby ready check dan arahkan ke tab Lobby
        setLobby({
        ...INITIAL_ACTIVE_LOBBY,
        id_sesi: INITIAL_ACTIVE_LOBBY.id_sesi + 1,
        status_sesi: 'READY_CHECK',
        batas_ready_check: new Date(Date.now() + 45 * 1000).toISOString(),
        });
        setAlert({
        type: 'success',
        statusCode: 200,
        endpoint: 'POST /api/matchmaking/pair',
        title: 'Match Ditemukan! Sesi Ready Check Dibuka',
        message:
            'Transaksi sp_pasangkan_match sukses (COMMIT). Silakan lakukan konfirmasi Ready Check sebelum batas waktu habis.',
        });
        setActiveTab('lobby');
    } catch (err) {
        setAlert({
        type: 'error',
        statusCode: err.status || 409,
        endpoint: 'POST /api/matchmaking/pair',
        title: 'Matchmaking Gagal / Konflik Slot',
        message: mapHttpErrorMessage(err.status, err.message),
        });
    } finally {
        setLoading(false);
    }
    };

  // 2A. POST /api/matches/:id/ready
    const handleReadyAction = async (idSesi, statusKonfirmasi) => {
    setLoading(true);
    setAlert(null);
    try {
        if (!useMock) {
        const { status } = await apiRequest(`/api/matches/${idSesi}/ready`, {
            method: 'POST',
            body: JSON.stringify({
            id_pengguna: currentUser.id_pengguna,
            status_konfirmasi: statusKonfirmasi,
            }),
        });
        setAlert({
            type: statusKonfirmasi === 'ACCEPTED' ? 'success' : 'warning',
            statusCode: status,
            endpoint: `POST /api/matches/${idSesi}/ready`,
            title: `Status Konfirmasi: ${statusKonfirmasi}`,
            message: 'Perubahan status konfirmasi berhasil diproses oleh server.',
        });
        return;
        }

        const updatedPartisipan = lobby.partisipan.map((p) =>
        p.id_pengguna === currentUser.id_pengguna
            ? { ...p, status_konfirmasi: statusKonfirmasi }
            : p
        );

        if (statusKonfirmasi === 'DECLINED') {
        const cooldownEnd = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        setUsers((prev) =>
            prev.map((u) =>
            u.id_pengguna === currentUser.id_pengguna ? { ...u, cooldown_hingga: cooldownEnd } : u
            )
        );
        setLogPenalti((prev) => [
            {
            id_penalti: Date.now(),
            id_pengguna: currentUser.id_pengguna,
            username: currentUser.username,
            id_sesi: idSesi,
            alasan: 'DECLINED_READY_CHECK (Trigger Oracle)',
            durasi_menit: 15,
            waktu_penalti: new Date().toLocaleString('id-ID'),
            },
            ...prev,
        ]);
        setLobby({
            ...lobby,
            status_sesi: 'CANCELLED',
            partisipan: updatedPartisipan,
        });
        setAlert({
            type: 'warning',
            statusCode: 200,
            endpoint: `POST /api/matches/${idSesi}/ready`,
            title: 'Lobby Dibubarkan — Penalti Dodge Dicatat Otomatis',
            message: `${currentUser.username} menolak match. Trigger Oracle otomatis memasukkan data ke Log_Penalti (15 menit) dan membubarkan sesi.`,
        });
        return;
        }

        const allAccepted = updatedPartisipan.every((p) => p.status_konfirmasi === 'ACCEPTED');
        setLobby({
        ...lobby,
        status_sesi: allAccepted ? 'IN_PROGRESS' : 'READY_CHECK',
        partisipan: updatedPartisipan,
        });
        setAlert({
        type: 'success',
        statusCode: 200,
        endpoint: `POST /api/matches/${idSesi}/ready`,
        title: allAccepted ? 'Semua Pemain Siap! Match Dimulai' : 'Konfirmasi Diterima (ACCEPTED)',
        message: allAccepted
            ? '10/10 pemain telah melakukan Accept. Status sesi berubah menjadi IN_PROGRESS.'
            : 'Menunggu sisa pemain di lobby melakukan konfirmasi sebelum timer habis.',
        });
    } catch (err) {
        setAlert({
        type: 'error',
        statusCode: err.status || 404,
        endpoint: `POST /api/matches/${idSesi}/ready`,
        title: 'Gagal Memperbarui Ready Check',
        message: mapHttpErrorMessage(err.status, err.message),
        });
    } finally {
        setLoading(false);
    }
    };

  // 2B. POST /api/matches/:id/timeout-check
    const handleTimeoutCheck = async (idSesi) => {
    setLoading(true);
    setAlert(null);
    try {
        if (!useMock) {
        const { status } = await apiRequest(`/api/matches/${idSesi}/timeout-check`, {
            method: 'POST',
        });
        setAlert({
            type: 'warning',
            statusCode: status,
            endpoint: `POST /api/matches/${idSesi}/timeout-check`,
            title: 'Pengecekan Timeout Selesai',
            message: 'Pemain dengan status PENDING diubah menjadi DECLINED dan lobby dibubarkan.',
        });
        return;
        }

        const pendingPlayers = lobby.partisipan.filter((p) => p.status_konfirmasi === 'PENDING');
        const updatedPartisipan = lobby.partisipan.map((p) =>
        p.status_konfirmasi === 'PENDING' ? { ...p, status_konfirmasi: 'DECLINED' } : p
        );

        if (pendingPlayers.length > 0) {
        const newLogs = pendingPlayers.map((p, idx) => ({
            id_penalti: Date.now() + idx,
            id_pengguna: p.id_pengguna,
            username: p.username,
            id_sesi: idSesi,
            alasan: 'READY_CHECK_TIMEOUT (AFK)',
            durasi_menit: 15,
            waktu_penalti: new Date().toLocaleString('id-ID'),
        }));
        setLogPenalti((prev) => [...newLogs, ...prev]);
        }

        setLobby({
        ...lobby,
        status_sesi: 'CANCELLED',
        partisipan: updatedPartisipan,
        });

        setAlert({
        type: 'warning',
        statusCode: 200,
        endpoint: `POST /api/matches/${idSesi}/timeout-check`,
        title: 'Ready Check Timeout — Lobby Dibubarkan',
        message: `${pendingPlayers.length} pemain yang belum konfirmasi otomatis diubah ke DECLINED dan dicatat ke Log_Penalti.`,
        });
    } catch (err) {
        setAlert({
        type: 'error',
        statusCode: err.status || 500,
        endpoint: `POST /api/matches/${idSesi}/timeout-check`,
        title: 'Gagal Mengecek Timeout',
        message: mapHttpErrorMessage(err.status, err.message),
        });
    } finally {
        setLoading(false);
    }
    };

  // 3A. POST /api/matches/:id/report
    const handleSubmitReport = async (payload) => {
    setLoading(true);
    setAlert(null);
    try {
        if (!useMock) {
        const { status } = await apiRequest(`/api/matches/${payload.id_sesi}/report`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        setAlert({
            type: 'success',
            statusCode: status,
            endpoint: `POST /api/matches/${payload.id_sesi}/report`,
            title: 'Laporan Skor Berhasil Dikirim',
            message: 'Menunggu verifikasi Admin untuk eksekusi sp_update_mmr.',
        });
        return;
        }

        const newReport = {
        id_laporan: Math.floor(302 + Math.random() * 90),
        id_sesi: payload.id_sesi,
        kode_season: 'S1-2026',
        id_pelapor: currentUser.id_pengguna,
        nama_pelapor: currentUser.username,
        tim_pemenang: payload.tim_pemenang,
        skor_akhir: payload.skor_akhir,
        bukti_url: payload.bukti_url,
        catatan: payload.catatan || 'Skor dikirim oleh kapten tim.',
        status_verifikasi: 'PENDING',
        waktu_lapor: new Date().toLocaleString('id-ID'),
        };

        setReports((prev) => [newReport, ...prev]);
        setAlert({
        type: 'success',
        statusCode: 201,
        endpoint: `POST /api/matches/${payload.id_sesi}/report`,
        title: 'Laporan Skor Berhasil Disimpan',
        message: `Laporan #${newReport.id_laporan} masuk ke tabel Laporan_Skor dan siap diverifikasi Admin.`,
        });
    } catch (err) {
        setAlert({
        type: 'error',
        statusCode: err.status || 400,
        endpoint: `POST /api/matches/${payload.id_sesi}/report`,
        title: 'Gagal Mengirim Laporan Skor',
        message: mapHttpErrorMessage(err.status, err.message),
        });
    } finally {
        setLoading(false);
    }
    };

  // 3B. POST /api/admin/reports/:id/verify
    const handleVerifyReport = async (idLaporan, statusVerifikasi) => {
    setLoading(true);
    setAlert(null);
    try {
        if (!useMock) {
        const { status } = await apiRequest(`/api/admin/reports/${idLaporan}/verify`, {
            method: 'POST',
            body: JSON.stringify({ status_verifikasi: statusVerifikasi }),
        });
        await handleRefreshLeaderboard();
        setAlert({
            type: 'success',
            statusCode: status,
            endpoint: `POST /api/admin/reports/${idLaporan}/verify`,
            title: `Laporan #${idLaporan} → ${statusVerifikasi}`,
            message: 'sp_update_mmr selesai dieksekusi secara atomik dan Leaderboard diperbarui.',
        });
        return;
        }

        const targetReport = reports.find((r) => r.id_laporan === idLaporan);
        setReports((prev) =>
        prev.map((r) =>
            r.id_laporan === idLaporan ? { ...r, status_verifikasi: statusVerifikasi } : r
        )
        );

        if (statusVerifikasi === 'VERIFIED' && targetReport) {
        // Simulasi update MMR atomik untuk 10 pemain berdasarkan tim pemenang
        const winnerIds = lobby.partisipan
            .filter((p) => p.tim === targetReport.tim_pemenang)
            .map((p) => p.id_pengguna);

        setLeaderboard((prev) =>
            prev.map((row) => {
            const isWinner = winnerIds.includes(row.id_pengguna);
            const delta = isWinner ? 25 : -20;
            return {
                ...row,
                mmr_aktif: row.mmr_aktif + delta,
                total_match: row.total_match + 1,
                menang: isWinner ? row.menang + 1 : row.menang,
                selisih_terakhir: delta,
            };
            })
        );

        setAlert({
            type: 'success',
            statusCode: 200,
            endpoint: `POST /api/admin/reports/${idLaporan}/verify`,
            title: 'Verifikasi Sukses — sp_update_mmr COMMIT!',
            message: `MMR seluruh pemain Tim ${targetReport.tim_pemenang} (+25) & tim lawan (-20) telah diperbarui secara atomik. Cek tab Leaderboard!`,
        });
        } else {
        setAlert({
            type: 'warning',
            statusCode: 200,
            endpoint: `POST /api/admin/reports/${idLaporan}/verify`,
            title: `Laporan #${idLaporan} Ditolak (REJECTED)`,
            message: 'Tidak ada perubahan MMR yang dijalankan.',
        });
        }
    } catch (err) {
        setAlert({
        type: 'error',
        statusCode: err.status || 409,
        endpoint: `POST /api/admin/reports/${idLaporan}/verify`,
        title: 'Gagal Memverifikasi Laporan',
        message: mapHttpErrorMessage(err.status, err.message),
        });
    } finally {
        setLoading(false);
    }
    };

  // 4. GET /api/leaderboard
    const handleRefreshLeaderboard = async () => {
    setLoading(true);
    try {
        if (!useMock) {
        const { status, data } = await apiRequest('/api/leaderboard', { method: 'GET' });
        if (Array.isArray(data)) setLeaderboard(data);
        setAlert({
            type: 'info',
            statusCode: status,
            endpoint: 'GET /api/leaderboard',
            title: 'Leaderboard Diperbarui dari v_leaderboard_mmr',
            message: 'Data peringkat MMR terbaru berhasil dimuat dari Oracle Database.',
        });
        } else {
        setAlert({
            type: 'info',
            statusCode: 200,
            endpoint: 'GET /api/leaderboard',
            title: 'Leaderboard Tersinkronisasi',
            message: 'Menampilkan peringkat MMR terkini dari View v_leaderboard_mmr.',
        });
        }
    } catch (err) {
        setAlert({
        type: 'error',
        statusCode: err.status || 500,
        endpoint: 'GET /api/leaderboard',
        title: 'Gagal Memuat Leaderboard',
        message: mapHttpErrorMessage(err.status, err.message),
        });
    } finally {
        setLoading(false);
    }
    };

    const handleResetLobbyDemo = () => {
    setLobby({
        ...INITIAL_ACTIVE_LOBBY,
      batas_ready_check: new Date(Date.now() + 45 * 1000).toISOString(),
    });
    setAlert({
        type: 'info',
        title: 'Simulasi Lobby Direset',
        message: 'Timer Ready Check di-reset ke 45 detik dan slot partisipan dikembalikan.',
    });
    };

    return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        users={users}
        currentUser={currentUser}
        onSelectUser={setCurrentUserId}
        useMock={useMock}
        setUseMock={setUseMock}
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AlertBanner alert={alert} onClose={() => setAlert(null)} />

        {activeTab === 'matchmaking' && (
            <MatchmakingPage
            currentUser={currentUser}
            queueList={queueList}
            logPenalti={logPenalti}
            onJoinQueue={handleJoinQueue}
            onTriggerPair={handleTriggerPair}
            onSimulateError={handleSimulateError}
            loading={loading}
            />
        )}

        {activeTab === 'lobby' && (
            <LobbyReadyPage
            lobby={lobby}
            currentUser={currentUser}
            onReadyAction={handleReadyAction}
            onTimeoutCheck={handleTimeoutCheck}
            onResetLobbyDemo={handleResetLobbyDemo}
            loading={loading}
            />
        )}

        {activeTab === 'report' && (
            <ReportAdminPage
            currentUser={currentUser}
            reports={reports}
            onSubmitReport={handleSubmitReport}
            onVerifyReport={handleVerifyReport}
            loading={loading}
            />
        )}

        {activeTab === 'leaderboard' && (
            <LeaderboardPage
            leaderboard={leaderboard}
            onRefreshLeaderboard={handleRefreshLeaderboard}
            loading={loading}
            />
        )}
        </main>
    </div>
    );
}