-- =========================================================
-- SCRIMSYNC - 04_index_explain.sql
-- Uji EXPLAIN PLAN Sebelum & Sesudah Composite Index
-- =========================================================

SET LINESIZE 150
SET PAGESIZE 100

-- 1. EXPLAIN PLAN SEBELUM COMPOSITE INDEX (Full Table Scan)
PROMPT === SEBELUM COMPOSITE INDEX ===
EXPLAIN PLAN FOR
SELECT id_antrean, id_pengguna, role_pilihan, mmr_saat_ini
FROM Antrean_Matchmaking
WHERE status_antrean = 'MENUNGGU'
  AND role_pilihan = 'JUNGLER'
  AND mmr_saat_ini BETWEEN 1200 AND 1600;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- 2. BUAT COMPOSITE INDEX SESUAI RANCANGAN SCRIMSYNC
CREATE INDEX idx_antrean_match
ON Antrean_Matchmaking (status_antrean, role_pilihan, mmr_saat_ini);

-- Perbarui statistik agar Oracle Optimizer langsung mengenali index baru
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'ANTREAN_MATCHMAKING');
END;
/

-- 3. EXPLAIN PLAN SESUDAH COMPOSITE INDEX (Index Range Scan)
PROMPT === SESUDAH COMPOSITE INDEX ===
EXPLAIN PLAN FOR
SELECT id_antrean, id_pengguna, role_pilihan, mmr_saat_ini
FROM Antrean_Matchmaking
WHERE status_antrean = 'MENUNGGU'
  AND role_pilihan = 'JUNGLER'
  AND mmr_saat_ini BETWEEN 1200 AND 1600;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);