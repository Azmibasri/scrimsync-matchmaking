const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initPool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/ping' , (req,res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server backend ScrimSync berjalan normal!'
    });
});

initPool().then(() =>{
    app.listen(PORT, () =>{
        console.log(`Server ScrimSync berjalan di http://localhost:${PORT}`);
    });
});