const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('../routes/db');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ ok: false, message: '토큰이 없습니다.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ ok: false, message: '유효하지 않은 토큰입니다.' });
        }

        req.user = decoded; // decoded = { user_id, email, role, ... }
        next();
    });
};

// verifyToken 다음에 붙여서 사용 — 관리자만 통과시킴
// 토큰에 담긴 role은 로그인 시점 기준이라 이후 권한이 바뀌어도 반영이 안 될 수 있으므로,
// 매 요청마다 DB에서 최신 role을 조회해서 판단한다.
exports.requireAdmin = async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT role FROM users WHERE user_id = ?', [req.user?.user_id]);
        if (rows.length === 0 || rows[0].role !== 'admin') {
            return res.status(403).json({ ok: false, message: '관리자만 접근할 수 있습니다.' });
        }
        next();
    } catch (err) {
        console.error('관리자 권한 확인 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
};
