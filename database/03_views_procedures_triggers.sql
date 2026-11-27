-- =========================================================
-- SCRIMSYNC - 03_views_procedures_triggers.sql
-- 2 Views, 2 Stored Procedures, dan 4 Triggers (Oracle 21c)
-- =========================================================

-- 1. VIEW: Leaderboard MMR Real-Time
CREATE OR REPLACE VIEW v_leaderboard_mmr AS
SELECT
    RANK() OVER (ORDER BY pgr.mmr_aktif DESC, p.username ASC) AS peringkat,
    p.id_pengguna,
    p.username,
    pgr.nama_game,
    pgr.role_utama,
    pgr.mmr_aktif,
    pgr.diperbarui_pada
FROM Profil_Game_Role pgr
JOIN Pengguna p ON p.id_pengguna = pgr.id_pengguna
WHERE p.role_sistem = 'PEMAIN';
/

-- 2. VIEW: Daftar Lobby Aktif & Ketersediaan Slot
CREATE OR REPLACE VIEW v_lobby_aktif AS
SELECT
    sp.id_sesi,
    sp.kode_season,
    sp.status_sesi,
    sp.kuota_maksimal,
    COUNT(pm.id_partisipan) AS jumlah_partisipan,
    (sp.kuota_maksimal - COUNT(pm.id_partisipan)) AS sisa_slot,
    sp.rata_rata_mmr,
    sp.batas_ready_check,
    sp.dibuat_pada
FROM Sesi_Pertandingan sp
LEFT JOIN Partisipan_Match pm ON pm.id_sesi = sp.id_sesi
WHERE sp.status_sesi IN ('READY_CHECK', 'BERLANGSUNG')
GROUP BY
    sp.id_sesi, sp.kode_season, sp.status_sesi,
    sp.kuota_maksimal, sp.rata_rata_mmr,
    sp.batas_ready_check, sp.dibuat_pada;
/

-- 3. TRIGGER: Catat Otomatis Perubahan MMR ke Riwayat_MMR
CREATE OR REPLACE TRIGGER trg_catat_riwayat_mmr
AFTER UPDATE OF mmr_aktif ON Profil_Game_Role
FOR EACH ROW
WHEN (NVL(OLD.mmr_aktif, 0) <> NVL(NEW.mmr_aktif, 0))
DECLARE
    v_id_sesi     Sesi_Pertandingan.id_sesi%TYPE;
    v_kode_season Sesi_Pertandingan.kode_season%TYPE;
BEGIN
    SELECT MAX(id_sesi)
    INTO v_id_sesi
    FROM Partisipan_Match
    WHERE id_pengguna = :NEW.id_pengguna;

    IF v_id_sesi IS NOT NULL THEN
        SELECT kode_season
        INTO v_kode_season
        FROM Sesi_Pertandingan
        WHERE id_sesi = v_id_sesi;

        INSERT INTO Riwayat_MMR (
            id_pengguna, id_sesi, kode_season,
            mmr_lama, mmr_baru, selisih
        ) VALUES (
            :NEW.id_pengguna, v_id_sesi, v_kode_season,
            :OLD.mmr_aktif, :NEW.mmr_aktif, (:NEW.mmr_aktif - :OLD.mmr_aktif)
        );
    END IF;
END;
/

-- 4. TRIGGER: Anti-Dodge & Penalty Cooldown Otomatis saat Pemain DECLINED
CREATE OR REPLACE TRIGGER trg_penalti_dodge
AFTER UPDATE OF status_konfirmasi ON Partisipan_Match
FOR EACH ROW
WHEN (NEW.status_konfirmasi = 'DECLINED' AND OLD.status_konfirmasi <> 'DECLINED')
BEGIN
    INSERT INTO Log_Penalti (id_pengguna, id_sesi, alasan, durasi_menit)
    VALUES (:NEW.id_pengguna, :NEW.id_sesi, 'Menolak atau gagal konfirmasi ready check (dodge)', 15);

    UPDATE Pengguna
    SET cooldown_hingga = SYSDATE + (15 / 1440)
    WHERE id_pengguna = :NEW.id_pengguna;

    UPDATE Sesi_Pertandingan
    SET status_sesi = 'DIBUBARKAN'
    WHERE id_sesi = :NEW.id_sesi
      AND status_sesi = 'READY_CHECK';
END;
/

-- 5. TRIGGER: Proteksi Permanen Log Riwayat_MMR (Blokir UPDATE/DELETE)
CREATE OR REPLACE TRIGGER trg_blokir_ubah_riwayat_mmr
BEFORE UPDATE OR DELETE ON Riwayat_MMR
FOR EACH ROW
BEGIN
    RAISE_APPLICATION_ERROR(-20001, 'Log Riwayat_MMR bersifat permanen dan tidak boleh diubah atau dihapus.');
END;
/

-- 6. TRIGGER: Proteksi Permanen Log_Penalti (Blokir UPDATE/DELETE)
CREATE OR REPLACE TRIGGER trg_blokir_ubah_log_penalti
BEFORE UPDATE OR DELETE ON Log_Penalti
FOR EACH ROW
BEGIN
    RAISE_APPLICATION_ERROR(-20002, 'Log_Penalti bersifat permanen dan tidak boleh diubah atau dihapus.');
