const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('./db');
require('dotenv').config();
const { verifyToken } = require('../middlewares/auth');

// ============================
//   회원가입 (Register)
// ============================
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('유효한 이메일 형식이 아닙니다.'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('비밀번호는 8자 이상이어야 합니다.')
            .matches(/[A-Za-z]/)
            .withMessage('비밀번호는 영문을 포함해야 합니다.')
            .matches(/\d/)
            .withMessage('비밀번호는 숫자를 포함해야 합니다.'),
        body('name').trim().notEmpty().withMessage('이름은 필수입니다.'),
        body('phone').optional().isLength({ max: 20 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });

        const { email, password, name, phone } = req.body;

        try {
            const [dup] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
            if (dup.length > 0) return res.status(409).json({ ok: false, message: '이미 사용중인 이메일입니다.' });

            const hashed = await bcrypt.hash(password, 10);
            const [result] = await pool.query(
                `INSERT INTO users (email, password, name, phone)
         VALUES (?, ?, ?, ?)`,
                [email, hashed, name, phone ?? null]
            );

            res.status(201).json({
                ok: true,
                user: { user_id: result.insertId, email, name, phone: phone ?? null },
            });
        } catch (err) {
            console.error('회원가입 오류:', err);
            if (err.code === 'ER_DUP_ENTRY')
                return res.status(409).json({ ok: false, message: '이미 사용중인 이메일입니다.' });
            res.status(500).json({ ok: false, message: '서버 오류' });
        }
    }
);

// ============================
//   로그인 (Login)
// ============================
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('이메일 형식이 올바르지 않습니다.'),
        body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });

        const { email, password } = req.body;

        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) return res.status(401).json({ ok: false, message: '존재하지 않는 이메일입니다.' });

            const user = rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ ok: false, message: '비밀번호가 일치하지 않습니다.' });

            // ✅ 로그인 시간 & IP
            const loginTime = new Date();
            const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

            // ✅ 로그인 로그 기록
            await pool.query(
                `INSERT INTO login_logs (user_id, login_time, ip_address)
         VALUES (?, ?, ?)`,
                [user.user_id, loginTime, ipAddress]
            );

            // ✅ JWT 발급
            const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '1d',
            });

            // ✅ 응답
            res.status(200).json({
                ok: true,
                message: '로그인 성공',
                token,
                user: {
                    user_id: user.user_id,
                    name: user.name,
                    email: user.email,
                },
            });
        } catch (err) {
            console.error('로그인 오류:', err);
            res.status(500).json({ ok: false, message: '서버 오류' });
        }
    }
);

// ============================
//   로그아웃 (Logout)
// ============================
router.post('/logout', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        // 1️⃣ 사용자의 가장 최근 로그인 로그 찾기
        const [rows] = await pool.query(
            `SELECT log_id FROM login_logs
       WHERE user_id = ?
       ORDER BY log_id DESC
       LIMIT 1`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(400).json({ ok: false, message: '로그인 기록이 없습니다.' });
        }

        const logId = rows[0].log_id;
        const logoutTime = new Date();

        // 2️⃣ 로그아웃 시간 업데이트
        await pool.query(
            `UPDATE login_logs
       SET logout_time = ?
       WHERE log_id = ?`,
            [logoutTime, logId]
        );

        res.json({ ok: true, message: '로그아웃 완료', logout_time: logoutTime });
    } catch (err) {
        console.error('로그아웃 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   내 프로필 보기 (Get Profile)
// ============================
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [rows] = await pool.query(
            `SELECT user_id, email, name, phone, created_at 
       FROM users 
       WHERE user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({
            ok: true,
            user: rows[0],
        });
    } catch (err) {
        console.error('프로필 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   회원 정보 수정
// ============================
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { name, phone, password } = req.body;

        // 비밀번호는 해싱 후 업데이트
        let updateQuery = 'UPDATE users SET ';
        const params = [];

        if (name) {
            updateQuery += 'name = ?, ';
            params.push(name);
        }
        if (phone) {
            updateQuery += 'phone = ?, ';
            params.push(phone);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += 'password = ?, ';
            params.push(hashedPassword);
        }

        // 마지막 쉼표 제거
        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ' WHERE user_id = ?';
        params.push(userId);

        await pool.query(updateQuery, params);

        res.status(200).json({ ok: true, message: '회원 정보가 수정되었습니다.' });
    } catch (err) {
        console.error('회원 정보 수정 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   회원 탈퇴
// ============================
router.delete('/delete', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);

        res.status(200).json({ ok: true, message: '회원 탈퇴가 완료되었습니다.' });
    } catch (err) {
        console.error('회원 탈퇴 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   내 활동 통계 API (후기 + 일정 분리형)
// ============================
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        // 후기(Posts) 관련 통계
        const [[postCount]] = await pool.query(`SELECT COUNT(*) AS count FROM posts WHERE user_id = ?`, [userId]);

        const [[commentCount]] = await pool.query(`SELECT COUNT(*) AS count FROM comments WHERE user_id = ?`, [userId]);

        const [[likeSum]] = await pool.query(`SELECT COALESCE(SUM(likes), 0) AS count FROM posts WHERE user_id = ?`, [
            userId,
        ]);

        const [[dislikeSum]] = await pool.query(
            `SELECT COALESCE(SUM(dislikes), 0) AS count FROM posts WHERE user_id = ?`,
            [userId]
        );

        // 일정(Schedules) 관련 통계
        const [[scheduleCount]] = await pool.query(`SELECT COUNT(*) AS count FROM schedules WHERE user_id = ?`, [
            userId,
        ]);

        const [[placeCount]] = await pool.query(
            `SELECT COUNT(*) AS count 
       FROM schedule_places 
       WHERE day_id IN (
         SELECT day_id FROM schedule_days WHERE schedule_id IN (
           SELECT schedule_id FROM schedules WHERE user_id = ?
         )
       )`,
            [userId]
        );

        const points =
            postCount.count * 8 + // 글 하나 8P
            commentCount.count * 2 + // 댓글 하나 2P
            scheduleCount.count * 5 + // 일정 하나 5P
            placeCount.count * 1; // 장소 하나 1P

        res.json({
            ok: true,
            stats: {
                posts: {
                    written: postCount.count,
                    comments: commentCount.count,
                    likes: likeSum.count,
                    dislikes: dislikeSum.count,
                },
                schedules: {
                    created: scheduleCount.count,
                    places: placeCount.count,
                },
                points,
            },
        });
    } catch (err) {
        console.error('내 활동 통계 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   로그인 이력 조회 API
// ============================
router.get('/login-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [rows] = await pool.query(
            `SELECT 
         log_id,
         DATE_FORMAT(login_time, '%Y-%m-%d') AS login_time,
         DATE_FORMAT(logout_time, '%Y-%m-%d') AS logout_time,
         ip_address
       FROM login_logs
       WHERE user_id = ?
       ORDER BY log_id DESC`,
            [userId]
        );

        res.json({ ok: true, data: rows });
    } catch (err) {
        console.error('로그인 이력 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

module.exports = router;
