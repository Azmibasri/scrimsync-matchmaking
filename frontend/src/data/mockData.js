// Data Mock JSON yang disinkronkan 100% dengan skema 8 tabel Oracle XE milik Azmi Basri
// dan alias huruf kecil milik Erdian Wijaya.

export const GAME_ROLES = [
    { id: 'JUNGLER', label: 'Jungler', desc: 'Kontrol objektif & rotasi cepat' },
    { id: 'ROAMER', label: 'Roamer', desc: 'Inisiasi teamfight & buka map' },
    { id: 'MID_LANER', label: 'Mid Laner', desc: 'Burst damage & kontrol lane tengah' },
    { id: 'GOLD_LANER', label: 'Gold Laner', desc: 'Late-game carry & damage utama' },
    { id: 'EXP_LANER', label: 'EXP Laner', desc: 'Frontliner & split-push lane samping' },
];

export const INITIAL_PENGGUNA = [
    {
    id_pengguna: 101,
    username: 'moula_zaki',
    email: 'moula.zaki@mhs.usk.ac.id',
    role_sistem: 'PEMAIN',
    role_utama: 'JUNGLER',
    mmr_aktif: 1640,
    cooldown_hingga: null,
    },
    {
    id_pengguna: 102,
    username: 'azmi_basri',
    email: 'azmi.basri@mhs.usk.ac.id',
    role_sistem: 'ADMIN',
    role_utama: 'MID_LANER',
    mmr_aktif: 1790,
    cooldown_hingga: null,
    },
    {
    id_pengguna: 103,
    username: 'erdian_wijaya',
    email: 'erdian.wijaya@mhs.usk.ac.id',
    role_sistem: 'PEMAIN',
    role_utama: 'ROAMER',
    mmr_aktif: 1715,
    cooldown_hingga: null,
    },
    {
    id_pengguna: 104,
    username: 'toxic_dodger99',
    email: 'dodger99@mhs.usk.ac.id',
    role_sistem: 'PEMAIN',
    role_utama: 'GOLD_LANER',
    mmr_aktif: 1420,
    cooldown_hingga: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
    },
];

export const INITIAL_ANTREAN = [
    {
    id_antrean: 5001,
    id_pengguna: 103,
    username: 'erdian_wijaya',
    role_pilihan: 'ROAMER',
    mmr_saat_ini: 1715,
    status_antrean: 'WAITING',
    waktu_masuk: new Date(Date.now() - 45 * 1000).toISOString(),
    },
    {
    id_antrean: 5002,
    id_pengguna: 105,
    username: 'raymond_v',
    role_pilihan: 'MID_LANER',
    mmr_saat_ini: 1680,
    status_antrean: 'WAITING',
    waktu_masuk: new Date(Date.now() - 32 * 1000).toISOString(),
    },
    {
    id_antrean: 5003,
    id_pengguna: 106,
    username: 'fathir_aceh',
    role_pilihan: 'GOLD_LANER',
    mmr_saat_ini: 1625,
    status_antrean: 'WAITING',
    waktu_masuk: new Date(Date.now() - 18 * 1000).toISOString(),
    },
    {
    id_antrean: 5004,
    id_pengguna: 107,
    username: 'khalifi_pro',
    role_pilihan: 'EXP_LANER',
    mmr_saat_ini: 1655,
    status_antrean: 'WAITING',
    waktu_masuk: new Date(Date.now() - 10 * 1000).toISOString(),
    },
];

export const INITIAL_ACTIVE_LOBBY = {
    id_sesi: 901,
    kode_season: 'S1-2026',
    status_sesi: 'READY_CHECK',
    rata_rata_mmr: 1668,
  batas_ready_check: new Date(Date.now() + 45 * 1000).toISOString(),
    partisipan: [
    // TIM ALPHA
    { id_partisipan: 1, id_sesi: 901, id_pengguna: 101, username: 'moula_zaki', tim: 'ALPHA', role_diambil: 'JUNGLER', mmr_saat_ini: 1640, status_konfirmasi: 'PENDING' },
    { id_partisipan: 2, id_sesi: 901, id_pengguna: 103, username: 'erdian_wijaya', tim: 'ALPHA', role_diambil: 'ROAMER', mmr_saat_ini: 1715, status_konfirmasi: 'ACCEPTED' },
    { id_partisipan: 3, id_sesi: 901, id_pengguna: 105, username: 'raymond_v', tim: 'ALPHA', role_diambil: 'MID_LANER', mmr_saat_ini: 1680, status_konfirmasi: 'ACCEPTED' },
    { id_partisipan: 4, id_sesi: 901, id_pengguna: 106, username: 'fathir_aceh', tim: 'ALPHA', role_diambil: 'GOLD_LANER', mmr_saat_ini: 1625, status_konfirmasi: 'ACCEPTED' },
    { id_partisipan: 5, id_sesi: 901, id_pengguna: 107, username: 'khalifi_pro', tim: 'ALPHA', role_diambil: 'EXP_LANER', mmr_saat_ini: 1655, status_konfirmasi: 'PENDING' },
    // TIM BETA
    { id_partisipan: 6, id_sesi: 901, id_pengguna: 102, username: 'azmi_basri', tim: 'BETA', role_diambil: 'MID_LANER', mmr_saat_ini: 1790, status_konfirmasi: 'ACCEPTED' },
    { id_partisipan: 7, id_sesi: 901, id_pengguna: 108, username: 'damanhuri_x', tim: 'BETA', role_diambil: 'JUNGLER', mmr_saat_ini: 1660, status_konfirmasi: 'ACCEPTED' },
    { id_partisipan: 8, id_sesi: 901, id_pengguna: 109, username: 'lukman_fmipa', tim: 'BETA', role_diambil: 'ROAMER', mmr_saat_ini: 1630, status_konfirmasi: 'ACCEPTED' },
    { id_partisipan: 9, id_sesi: 901, id_pengguna: 110, username: 'irfan_net', tim: 'BETA', role_diambil: 'GOLD_LANER', mmr_saat_ini: 1645, status_konfirmasi: 'ACCEPTED' },
    { id_partisipan: 10, id_sesi: 901, id_pengguna: 111, username: 'reza_aryandi', tim: 'BETA', role_diambil: 'EXP_LANER', mmr_saat_ini: 1640, status_konfirmasi: 'ACCEPTED' },
    ],
};

