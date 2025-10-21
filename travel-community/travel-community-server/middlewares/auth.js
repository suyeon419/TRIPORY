const jwt = require('jsonwebtoken');
require('dotenv').config();

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

        req.user = decoded; // decoded = { user_id, email, ... }
        next();
    });
};
