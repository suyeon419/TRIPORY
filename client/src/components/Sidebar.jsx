import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form } from 'react-bootstrap';
import { loginUser, registerUser, getProfile } from '../api/auth';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';

const Sidebar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('현재 로그인 상태:', isLoggedIn, userInfo);
    }, [isLoggedIn, userInfo]);

    // ✅ 새로고침 시 토큰 확인 + 프로필 불러오기
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            getProfile()
                .then((res) => {
                    setUserInfo(res.user);
                    setIsLoggedIn(true);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                });
        }
    }, []);

    // ✅ 로그인
    const handleLogin = async (e) => {
        e.preventDefault();
        const email = e.target.formEmail.value;
        const password = e.target.formPassword.value;

        try {
            const res = await loginUser({ email, password });
            console.log('로그인 응답:', res);

            localStorage.setItem('token', res.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${res.token}`;

            setUserInfo(res.user);
            setIsLoggedIn(true); // ✅ 순서 중요
            setShowLogin(false);

            // ✅ 렌더링 강제 갱신용 로그 (디버그)
            console.log('userInfo 업데이트 완료:', res.user);
            alert('로그인 성공!');
            window.dispatchEvent(new Event('authChange'));
        } catch (err) {
            const data = err.response?.data;
            if (!data) return alert('네트워크 오류');
            if (data.message) return alert(data.message);
            alert('로그인 실패');
        }
    };

    // ✅ 회원가입
    const handleRegister = async (e) => {
        e.preventDefault();
        const email = e.target.registerEmail.value;
        const name = e.target.registerNickname.value;
        const phone = e.target.registerPhone.value || null;
        const password = e.target.registerPassword.value;
        const confirm = e.target.registerConfirmPassword.value;

        if (password !== confirm) return alert('비밀번호가 일치하지 않습니다.');

        try {
            await registerUser({ email, password, name, phone });
            alert('회원가입 완료! 로그인해주세요.');
            setShowRegister(false);
            setShowLogin(true);
        } catch (err) {
            const data = err.response?.data;
            if (!data) return alert('네트워크 오류');

            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) return alert(data.errors[0].msg);

            if (data.message) return alert(data.message);

            alert('회원가입 실패');
        }
    };

    // ✅ 로그아웃
    const handleLogout = async () => {
        try {
            await api.post('/users/logout');
        } catch (err) {
            console.warn('서버 로그아웃 처리 실패(무시 가능):', err);
        } finally {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUserInfo(null);
            setIsLoggedIn(false);

            window.dispatchEvent(new Event('authChange'));
        }
    };

    return (
        <>
            {/* ========== Sidebar 영역 ========== */}
            <div
                style={{
                    width: '260px',
                    height: '100vh',
                    backgroundColor: '#f8fdfb',
                    padding: '20px',
                    borderRight: '1px solid #e0ece7',
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    marginTop: '80px',
                }}
            >
                {isLoggedIn ? (
                    <Card className="p-3 shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <div className="d-flex align-items-center mb-3">
                            <img
                                src="./images/profile-default.png"
                                alt="프로필"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    marginRight: '10px',
                                }}
                            />
                            <div>
                                <strong>{userInfo?.name}</strong>
                                <p style={{ fontSize: '0.7rem', color: 'gray', margin: 0 }}>{userInfo?.email}</p>
                            </div>
                        </div>

                        <Button className="mb-2" variant="primary" size="sm" onClick={() => navigate('/profile')}>
                            회원정보 수정
                        </Button>
                        <Button
                            className="mb-2"
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate('/my-activity')}
                        >
                            내 활동
                        </Button>
                        <Button variant="outline-primary" size="sm" onClick={handleLogout}>
                            로그아웃
                        </Button>
                    </Card>
                ) : (
                    <Card className="p-3 shadow-sm border-0" style={{ borderRadius: '12px' }}>
                        <h6 className="mb-3 ">Tripory와 함께해요!</h6>
                        <Button variant="primary" className="mb-2" onClick={() => setShowLogin(true)}>
                            로그인하기
                        </Button>
                        <Button variant="outline-primary" onClick={() => setShowRegister(true)}>
                            회원가입
                        </Button>
                    </Card>
                )}
            </div>

            {/* ========== 로그인 모달 ========== */}
            <Modal show={showLogin} onHide={() => setShowLogin(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>로그인</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3" controlId="formEmail">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control type="email" placeholder="이메일 입력" required />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formPassword">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control type="password" placeholder="비밀번호 입력" required />
                        </Form.Group>
                        <Button type="submit" variant="primary" className="w-100 mb-2">
                            로그인
                        </Button>
                    </Form>
                    <div className="text-center">
                        <small>
                            아직 계정이 없으신가요?{' '}
                            <span
                                style={{
                                    color: '#00523d',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                }}
                                onClick={() => {
                                    setShowLogin(false);
                                    setShowRegister(true);
                                }}
                            >
                                회원가입
                            </span>
                        </small>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ========== 회원가입 모달 ========== */}
            <Modal show={showRegister} onHide={() => setShowRegister(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>회원가입</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleRegister}>
                        <Form.Group className="mb-3" controlId="registerEmail">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control type="email" placeholder="이메일 입력" required />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="registerNickname">
                            <Form.Label>이름</Form.Label>
                            <Form.Control type="text" placeholder="이름 입력" required />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="registerPhone">
                            <Form.Label>전화번호 (선택)</Form.Label>
                            <Form.Control type="tel" placeholder="예: 010-1234-5678" />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="registerPassword">
                            <Form.Label>비밀번호</Form.Label>
                            <Form.Control type="password" placeholder="비밀번호 입력" required />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="registerConfirmPassword">
                            <Form.Label>비밀번호 확인</Form.Label>
                            <Form.Control type="password" placeholder="비밀번호 재입력" required />
                        </Form.Group>

                        <Button type="submit" variant="primary" className="w-100">
                            회원가입 완료
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Sidebar;
