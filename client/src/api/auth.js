import api from './axios';

// 회원가입
export const registerUser = async (data) => {
    const res = await api.post('/users/register', data);
    return res.data; // ✅ 핵심
};

// 로그인
export const loginUser = async (data) => {
    const res = await api.post('/users/login', data);
    return res.data; // ✅ 핵심
};

// 내 프로필 조회
export const getProfile = async () => {
    const res = await api.get('/users/profile');
    return res.data; // ✅ 핵심
};