END;
/

-- 7. STORED PROCEDURE: Pasangkan Match dengan Row-Level Locking
-- Catatan: COMMIT/ROLLBACK dikendalikan oleh pemanggil (Backend/uji transaksi)
CREATE OR REPLACE PROCEDURE sp_pasangkan_match (
    p_role_pilihan IN  VARCHAR2,
    p_mmr_min      IN  NUMBER,
    p_mmr_max      IN  NUMBER,
    p_kuota        IN  NUMBER DEFAULT 2,
    p_id_sesi_out  OUT NUMBER
) AS
    CURSOR c_antrean IS
        SELECT a.id_antrean, a.id_pengguna, a.role_pilihan, a.mmr_saat_ini
        FROM Antrean_Matchmaking a
        JOIN Pengguna p ON p.id_pengguna = a.id_pengguna
        WHERE a.status_antrean = 'MENUNGGU'
          AND a.role_pilihan = p_role_pilihan
          AND a.mmr_saat_ini BETWEEN p_mmr_min AND p_mmr_max
          AND (p.cooldown_hingga IS NULL OR p.cooldown_hingga <= SYSDATE)
        ORDER BY a.masuk_pada ASC
        FOR UPDATE OF a.status_antrean SKIP LOCKED;

    TYPE t_antrean_tab IS TABLE OF c_antrean%ROWTYPE;
    v_kandidat  t_antrean_tab := t_antrean_tab();
    v_row       c_antrean%ROWTYPE;
    v_total_mmr NUMBER := 0;
    v_tim       VARCHAR2(10);
BEGIN
    OPEN c_antrean;
    LOOP
        FETCH c_antrean INTO v_row;
        EXIT WHEN c_antrean%NOTFOUND OR v_kandidat.COUNT = p_kuota;
        v_kandidat.EXTEND;
        v_kandidat(v_kandidat.COUNT) := v_row;
        v_total_mmr := v_total_mmr + v_row.mmr_saat_ini;
    END LOOP;
    CLOSE c_antrean;

    IF v_kandidat.COUNT < p_kuota THEN
        RAISE_APPLICATION_ERROR(-20010, 'Pemain memenuhi syarat belum cukup untuk membentuk sesi.');
    END IF;

    INSERT INTO Sesi_Pertandingan (kode_season, status_sesi, kuota_maksimal, rata_rata_mmr)
    VALUES ('S1-2026', 'READY_CHECK', p_kuota, ROUND(v_total_mmr / p_kuota))
    RETURNING id_sesi INTO p_id_sesi_out;

    FOR i IN 1..v_kandidat.COUNT LOOP
        v_tim := CASE WHEN MOD(i, 2) = 1 THEN 'TIM_A' ELSE 'TIM_B' END;

        INSERT INTO Partisipan_Match (id_sesi, id_pengguna, tim, role_diambil, status_konfirmasi)
        VALUES (p_id_sesi_out, v_kandidat(i).id_pengguna, v_tim, v_kandidat(i).role_pilihan, 'PENDING');

        UPDATE Antrean_Matchmaking
        SET status_antrean = 'DIPASANGKAN'
        WHERE id_antrean = v_kandidat(i).id_antrean;
    END LOOP;
END;
/

-- 8. STORED PROCEDURE: Kalkulasi & Update MMR Atomik Pasca-Pertandingan
CREATE OR REPLACE PROCEDURE sp_update_mmr (
    p_id_sesi      IN NUMBER,
    p_tim_pemenang IN VARCHAR2,
    p_delta_mmr    IN NUMBER DEFAULT 25
) AS
    v_status Sesi_Pertandingan.status_sesi%TYPE;
BEGIN
    SELECT status_sesi
    INTO v_status
    FROM Sesi_Pertandingan
    WHERE id_sesi = p_id_sesi
    FOR UPDATE;

    IF v_status = 'SELESAI' THEN
        RAISE_APPLICATION_ERROR(-20020, 'Sesi pertandingan ini sudah selesai dan MMR sudah dihitung.');
    END IF;

    FOR rec IN (
        SELECT id_pengguna, tim, role_diambil
        FROM Partisipan_Match
        WHERE id_sesi = p_id_sesi
    ) LOOP
        IF rec.tim = p_tim_pemenang THEN
            UPDATE Profil_Game_Role
            SET mmr_aktif = mmr_aktif + p_delta_mmr,
                diperbarui_pada = SYSDATE
            WHERE id_pengguna = rec.id_pengguna
              AND role_utama = rec.role_diambil;
        ELSE
            UPDATE Profil_Game_Role
            SET mmr_aktif = GREATEST(0, mmr_aktif - p_delta_mmr),
                diperbarui_pada = SYSDATE
            WHERE id_pengguna = rec.id_pengguna
              AND role_utama = rec.role_diambil;
        END IF;
    END LOOP;

    UPDATE Sesi_Pertandingan
    SET status_sesi = 'SELESAI'
    WHERE id_sesi = p_id_sesi;
END;
/