// 포인트 적립 규칙과 내역 기록을 한 곳에서 관리한다.
// 잔액은 저장하지 않고 point_transactions 내역의 합계로 계산한다 (ledger 방식).

const POINT_RULES = {
    post_write: { amount: 8, referenceType: 'post' },
    comment_write: { amount: 2, referenceType: 'comment' },
    schedule_create: { amount: 5, referenceType: 'schedule' },
    place_add: { amount: 1, referenceType: 'place' },
};

// db.js의 pool 또는 트랜잭션 중인 connection 둘 다 받을 수 있다 (둘 다 query()를 가짐).
async function earnPoints(db, { userId, reason, referenceId }) {
    const rule = POINT_RULES[reason];
    if (!rule) throw new Error(`알 수 없는 포인트 적립 사유: ${reason}`);

    await db.query(
        `INSERT INTO point_transactions (user_id, type, amount, reason, reference_type, reference_id)
         VALUES (?, 'earn', ?, ?, ?, ?)`,
        [userId, rule.amount, reason, rule.referenceType, referenceId ?? null]
    );
}

async function getPointBalance(db, userId) {
    const [[row]] = await db.query(
        `SELECT COALESCE(SUM(CASE WHEN type = 'earn' THEN amount ELSE -amount END), 0) AS balance
         FROM point_transactions WHERE user_id = ?`,
        [userId]
    );
    return row.balance;
}

module.exports = { POINT_RULES, earnPoints, getPointBalance };
