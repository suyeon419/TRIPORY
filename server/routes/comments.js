const express = require('express');
const router = express.Router();
const pool = require('./db'); // DB 연결
const { verifyToken } = require('../middlewares/auth');

console.log('✅ comments.js 라우터 등록 완료');

// ============================
//   댓글 작성 API
// ============================
router.post('/:postId', verifyToken, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.user_id;
        const { content } = req.body;

        // 🧩 유효성 검사
        if (!content || content.trim() === '') {
            return res.status(400).json({ ok: false, message: '댓글 내용을 입력해주세요.' });
        }

        // 🔍 해당 게시글 존재 여부 확인
        const [postRows] = await pool.query('SELECT post_id FROM posts WHERE post_id = ?', [postId]);
        if (postRows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 게시글을 찾을 수 없습니다.' });
        }

        // ✅ 댓글 등록
        await pool.query(`INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`, [
            postId,
            userId,
            content,
        ]);

        res.status(201).json({ ok: true, message: '댓글이 등록되었습니다.' });
    } catch (err) {
        console.error('댓글 작성 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   댓글 조회 API
// ============================
router.get('/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;

        // 🔍 해당 게시글 존재 여부 확인
        const [postRows] = await pool.query('SELECT post_id FROM posts WHERE post_id = ?', [postId]);
        if (postRows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 게시글을 찾을 수 없습니다.' });
        }

        // ✅ 댓글 목록 조회 (날짜 YYYY-MM-DD 형식)
        const [comments] = await pool.query(
            `SELECT
                c.comment_id,
                c.user_id,
                c.content,
                DATE_FORMAT(c.created_at, '%Y-%m-%d') AS created_at,
                u.name AS author_name
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC`,
            [postId]
        );

        res.status(200).json({
            ok: true,
            comments,
        });
    } catch (err) {
        console.error('댓글 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   댓글 수정 API
// ============================
router.put('/:commentId', verifyToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.user_id;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ ok: false, message: '댓글 내용을 입력해주세요.' });
        }

        const [rows] = await pool.query('SELECT user_id FROM comments WHERE comment_id = ?', [commentId]);
        if (rows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 댓글을 찾을 수 없습니다.' });
        }
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ ok: false, message: '본인 댓글만 수정할 수 있습니다.' });
        }

        await pool.query('UPDATE comments SET content = ? WHERE comment_id = ?', [content, commentId]);

        res.json({ ok: true, message: '댓글이 수정되었습니다.' });
    } catch (err) {
        console.error('댓글 수정 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   댓글 삭제 API
// ============================
router.delete('/:commentId', verifyToken, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.user_id;

        const [rows] = await pool.query('SELECT user_id FROM comments WHERE comment_id = ?', [commentId]);
        if (rows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 댓글을 찾을 수 없습니다.' });
        }
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ ok: false, message: '본인 댓글만 삭제할 수 있습니다.' });
        }

        await pool.query('DELETE FROM comments WHERE comment_id = ?', [commentId]);

        res.json({ ok: true, message: '댓글이 삭제되었습니다.' });
    } catch (err) {
        console.error('댓글 삭제 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

module.exports = router;
