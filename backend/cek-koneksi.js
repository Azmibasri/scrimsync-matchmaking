const { initPool , getConnection } = require('./db');

async function tesKoneksi() {
    let conn;
    try {
        await initPool();
        conn = await getConnection;
        const result = await conn.execute('SELECT SYSDATE AS "waktu server" FROM DUAL');
        console.log('Koneksi berhasil! Waktu Oracle: ' , result.row[0]);
    } catch (err){
        console.error('Tes koneksi gagal! ', err);
    } finally {
    if (conn){
        try{
            await conn.close();
            console.log('Koneksi berhasil ditutup! ');
        }   catch  (closeErr){
            console.log('Gagal menutup koneksi' , closeErr);
            }
        }
        process.exit(0);
    } 
    
}

tesKoneksi();