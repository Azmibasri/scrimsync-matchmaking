-- =========================================================
-- SCRIMSYNC - 02_seed_1000.sql (Oracle Database XE 21c)
-- Seed: 2 Admin, 200 Pemain, 200 Profil Role, 1.200 Antrean
-- =========================================================

DECLARE
    TYPE t_roles IS VARRAY(5) OF VARCHAR2(30);
    TYPE t_ids   IS TABLE OF NUMBER;

    v_roles     t_roles := t_roles('JUNGLER', 'SUPPORT', 'MID', 'GOLD', 'EXP');
    v_user_ids  t_ids   := t_ids();
    v_id        NUMBER;
    v_role      VARCHAR2(30);
    v_mmr       NUMBER;
    v_status    VARCHAR2(20);
BEGIN
    -- 1. Seed 2 Akun Admin/Moderator
    INSERT INTO Pengguna (username, email, password_hash, role_sistem)
    VALUES ('admin_utama', 'admin1@scrimsync.test', 'hash_demo_admin_1', 'ADMIN');

    INSERT INTO Pengguna (username, email, password_hash, role_sistem)
    VALUES ('moderator_scrim', 'admin2@scrimsync.test', 'hash_demo_admin_2', 'ADMIN');

    -- 2. Seed 200 Pemain & Profil Role + MMR (rentang 800 - 2400)
    FOR i IN 1..200 LOOP
        INSERT INTO Pengguna (username, email, password_hash, role_sistem)
        VALUES (
            'player_' || LPAD(i, 3, '0'),
            'player_' || LPAD(i, 3, '0') || '@scrimsync.test',
            'hash_demo_player',
            'PEMAIN'
        )
        RETURNING id_pengguna INTO v_id;

        v_user_ids.EXTEND;
        v_user_ids(v_user_ids.COUNT) := v_id;

        v_role := v_roles(MOD(i, 5) + 1);
        v_mmr  := 800 + MOD(i * 37, 1601);

        INSERT INTO Profil_Game_Role (id_pengguna, nama_game, role_utama, mmr_aktif)
        VALUES (v_id, 'Mobile Legends', v_role, v_mmr);
    END LOOP;

    -- 3. Seed 1.200 Baris Antrean_Matchmaking (untuk uji Index & EXPLAIN PLAN)
    FOR j IN 1..1200 LOOP
        v_id   := v_user_ids(MOD(j, v_user_ids.COUNT) + 1);
        v_role := v_roles(MOD(j, 5) + 1);
        v_mmr  := 800 + MOD(j * 53, 1601);

        IF MOD(j, 10) IN (0, 1) THEN
            v_status := 'MENUNGGU';
        ELSIF MOD(j, 10) = 2 THEN
            v_status := 'BATAL';
        ELSE
            v_status := 'DIPASANGKAN';
        END IF;

        INSERT INTO Antrean_Matchmaking (id_pengguna, role_pilihan, mmr_saat_ini, status_antrean, masuk_pada)
        VALUES (v_id, v_role, v_mmr, v_status, SYSDATE - (MOD(j, 30) / 1440));
    END LOOP;

    COMMIT;

    -- Perbarui statistik tabel agar Oracle Optimizer akurat saat EXPLAIN PLAN
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'ANTREAN_MATCHMAKING');
END;