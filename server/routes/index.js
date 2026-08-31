const express = require('express');
const router = express.Router();
const pool = require('./db');

// 기본 페이지
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT NOW() AS time');
        res.send(`DB 연결 성공 ✅ 현재 시간: ${rows[0].time}`);
    } catch (err) {
        console.error('DB 연결 실패 ❌', err);
        res.status(500).send('DB 연결 오류');
    }
});

module.exports = router;
