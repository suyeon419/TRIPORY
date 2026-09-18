const express = require('express');
const router = express.Router();
const pool = require('./db');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

console.log('inquiries.js 라우터 등록 완료');

const ALLOWED_TYPES = ['general', 'account', 'bug', 'suggestion'];

// ============================
// 문의 목록 조회 API (관리자 전용)
// ============================
router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT i.inquiry_id, i.type, i.message, i.created_at, u.name, u.email
             FROM inquiries i
             JOIN users u ON i.user_id = u.user_id
             ORDER BY i.created_at DESC`
        );

        res.json({ ok: true, data: rows });
    } catch (err) {
        console.error('문의 목록 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
// 문의 등록 API
// ============================
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { type, message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ ok: false, message: '문의 내용을 입력해주세요.' });
        }

        const inquiryType = ALLOWED_TYPES.includes(type) ? type : 'general';

        await pool.query(`INSERT INTO inquiries (user_id, type, message) VALUES (?, ?, ?)`, [
            userId,
            inquiryType,
            message,
        ]);

        res.status(201).json({ ok: true, message: '문의가 접수되었습니다.' });
    } catch (err) {
        console.error('문의 등록 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

module.exports = router;
