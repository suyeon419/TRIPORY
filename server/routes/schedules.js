const express = require('express');
const router = express.Router();
const pool = require('./db');
const { verifyToken } = require('../middlewares/auth');

console.log('✅ schedules.js 라우터 등록 완료');

// ============================
//   여행 일정 등록 API
// ============================
router.post('/', verifyToken, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const userId = req.user.user_id;
        const { title, start_date, end_date, is_public = 'N' } = req.body;

        // ✅ 입력값 검증
        if (!title || !start_date || !end_date) {
            return res.status(400).json({ ok: false, message: '필수 항목이 누락되었습니다.' });
        }
        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ ok: false, message: '종료일이 시작일보다 빠릅니다.' });
        }

        await conn.beginTransaction();

        // ✅ 1️⃣ schedules 테이블에 일정 추가
        const [result] = await conn.query(
            `INSERT INTO schedules (user_id, title, start_date, end_date, is_public)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, title, start_date, end_date, is_public]
        );
        const scheduleId = result.insertId;

        // ✅ 2️⃣ Day 자동 생성
        const start = new Date(start_date);
        const end = new Date(end_date);
        const days = [];
        let dayOrder = 1;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const formatted = d.toISOString().split('T')[0];
            await conn.query(
                `INSERT INTO schedule_days (schedule_id, day_order, date)
                 VALUES (?, ?, ?)`,
                [scheduleId, dayOrder, formatted]
            );
            days.push({ day_order: dayOrder, date: formatted });
            dayOrder++;
        }

        await conn.commit();

        res.json({
            ok: true,
            message: '여행 일정이 등록되었습니다.',
            data: {
                schedule_id: scheduleId,
                title,
                start_date,
                end_date,
                is_public,
                days,
            },
        });
    } catch (err) {
        await conn.rollback();
        console.error('🧨 일정 등록 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    } finally {
        conn.release();
    }
});

// ============================
//   상세 일정(장소) 등록 API
// ============================
router.post('/:dayId/places', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const dayId = req.params.dayId;
        const userId = req.user.user_id;
        const { name, address, memo, is_reservable } = req.body;

        if (!name) {
            return res.status(400).json({ ok: false, message: '장소 이름을 입력해주세요.' });
        }

        // ✅ 해당 day가 존재하는지 확인 + 소유자 확인
        const [dayRows] = await connection.query(
            `SELECT d.schedule_id, s.user_id
             FROM schedule_days d
             JOIN schedules s ON d.schedule_id = s.schedule_id
             WHERE d.day_id = ?`,
            [dayId]
        );

        if (dayRows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 날짜를 찾을 수 없습니다.' });
        }

        if (dayRows[0].user_id !== userId) {
            return res.status(403).json({ ok: false, message: '본인 일정에만 장소를 추가할 수 있습니다.' });
        }

        // ✅ 현재 day의 마지막 순서(place_order) 구하기
        const [orderRows] = await connection.query(
            `SELECT COALESCE(MAX(place_order), 0) + 1 AS next_order
             FROM schedule_places
             WHERE day_id = ?`,
            [dayId]
        );

        const nextOrder = orderRows[0].next_order;

        // ✅ 장소 등록
        const [result] = await connection.query(
            `INSERT INTO schedule_places 
             (day_id, place_order, name, address, memo, is_reservable)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [dayId, nextOrder, name, address || null, memo || null, is_reservable || 'N']
        );

        const inserted = {
            place_id: result.insertId,
            day_id: dayId,
            place_order: nextOrder,
            name,
            address,
            memo,
            is_reservable: is_reservable || 'N',
        };

        res.status(201).json({ ok: true, message: '상세 일정이 등록되었습니다.', data: inserted });
    } catch (err) {
        console.error('상세 일정 등록 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    } finally {
        connection.release();
    }
});

