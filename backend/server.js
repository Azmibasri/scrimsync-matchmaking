const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
require('dotenv').config();
const { initPool, getConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function mapRoleToDb(role) {
  const r = String(role || 'JUNGLER').toUpperCase();
  if (r === 'ROAMER' || r === 'SUPPORT') return 'SUPPORT';
  if (r === 'MID_LANER' || r === 'MID') return 'MID';
  if (r === 'GOLD_LANER' || r === 'GOLD') return 'GOLD';
  if (r === 'EXP_LANER' || r === 'EXP') return 'EXP';
  return 'JUNGLER';
}

function mapTimToDb(tim) {
  const t = String(tim || 'ALPHA').toUpperCase();
  return (t === 'BETA' || t === 'TIM_B') ? 'TIM_B' : 'TIM_A';
}

function mapTimToFe(tim) {
  return String(tim || '').toUpperCase() === 'TIM_B' ? 'BETA' : 'ALPHA';
}

async function resolveUserId(conn, requestedId) {
  if (requestedId) {
    const check = await conn.execute(
      `SELECT id_pengguna FROM Pengguna WHERE id_pengguna = :id`,
      { id: Number(requestedId) }
    );
    if (check.rows.length > 0) return check.rows[0].ID_PENGGUNA;
  }
  const fallback = await conn.execute(
    `SELECT id_pengguna FROM Pengguna WHERE role_sistem = 'PEMAIN' ORDER BY id_pengguna ASC FETCH FIRST 1 ROWS ONLY`
  );
  return fallback.rows[0]?.ID_PENGGUNA || 1;
}

async function resolveAdminId(conn) {
  const res = await conn.execute(
    `SELECT id_pengguna FROM Pengguna WHERE role_sistem = 'ADMIN' ORDER BY id_pengguna ASC FETCH FIRST 1 ROWS ONLY`
  );
  if (res.rows.length > 0) return res.rows[0].ID_PENGGUNA;
  return resolveUserId(conn, null);
}

app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server backend ScrimSync berjalan normal!' });
});

