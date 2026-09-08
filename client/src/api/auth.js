import api from './axios';

// 회원가입 1단계: 이메일 인증코드 발급
export const requestRegisterCode = async (data) => {
    const res = await api.post('/users/register/request-code', data);
    return res.data;
};

// 회원가입 2단계: 인증코드 확인 후 계정 생성
export const verifyRegisterCode = async (data) => {
    const res = await api.post('/users/register/verify', data);
    return res.data;
};

// 이메일(아이디) 찾기
export const findEmail = async (data) => {
    const res = await api.post('/users/find-email', data);
    return res.data;
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

// 비밀번호 재설정 요청
export const forgotPassword = async (data) => {
    const res = await api.post('/users/forgot-password', data);
    return res.data;
};

// 비밀번호 재설정
export const resetPassword = async (data) => {
    const res = await api.post('/users/reset-password', data);
    return res.data;
};