// ============================
//   공개 일정 목록 조회 API
// ============================
router.get('/public', async (req, res) => {
    try {
        const keyword = req.query.keyword || ''; // 🔍 검색 키워드 (선택)

        let query = `
            SELECT DISTINCT 
                s.schedule_id, 
                s.title, 
                DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
                s.is_public, 
                DATE_FORMAT(s.created_at, '%Y-%m-%d') AS created_at,
                u.name AS author_name,
                DATEDIFF(s.end_date, s.start_date) AS nights,
                DATEDIFF(s.end_date, s.start_date) + 1 AS days
            FROM schedules s
            JOIN users u ON s.user_id = u.user_id
            LEFT JOIN schedule_days d ON s.schedule_id = d.schedule_id
            LEFT JOIN schedule_places p ON d.day_id = p.day_id
            WHERE s.is_public = 'Y'
        `;

        const params = [];

        // 🔍 검색 기능: 제목(title) 또는 장소명(name)
        if (keyword) {
            query += ` AND (s.title LIKE ? OR p.name LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        // ✅ 최신 등록순
        query += ` ORDER BY created_at DESC`;

        // DB 조회
        const [rows] = await pool.query(query, params);

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                message: '공개된 일정을 찾을 수 없습니다.',
            });
        }

        // ✅ "2박 3일" 형식 추가
        const formatted = rows.map((r) => ({
            ...r,
            duration: `${r.nights}박 ${r.days}일`,
        }));

        res.json({
            ok: true,
            count: formatted.length,
            data: formatted,
        });
    } catch (err) {
        console.error('공개 일정 목록 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   내가 작성한 일정 목록 조회 API
// ============================
router.get('/my', verifyToken, async (req, res) => {
    try {
        const userId = req.user.user_id; // ✅ 토큰에서 사용자 ID 가져오기

        const [rows] = await pool.query(
            `SELECT 
                 s.schedule_id,
                 s.title,
                 DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
                 DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
                 s.is_public,
                 DATE_FORMAT(s.created_at, '%Y-%m-%d') AS created_at,
                 DATEDIFF(s.end_date, s.start_date) AS nights,
                 DATEDIFF(s.end_date, s.start_date) + 1 AS days
             FROM schedules s
             WHERE s.user_id = ?
             ORDER BY s.created_at DESC`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                ok: false,
                message: '등록한 일정이 없습니다.',
            });
        }

        const formatted = rows.map((r) => ({
            ...r,
            duration: `${r.nights}박 ${r.days}일`,
        }));

        res.json({
            ok: true,
            count: formatted.length,
            data: formatted,
        });
    } catch (err) {
        console.error('내 일정 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   여행 일정 상세 조회 API
// ============================
router.get('/:scheduleId', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { scheduleId } = req.params;

        // 1️⃣ 기본 일정 정보 가져오기
        const [scheduleRows] = await connection.query(
            `SELECT 
                s.schedule_id,
                s.user_id,
                s.title,
                s.start_date,
                s.end_date,
                s.is_public,
                DATE_FORMAT(s.created_at, '%Y-%m-%d') AS created_at,
                u.name AS author_name,
                DATEDIFF(s.end_date, s.start_date) AS nights,
                DATEDIFF(s.end_date, s.start_date) + 1 AS days
            FROM schedules s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.schedule_id = ?`,
            [scheduleId]
        );

        if (scheduleRows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 일정을 찾을 수 없습니다.' });
        }

        const schedule = scheduleRows[0];

        // 2️⃣ 각 Day 불러오기
        const [dayRows] = await connection.query(
            `SELECT 
                day_id,
                day_order,
                DATE_FORMAT(date, '%Y-%m-%d') AS date
             FROM schedule_days
             WHERE schedule_id = ?
             ORDER BY day_order ASC`,
            [scheduleId]
        );

        // 3️⃣ 각 Day별 장소 묶어서 정리
        for (const day of dayRows) {
            const [places] = await connection.query(
                `SELECT 
                    place_id,
                    place_order,
                    name,
                    address,
                    memo,
                    is_reservable
                 FROM schedule_places
                 WHERE day_id = ?
                 ORDER BY place_order ASC`,
                [day.day_id]
            );
            day.places = places; // ⬅️ 각 Day에 연결
        }

        // 4️⃣ 결과 반환
        res.json({
            ok: true,
            data: {
                schedule,
                days: dayRows,
            },
        });
    } catch (err) {
        console.error('일정 상세 조회 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    } finally {
        connection.release();
    }
});

// ============================
//   여행 일정 수정 API
// ============================
router.put('/:scheduleId', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { scheduleId } = req.params;
        const userId = req.user.user_id;
        const { title, start_date, end_date, is_public } = req.body;

        await connection.beginTransaction();

        const [rows] = await connection.query('SELECT * FROM schedules WHERE schedule_id = ?', [scheduleId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ ok: false, message: '해당 일정을 찾을 수 없습니다.' });
        }

        const schedule = rows[0];
        if (schedule.user_id !== userId) {
            await connection.rollback();
            return res.status(403).json({ ok: false, message: '본인 일정만 수정할 수 있습니다.' });
        }

        // mysql2가 DATE 컬럼을 로컬 자정 기준 Date 객체로 반환하므로,
        // toISOString(UTC 기준)으로 변환하면 시간대에 따라 하루 밀릴 수 있음 → 로컬 게터로 복원
        const dbDateToStr = (d) => {
            const date = new Date(d);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        const newTitle = title || schedule.title;
        const newStart = start_date || dbDateToStr(schedule.start_date);
        const newEnd = end_date || dbDateToStr(schedule.end_date);
        const newIsPublic = is_public || schedule.is_public;

        if (new Date(newStart) > new Date(newEnd)) {
            await connection.rollback();
            return res.status(400).json({ ok: false, message: '종료일이 시작일보다 빠릅니다.' });
        }

        await connection.query(
            `UPDATE schedules SET title = ?, start_date = ?, end_date = ?, is_public = ? WHERE schedule_id = ?`,
            [newTitle, newStart, newEnd, newIsPublic, scheduleId]
        );

        // ✅ 날짜 범위가 바뀐 경우: 기존 범위 밖 Day는 삭제(장소도 함께 삭제), 겹치는 Day는 유지, 새로 늘어난 날짜만 추가
        const [existingDays] = await connection.query(
            'SELECT day_id, date FROM schedule_days WHERE schedule_id = ?',
            [scheduleId]
        );
        const existingByDate = new Map(existingDays.map((d) => [dbDateToStr(d.date), d.day_id]));

        const newDates = [];
        for (let d = new Date(newStart); d <= new Date(newEnd); d.setDate(d.getDate() + 1)) {
            newDates.push(d.toISOString().split('T')[0]);
        }

        for (const [date, dayId] of existingByDate) {
            if (!newDates.includes(date)) {
                await connection.query('DELETE FROM schedule_days WHERE day_id = ?', [dayId]);
            }
        }

        // (schedule_id, day_order)에 UNIQUE 제약이 있어 재배정 도중 값이 겹칠 수 있으므로,
        // 남아있는 Day들을 먼저 충돌 없는 임시 순서로 옮겨둔 뒤 최종 순서를 배정한다.
        await connection.query('UPDATE schedule_days SET day_order = day_order + 1000000 WHERE schedule_id = ?', [
            scheduleId,
        ]);

        let dayOrder = 1;
        for (const date of newDates) {
            if (existingByDate.has(date)) {
                await connection.query('UPDATE schedule_days SET day_order = ? WHERE day_id = ?', [
                    dayOrder,
                    existingByDate.get(date),
                ]);
            } else {
                await connection.query('INSERT INTO schedule_days (schedule_id, day_order, date) VALUES (?, ?, ?)', [
                    scheduleId,
                    dayOrder,
                    date,
                ]);
            }
            dayOrder++;
        }

        await connection.commit();
        res.json({ ok: true, message: '일정이 수정되었습니다.' });
    } catch (err) {
        await connection.rollback();
        console.error('일정 수정 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    } finally {
        connection.release();
    }
});

// ============================
//   여행 일정 삭제 API
// ============================
router.delete('/:scheduleId', verifyToken, async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const userId = req.user.user_id;

        const [rows] = await pool.query('SELECT user_id FROM schedules WHERE schedule_id = ?', [scheduleId]);
        if (rows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 일정을 찾을 수 없습니다.' });
        }
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ ok: false, message: '본인 일정만 삭제할 수 있습니다.' });
        }

        await pool.query('DELETE FROM schedules WHERE schedule_id = ?', [scheduleId]);

        res.json({ ok: true, message: '일정이 삭제되었습니다.' });
    } catch (err) {
        console.error('일정 삭제 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   상세 일정(장소) 수정 API
// ============================
router.put('/places/:placeId', verifyToken, async (req, res) => {
    try {
        const { placeId } = req.params;
        const userId = req.user.user_id;
        const { name, address, memo, is_reservable } = req.body;

        if (!name) {
            return res.status(400).json({ ok: false, message: '장소 이름을 입력해주세요.' });
        }

        const [rows] = await pool.query(
            `SELECT s.user_id
             FROM schedule_places p
             JOIN schedule_days d ON p.day_id = d.day_id
             JOIN schedules s ON d.schedule_id = s.schedule_id
             WHERE p.place_id = ?`,
            [placeId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 장소를 찾을 수 없습니다.' });
        }
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ ok: false, message: '본인 일정에만 장소를 수정할 수 있습니다.' });
        }

        await pool.query(
            `UPDATE schedule_places SET name = ?, address = ?, memo = ?, is_reservable = ? WHERE place_id = ?`,
            [name, address || null, memo || null, is_reservable || 'N', placeId]
        );

        res.json({ ok: true, message: '장소가 수정되었습니다.' });
    } catch (err) {
        console.error('장소 수정 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

// ============================
//   상세 일정(장소) 삭제 API
// ============================
router.delete('/places/:placeId', verifyToken, async (req, res) => {
    try {
        const { placeId } = req.params;
        const userId = req.user.user_id;

        const [rows] = await pool.query(
            `SELECT s.user_id
             FROM schedule_places p
             JOIN schedule_days d ON p.day_id = d.day_id
             JOIN schedules s ON d.schedule_id = s.schedule_id
             WHERE p.place_id = ?`,
            [placeId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ ok: false, message: '해당 장소를 찾을 수 없습니다.' });
        }
        if (rows[0].user_id !== userId) {
            return res.status(403).json({ ok: false, message: '본인 일정에만 장소를 삭제할 수 있습니다.' });
        }

        await pool.query('DELETE FROM schedule_places WHERE place_id = ?', [placeId]);

        res.json({ ok: true, message: '장소가 삭제되었습니다.' });
    } catch (err) {
        console.error('장소 삭제 오류:', err);
        res.status(500).json({ ok: false, message: '서버 오류' });
    }
});

module.exports = router;
