const express = require('express');
const router = express.Router();
const pool = require('./db'); // DB 연결
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('✅ posts.js 라우터 등록 완료');

// ============================
//   multer 설정
// ============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// ============================
//   후기 글 작성 API
// ============================
router.post('/', verifyToken, upload.array('images'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.user_id;
        const { title, content, region, is_advertised } = req.body;

        if (!title || !content) {
            return res.status(400).json({ ok: false, message: '제목과 내용을 입력해주세요.' });
        }

        const isAdvertisedValue = is_advertised === 'true' ? 1 : 0;

        // 1️⃣ posts 테이블에 글 저장
        const [result] = await connection.query(
            `INSERT INTO posts (user_id, title, content, region, is_advertised)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, title, content, region || null, isAdvertisedValue]
        );

        const postId = result.insertId;

        // 2️⃣ 이미지가 있다면 post_images 테이블에 저장
        if (req.files && req.files.length > 0) {
            const imageValues = req.files.map((file, index) => [
                postId,
                file.filename,
                index + 1, // 순서 지정
            ]);

            await connection.query(
                `INSERT INTO post_images (post_id, image_url, image_order)
                 VALUES ?`,
                [imageValues]
            );
        }

        await connection.commit();

        res.status(201).json({
            ok: true,
            message: '후기 글과 이미지가 함께 등록되었습니다.',
            post_id: postId,
        });
    } catch (err) {
        await connection.rollback();
        console.error('통합 업로드 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    } finally {
        connection.release();
    }
});

// ============================
//   후기 이미지 조회 API
// ============================
router.get('/:postId/images', async (req, res) => {
    try {
        const { postId } = req.params; // ✅ 제일 먼저 선언해야 함
        console.log('요청받은 postId:', postId);

        const [rows] = await pool.query(
            `SELECT image_id, image_url, image_order
       FROM post_images
       WHERE post_id = ?
       ORDER BY image_order ASC`,
            [postId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, message: '이미지가 없습니다.' });
        }

        res.status(200).json({ ok: true, images: rows });
    } catch (err) {
        console.error('이미지 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   후기 글 상세 조회 API
// ============================
router.get('/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        // 게시글 본문 가져오기
        const [postRows] = await pool.query(
            `SELECT 
                 p.post_id,
                 p.user_id,
                 p.title,
                 p.content,
                 p.region,
                 p.is_advertised,
                 DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
                 u.name AS author_name
             FROM posts p
             JOIN users u ON p.user_id = u.user_id
             WHERE p.post_id = ?`,
            [postId]
        );

        if (postRows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 게시글을 찾을 수 없습니다.' });
        }

        const post = postRows[0];

        // 게시글 이미지들 가져오기
        const [images] = await pool.query(
            `SELECT image_url, image_order
             FROM post_images
             WHERE post_id = ?
             ORDER BY image_order ASC`,
            [postId]
        );

        // 댓글 가져오기
        const [comments] = await pool.query(
            `SELECT 
                 c.comment_id, 
                 c.content, 
                 DATE_FORMAT(c.created_at, '%Y-%m-%d') AS created_at,
                 u.name AS author_name
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC`,
            [postId]
        );

        // 결과 묶어서 반환
        res.json({
            ok: true,
            data: {
                post,
                images,
                comments,
            },
        });
    } catch (err) {
        console.error('상세 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   후기 글 목록 조회 API
// ============================
router.get('/', async (req, res) => {
    try {
        const { filter, sort, region } = req.query;
        let where = 'WHERE 1=1';

        if (filter === 'noads') {
            where += ' AND p.is_advertised = 0';
        } else if (filter === 'ads') {
            where += ' AND p.is_advertised = 1';
        }

        if (region) {
            where += ` AND p.region = '${region}'`;
        }

        // ✅ 기본 정렬: 최신순(post_id DESC)
        let orderBy = 'ORDER BY p.post_id DESC';

        // ✅ 정렬 옵션
        if (sort === 'popular') {
            orderBy = 'ORDER BY p.likes DESC, p.post_id DESC';
        } else if (sort === 'disliked') {
            orderBy = 'ORDER BY p.dislikes DESC, p.post_id DESC';
        }

        const sql = `
            SELECT p.*, u.name AS author_name
            FROM posts p
            JOIN users u ON p.user_id = u.user_id
            ${where}
            ${orderBy}
        `;

        const [rows] = await pool.query(sql);
        res.status(200).json({ ok: true, data: rows });
    } catch (err) {
        console.error('후기 목록 조회 오류:', err);
        res.status(500).json({ ok: false, message: '후기 목록 조회 실패' });
    }
});

// ============================
//   후기 글 수정 API (통합형)
// ============================
router.put('/:postId', verifyToken, upload.array('images'), async (req, res) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const postId = req.params.postId;
        const userId = req.user.user_id;
        const { title, content, region, is_advertised } = req.body;

        // 🔍 본인 글인지 확인
        const [rows] = await connection.query('SELECT user_id FROM posts WHERE post_id = ?', [postId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ ok: false, message: '해당 글을 찾을 수 없습니다.' });
        }
        if (rows[0].user_id !== userId) {
            await connection.rollback();
            return res.status(403).json({ ok: false, message: '본인 글만 수정할 수 있습니다.' });
        }

        // ✅ 기존 이미지 목록 조회
        const [oldImages] = await connection.query('SELECT image_url FROM post_images WHERE post_id = ?', [postId]);

        // ✅ 실제 파일 삭제
        for (const img of oldImages) {
            const filePath = path.join(__dirname, '../uploads', img.image_url);
            fs.unlink(filePath, (err) => {
                if (err) console.warn(`⚠️ 이미지 파일 삭제 실패: ${img.image_url}`);
            });
        }

        // ✅ DB에서 이미지 정보 삭제
        await connection.query('DELETE FROM post_images WHERE post_id = ?', [postId]);

        // ✅ 글 본문 수정
        const isAdvertisedValue = is_advertised === 'true' ? 1 : 0;
        await connection.query(
            `UPDATE posts 
             SET title = ?, content = ?, region = ?, is_advertised = ?
             WHERE post_id = ?`,
            [title, content, region || null, isAdvertisedValue, postId]
        );

        // ✅ 새 이미지가 있다면 등록
        if (req.files && req.files.length > 0) {
            const insertValues = req.files.map((file, index) => [
                postId,
                file.filename,
                index + 1, // 이미지 순서
            ]);
            await connection.query('INSERT INTO post_images (post_id, image_url, image_order) VALUES ?', [
                insertValues,
            ]);
        }

        await connection.commit();
        res.json({ ok: true, message: '후기 글과 이미지가 수정되었습니다.' });
    } catch (err) {
        await connection.rollback();
        console.error('후기 수정 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    } finally {
        connection.release();
    }
});

// ============================
//   후기 글 삭제 API (이미지 파일 포함)
// ============================
router.delete('/:postId', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const postId = req.params.postId;
        const userId = req.user.user_id;

        // 🔍 본인 글인지 확인
        const [rows] = await connection.query('SELECT user_id FROM posts WHERE post_id = ?', [postId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ ok: false, message: '해당 글을 찾을 수 없습니다.' });
        }
        if (rows[0].user_id !== userId) {
            await connection.rollback();
            return res.status(403).json({ ok: false, message: '본인 글만 삭제할 수 있습니다.' });
        }

        // ✅ 1️⃣ 해당 글의 이미지 목록 조회
        const [images] = await connection.query('SELECT image_url FROM post_images WHERE post_id = ?', [postId]);

        // ✅ 2️⃣ 실제 파일 삭제
        for (const img of images) {
            const filePath = path.join(__dirname, '../uploads', img.image_url);
            fs.unlink(filePath, (err) => {
                if (err) console.warn(`⚠️ 이미지 파일 삭제 실패: ${img.image_url}`);
            });
        }

        // ✅ 3️⃣ 게시글 삭제 (CASCADE로 post_images도 자동 제거)
        await connection.query('DELETE FROM posts WHERE post_id = ?', [postId]);

        await connection.commit();
        res.json({ ok: true, message: '후기 글 및 관련 이미지가 삭제되었습니다.' });
    } catch (err) {
        await connection.rollback();
        console.error('후기 삭제 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    } finally {
        connection.release();
    }
});

// ============================
//   Tiptap 이미지 업로드 API
// ============================
router.post('/upload', upload.single('images'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ ok: false, message: '업로드된 파일이 없습니다.' });
        }

        // 업로드된 이미지 접근 경로 생성
        const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
        console.log('📸 업로드된 이미지 경로:', imageUrl);

        res.status(200).json({ ok: true, url: imageUrl });
    } catch (err) {
        console.error('이미지 업로드 오류:', err);
        res.status(500).json({ ok: false, message: '이미지 업로드 실패' });
    }
});

module.exports = router;