export const INITIAL_REPORTS = [
    {
    id_laporan: 301,
    id_sesi: 899,
    kode_season: 'S1-2026',
    id_pelapor: 101,
    nama_pelapor: 'moula_zaki',
    tim_pemenang: 'ALPHA',
    skor_akhir: '2 - 1',
    bukti_url: 'https://imgur.com/scrimsync-match-899-ss.png',
    catatan: 'Tim Beta sempat mengajukan dispute menit ke-18, bukti scoreboard terlampir.',
    status_verifikasi: 'DISPUTED',
    waktu_lapor: '2026-11-21 21:15:00',
    },
    {
    id_laporan: 300,
    id_sesi: 895,
    kode_season: 'S1-2026',
    id_pelapor: 103,
    nama_pelapor: 'erdian_wijaya',
    tim_pemenang: 'BETA',
    skor_akhir: '0 - 2',
    bukti_url: 'https://imgur.com/scrimsync-match-895-ss.png',
    catatan: 'Pertandingan berjalan lancar tanpa kendala.',
    status_verifikasi: 'VERIFIED',
    waktu_lapor: '2026-11-21 19:40:00',
    },
];

export const INITIAL_LEADERBOARD = [
    { id_profil: 1, id_pengguna: 102, username: 'azmi_basri', role_utama: 'MID_LANER', mmr_aktif: 1790, total_match: 42, menang: 29, selisih_terakhir: 25 },
    { id_profil: 2, id_pengguna: 103, username: 'erdian_wijaya', role_utama: 'ROAMER', mmr_aktif: 1715, total_match: 38, menang: 24, selisih_terakhir: 22 },
    { id_profil: 3, id_pengguna: 105, username: 'raymond_v', role_utama: 'MID_LANER', mmr_aktif: 1680, total_match: 35, menang: 21, selisih_terakhir: -18 },
    { id_profil: 4, id_pengguna: 108, username: 'damanhuri_x', role_utama: 'JUNGLER', mmr_aktif: 1660, total_match: 31, menang: 18, selisih_terakhir: 20 },
    { id_profil: 5, id_pengguna: 107, username: 'khalifi_pro', role_utama: 'EXP_LANER', mmr_aktif: 1655, total_match: 29, menang: 17, selisih_terakhir: 21 },
    { id_profil: 6, id_pengguna: 110, username: 'irfan_net', role_utama: 'GOLD_LANER', mmr_aktif: 1645, total_match: 27, menang: 15, selisih_terakhir: -19 },
    { id_profil: 7, id_pengguna: 101, username: 'moula_zaki', role_utama: 'JUNGLER', mmr_aktif: 1640, total_match: 33, menang: 19, selisih_terakhir: 24 },
    { id_profil: 8, id_pengguna: 111, username: 'reza_aryandi', role_utama: 'EXP_LANER', mmr_aktif: 1640, total_match: 24, menang: 13, selisih_terakhir: 18 },
    { id_profil: 9, id_pengguna: 109, username: 'lukman_fmipa', role_utama: 'ROAMER', mmr_aktif: 1630, total_match: 26, menang: 14, selisih_terakhir: -17 },
    { id_profil: 10, id_pengguna: 106, username: 'fathir_aceh', role_utama: 'GOLD_LANER', mmr_aktif: 1625, total_match: 22, menang: 11, selisih_terakhir: -20 },
];

export const INITIAL_LOG_PENALTI = [
    {
    id_penalti: 701,
    id_pengguna: 104,
    username: 'toxic_dodger99',
    id_sesi: 898,
    alasan: 'DECLINED_READY_CHECK (Auto-Trigger Oracle)',
    durasi_menit: 15,
    waktu_penalti: '2026-11-21 22:35:00',
    },
];