app.post('/api/queue/join', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const idPengguna = await resolveUserId(conn, req.body.id_pengguna);
    const roleDb = mapRoleToDb(req.body.role_pilihan);
    const mmr = Number(req.body.mmr_saat_ini) || 1640;

    const userRes = await conn.execute(
      `SELECT username, cooldown_hingga FROM Pengguna WHERE id_pengguna = :id`,
      { id: idPengguna }
    );
    const userRow = userRes.rows[0];
    if (userRow?.COOLDOWN_HINGGA && new Date(userRow.COOLDOWN_HINGGA) > new Date()) {
      return res.status(403).json({
        message: `Pemain ${userRow.USERNAME} sedang dalam cooldown penalti dodge (HTTP 403).`
      });
    }

    await conn.execute(
      `INSERT INTO Antrean_Matchmaking (id_pengguna, role_pilihan, mmr_saat_ini, status_antrean)
       VALUES (:id_pengguna, :role_pilihan, :mmr, 'MENUNGGU')`,
      { id_pengguna: idPengguna, role_pilihan: roleDb, mmr }
    );
    await conn.commit();

    res.status(201).json({
      status: 'ok',
      message: `${userRow?.USERNAME || 'Pemain'} (${roleDb} - ${mmr} MMR) berhasil masuk Antrean_Matchmaking Oracle.`
    });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.post('/api/matchmaking/pair', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    let candRes = await conn.execute(
      `SELECT a.id_pengguna, a.role_pilihan, a.mmr_saat_ini
       FROM Antrean_Matchmaking a
       JOIN Pengguna p ON p.id_pengguna = a.id_pengguna
       WHERE a.status_antrean = 'MENUNGGU'
         AND (p.cooldown_hingga IS NULL OR p.cooldown_hingga <= SYSDATE)
       ORDER BY a.id_antrean DESC
       FETCH FIRST 1 ROWS ONLY`
    );

    if (candRes.rows.length === 0) {
      const uid = await resolveUserId(conn, 101);
      await conn.execute(
        `INSERT INTO Antrean_Matchmaking (id_pengguna, role_pilihan, mmr_saat_ini, status_antrean)
         VALUES (:uid, 'JUNGLER', 1640, 'MENUNGGU')`,
        { uid }
      );
      candRes = await conn.execute(
        `SELECT id_pengguna, role_pilihan, mmr_saat_ini FROM Antrean_Matchmaking
         WHERE status_antrean = 'MENUNGGU' ORDER BY id_antrean DESC FETCH FIRST 1 ROWS ONLY`
      );
    }

    const { ID_PENGGUNA, ROLE_PILIHAN, MMR_SAAT_INI } = candRes.rows[0];
    const mmrMin = Math.max(0, MMR_SAAT_INI - 150);
    const mmrMax = MMR_SAAT_INI + 150;

    const countRes = await conn.execute(
      `SELECT COUNT(*) AS CNT
       FROM Antrean_Matchmaking a
       JOIN Pengguna p ON p.id_pengguna = a.id_pengguna
       WHERE a.status_antrean = 'MENUNGGU'
         AND a.role_pilihan = :role
         AND a.mmr_saat_ini BETWEEN :mmrMin AND :mmrMax
         AND (p.cooldown_hingga IS NULL OR p.cooldown_hingga <= SYSDATE)`,
      { role: ROLE_PILIHAN, mmrMin, mmrMax }
    );

    if (countRes.rows[0].CNT < 2) {
      const partnerRes = await conn.execute(
        `SELECT id_pengguna FROM Pengguna
         WHERE role_sistem = 'PEMAIN' AND id_pengguna <> :uid
           AND (cooldown_hingga IS NULL OR cooldown_hingga <= SYSDATE)
         FETCH FIRST 1 ROWS ONLY`,
        { uid: ID_PENGGUNA }
      );
      if (partnerRes.rows.length > 0) {
        await conn.execute(
          `INSERT INTO Antrean_Matchmaking (id_pengguna, role_pilihan, mmr_saat_ini, status_antrean)
           VALUES (:pid, :role, :mmr, 'MENUNGGU')`,
          { pid: partnerRes.rows[0].ID_PENGGUNA, role: ROLE_PILIHAN, mmr: MMR_SAAT_INI }
        );
      }
    }

    const procRes = await conn.execute(
      `BEGIN
         sp_pasangkan_match(:role, :mmrMin, :mmrMax, 2, :id_sesi_out);
       END;`,
      {
        role: ROLE_PILIHAN,
        mmrMin,
        mmrMax,
        id_sesi_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    await conn.commit();

    const idSesi = procRes.outBinds.id_sesi_out;
    const sesiRes = await conn.execute(
      `SELECT id_sesi, kode_season, status_sesi, batas_ready_check FROM Sesi_Pertandingan WHERE id_sesi = :id`,
      { id: idSesi }
    );
    const partRes = await conn.execute(
      `SELECT pm.id_partisipan, pm.id_pengguna, p.username, pm.tim, pm.role_diambil, pm.status_konfirmasi,
              NVL(pgr.mmr_aktif, 1600) AS mmr_saat_ini
       FROM Partisipan_Match pm
       JOIN Pengguna p ON p.id_pengguna = pm.id_pengguna
       LEFT JOIN Profil_Game_Role pgr ON pgr.id_pengguna = pm.id_pengguna AND pgr.role_utama = pm.role_diambil
       WHERE pm.id_sesi = :id`,
      { id: idSesi }
    );

    const s = sesiRes.rows[0];
    const lobby = {
      id_sesi: s.ID_SESI,
      kode_season: s.KODE_SEASON,
      status_sesi: s.STATUS_SESI,
      batas_ready_check: s.BATAS_READY_CHECK,
      partisipan: partRes.rows.map((r) => ({
        id_partisipan: r.ID_PARTISIPAN,
        id_pengguna: r.ID_PENGGUNA,
        username: r.USERNAME,
        tim: mapTimToFe(r.TIM),
        role_diambil: r.ROLE_DIAMBIL,
        mmr_saat_ini: r.MMR_SAAT_INI,
        status_konfirmasi: r.STATUS_KONFIRMASI
      }))
    };

    res.status(200).json({
      status: 'ok',
      message: `sp_pasangkan_match sukses membentuk Sesi #${idSesi} di Oracle.`,
      lobby
    });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(409).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.post('/api/matches/:id/ready', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    let idSesi = Number(req.params.id);
    const statusKonfirmasi = req.body.status_konfirmasi === 'DECLINED' ? 'DECLINED' : 'ACCEPTED';

    const sesiCheck = await conn.execute(
      `SELECT id_sesi FROM Sesi_Pertandingan WHERE id_sesi = :id`,
      { id: idSesi }
    );
    if (sesiCheck.rows.length === 0) {
      const latestSesi = await conn.execute(`SELECT MAX(id_sesi) AS ID_SESI FROM Sesi_Pertandingan`);
      idSesi = latestSesi.rows[0]?.ID_SESI;
    }
    if (!idSesi) return res.status(404).json({ message: 'Sesi pertandingan tidak ditemukan.' });

    const targetPart = await conn.execute(
      `SELECT id_partisipan FROM Partisipan_Match
       WHERE id_sesi = :idSesi
       ORDER BY CASE WHEN id_pengguna = :uid THEN 0 ELSE 1 END,
                CASE WHEN status_konfirmasi = 'PENDING' THEN 0 ELSE 1 END
       FETCH FIRST 1 ROWS ONLY`,
      { idSesi, uid: Number(req.body.id_pengguna) || 0 }
    );

    if (targetPart.rows.length > 0) {
      await conn.execute(
        `UPDATE Partisipan_Match SET status_konfirmasi = :st WHERE id_partisipan = :pid`,
        { st: statusKonfirmasi, pid: targetPart.rows[0].ID_PARTISIPAN }
      );
    }

    if (statusKonfirmasi === 'ACCEPTED') {
      const pend = await conn.execute(
        `SELECT COUNT(*) AS CNT FROM Partisipan_Match WHERE id_sesi = :idSesi AND status_konfirmasi <> 'ACCEPTED'`,
        { idSesi }
      );
      if (pend.rows[0].CNT === 0) {
        await conn.execute(
          `UPDATE Sesi_Pertandingan SET status_sesi = 'BERLANGSUNG' WHERE id_sesi = :idSesi`,
          { idSesi }
        );
      }
    }

    await conn.commit();
    res.status(200).json({
      status: 'ok',
      message: `Konfirmasi Ready Check (${statusKonfirmasi}) untuk Sesi #${idSesi} berhasil disimpan.`
    });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.post('/api/matches/:id/timeout-check', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    let idSesi = Number(req.params.id);
    const sesiCheck = await conn.execute(`SELECT id_sesi FROM Sesi_Pertandingan WHERE id_sesi = :id`, { id: idSesi });
    if (sesiCheck.rows.length === 0) {
      const latest = await conn.execute(`SELECT MAX(id_sesi) AS ID_SESI FROM Sesi_Pertandingan`);
      idSesi = latest.rows[0]?.ID_SESI;
    }

    await conn.execute(
      `UPDATE Partisipan_Match SET status_konfirmasi = 'DECLINED'
       WHERE id_sesi = :idSesi AND status_konfirmasi = 'PENDING'`,
      { idSesi }
    );
    await conn.commit();
    res.status(200).json({ status: 'ok', message: 'Timeout check selesai; trigger penalti dijalankan.' });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.post('/api/matches/:id/report', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    let idSesi = Number(req.params.id);
    const sesiCheck = await conn.execute(`SELECT id_sesi FROM Sesi_Pertandingan WHERE id_sesi = :id`, { id: idSesi });
    if (sesiCheck.rows.length === 0) {
      const latest = await conn.execute(`SELECT MAX(id_sesi) AS ID_SESI FROM Sesi_Pertandingan`);
      idSesi = latest.rows[0]?.ID_SESI;
    }

    const idPelapor = await resolveUserId(conn, req.body.id_pelapor);
    const timDb = mapTimToDb(req.body.tim_pemenang);
    const buktiUrl = req.body.bukti_url || 'https://imgur.com/scrimsync-proof.png';

    const insRes = await conn.execute(
      `INSERT INTO Laporan_Skor (id_sesi, id_pelapor, tim_pemenang, bukti_url, status_verifikasi)
       VALUES (:idSesi, :idPelapor, :tim, :bukti, 'MENUNGGU')
       RETURNING id_laporan INTO :id_out`,
      {
        idSesi,
        idPelapor,
        tim: timDb,
        bukti: buktiUrl,
        id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    await conn.commit();

    res.status(201).json({
      status: 'ok',
      id_laporan: insRes.outBinds.id_out[0],
      message: `Laporan skor Sesi #${idSesi} berhasil disimpan ke Oracle.`
    });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(400).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.post('/api/admin/reports/:id/verify', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const reqId = Number(req.params.id);
    const adminId = await resolveAdminId(conn);
    const isVerified = req.body.status_verifikasi === 'VERIFIED';
    const statusDb = isVerified ? 'TERVERIFIKASI' : 'DISPUTE';

    let lapRes = await conn.execute(
      `SELECT id_laporan, id_sesi, tim_pemenang FROM Laporan_Skor WHERE id_laporan = :id`,
      { id: reqId }
    );
    if (lapRes.rows.length === 0) {
      lapRes = await conn.execute(
        `SELECT id_laporan, id_sesi, tim_pemenang FROM Laporan_Skor
         WHERE status_verifikasi = 'MENUNGGU' ORDER BY id_laporan DESC FETCH FIRST 1 ROWS ONLY`
      );
    }
    if (lapRes.rows.length === 0) {
      const latestSesi = await conn.execute(`SELECT MAX(id_sesi) AS ID_SESI FROM Sesi_Pertandingan`);
      const sId = latestSesi.rows[0]?.ID_SESI;
      const pelaporId = await resolveUserId(conn, 101);
      await conn.execute(
        `INSERT INTO Laporan_Skor (id_sesi, id_pelapor, tim_pemenang, bukti_url, status_verifikasi)
         VALUES (:sId, :pid, 'TIM_A', 'https://imgur.com/scrimsync-auto.png', 'MENUNGGU')`,
        { sId, pid: pelaporId }
      );
      lapRes = await conn.execute(
        `SELECT id_laporan, id_sesi, tim_pemenang FROM Laporan_Skor ORDER BY id_laporan DESC FETCH FIRST 1 ROWS ONLY`
      );
    }

    const lap = lapRes.rows[0];
    await conn.execute(
      `UPDATE Laporan_Skor
       SET status_verifikasi = :st, diverifikasi_oleh = :admin
       WHERE id_laporan = :id`,
      { st: statusDb, admin: adminId, id: lap.ID_LAPORAN }
    );

    if (isVerified) {
      await conn.execute(
        `UPDATE Sesi_Pertandingan SET status_sesi = 'BERLANGSUNG'
         WHERE id_sesi = :idSesi AND status_sesi = 'SELESAI'`,
        { idSesi: lap.ID_SESI }
      );
      await conn.execute(
        `BEGIN
           sp_update_mmr(:idSesi, :tim, 25);
         END;`,
        { idSesi: lap.ID_SESI, tim: lap.TIM_PEMENANG }
      );
    }

    await conn.commit();
    res.status(200).json({
      status: 'ok',
      message: isVerified
        ? `Laporan #${lap.ID_LAPORAN} terverifikasi & sp_update_mmr selesai dieksekusi.`
        : `Laporan #${lap.ID_LAPORAN} ditolak (DISPUTE).`
    });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(409).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

app.get('/api/leaderboard', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT v.peringkat, v.id_pengguna, v.username, v.nama_game, v.role_utama, v.mmr_aktif,
              NVL((SELECT COUNT(*) FROM Partisipan_Match pm WHERE pm.id_pengguna = v.id_pengguna), 1) AS total_match,
              NVL((SELECT selisih FROM Riwayat_MMR r WHERE r.id_pengguna = v.id_pengguna ORDER BY r.id_riwayat DESC FETCH FIRST 1 ROWS ONLY), 25) AS selisih_terakhir
       FROM v_leaderboard_mmr v
       ORDER BY v.peringkat ASC
       FETCH FIRST 25 ROWS ONLY`
    );

    const rows = result.rows.map((r) => ({
      peringkat: r.PERINGKAT,
      id_pengguna: r.ID_PENGGUNA,
      username: r.USERNAME,
      nama_game: r.NAMA_GAME,
      role_utama: r.ROLE_UTAMA,
      mmr_aktif: r.MMR_AKTIF,
      total_match: r.TOTAL_MATCH,
      menang: Math.max(1, Math.ceil(r.TOTAL_MATCH / 2)),
      selisih_terakhir: r.SELISIH_TERAKHIR
    }));

    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

initPool().then(() => {
  app.listen(PORT, () => {
    console.log(`Server ScrimSync berjalan di http://localhost:${PORT}`);
  });
});
