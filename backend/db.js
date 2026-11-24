const oracledb = require('oracledb');
require('dotenv').config();

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function initPool() {
    try{
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            connectString: process.env.DB_CONNECT,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1
        });
        console.log('Oracle Connection (Thin Mode) berhasil dibuat!');
    }catch (err) {
        console.log('Gagal membuat Connection Pool: ' , err);
        process.exit(1);
    }
}
async function getConnection() {
    return await oracledb.getConnection();
}
module.exports = {initPool, getConnection};