// Konstanta tunggal alamat server Express Erdian (Hari 6 cukup ubah USE_MOCK menjadi false)
export const API_BASE = 'http://localhost:3000';
export const USE_MOCK = true;

/**
 * Pemetaan kode status HTTP dari Backend Erdian (kirimError) ke pesan UI yang informatif.
 */
export function mapHttpErrorMessage(status, serverMessage) {
    if (serverMessage) return serverMessage;
    switch (status) {
    case 400:
        return 'Data permintaan tidak valid atau kolom wajib belum lengkap (HTTP 400 Bad Request).';
    case 403:
        return 'Akses ditolak: Akun Anda sedang dalam masa cooldown penalti dodge (HTTP 403 Forbidden).';
    case 404:
        return 'Sesi pertandingan atau data yang diminta tidak ditemukan di database (HTTP 404 Not Found).';
    case 409:
        return 'Konflik transaksi: Slot role sudah diambil pemain lain atau data duplikat terdeteksi (HTTP 409 Conflict).';
    case 503:
        return 'Server database Oracle XE sedang sibuk / pool koneksi penuh. Silakan coba sesaat lagi (HTTP 503).';
    default:
        return `Terjadi kesalahan internal pada server (HTTP ${status || 500}).`;
    }
}

/**
 * Wrapper fetch standar untuk pemanggilan REST API Express + Oracle.
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
    headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    },
    ...options,
    };

    const response = await fetch(url, config);
    let data = null;
    try {
    data = await response.json();
    } catch {
    data = null;
    }

    if (!response.ok) {
    const error = new Error(mapHttpErrorMessage(response.status, data?.message || data?.error));
    error.status = response.status;
    error.payload = data;
    throw error;
    }

    return { status: response.status, data };
}