import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import { BsShieldLock } from 'react-icons/bs';
import { loginUser, requestRegisterCode, verifyRegisterCode, getProfile, forgotPassword, findEmail } from '../api/auth';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';

const Sidebar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [resetInfo, setResetInfo] = useState(null); // { resetUrl }
    const [forgotSending, setForgotSending] = useState(false);

    const [showFindEmail, setShowFindEmail] = useState(false);
    const [findName, setFindName] = useState('');
    const [findPhone, setFindPhone] = useState('');
    const [foundEmail, setFoundEmail] = useState(null);
    const [findSending, setFindSending] = useState(false);

    // 회원가입: 1단계(정보 입력) / 2단계(이메일 인증코드 확인)
    const [registerStep, setRegisterStep] = useState('form');
    const [pendingEmail, setPendingEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [registerSending, setRegisterSending] = useState(false);
    const [verifySending, setVerifySending] = useState(false);

    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log('현재 로그인 상태:', isLoggedIn, userInfo);
    }, [isLoggedIn, userInfo]);

    // 새로고침 시 토큰 확인 + 프로필 불러오기
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

    // 로그인
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
            setIsLoggedIn(true); // 순서 중요
            setShowLogin(false);

            // 렌더링 강제 갱신용 로그 (디버그)
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

    // 회원가입 상태 초기화
    const resetRegisterState = () => {
        setRegisterStep('form');
        setPendingEmail('');
        setVerificationCode('');
        setCodeInput('');
    };

    // 회원가입 1단계: 이메일 인증코드 발급
    const handleRequestCode = async (e) => {
        e.preventDefault();
        const email = e.target.registerEmail.value;
        const name = e.target.registerNickname.value;
        const phone = e.target.registerPhone.value || null;
        const password = e.target.registerPassword.value;
        const confirm = e.target.registerConfirmPassword.value;

        if (password !== confirm) return alert('비밀번호가 일치하지 않습니다.');

        try {
            setRegisterSending(true);
            const res = await requestRegisterCode({ email, password, name, phone });
            setPendingEmail(email);
            setVerificationCode(res.verificationCode);
            setCodeInput('');
            setRegisterStep('verify');
        } catch (err) {
            const data = err.response?.data;
            if (!data) return alert('네트워크 오류');
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) return alert(data.errors[0].msg);
            alert(data.message || '인증코드 발급 실패');
        } finally {
            setRegisterSending(false);
        }
    };

    // 회원가입 2단계: 인증코드 확인
    const handleVerifyCode = async (e) => {
        e.preventDefault();

        try {
            setVerifySending(true);
            await verifyRegisterCode({ email: pendingEmail, code: codeInput });
            alert('회원가입 완료! 로그인해주세요.');
            resetRegisterState();
            setShowRegister(false);
            setShowLogin(true);
        } catch (err) {
            const data = err.response?.data;
            if (!data) return alert('네트워크 오류');
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) return alert(data.errors[0].msg);
            alert(data.message || '인증 실패');
        } finally {
            setVerifySending(false);
        }
    };

    // 아이디(이메일) 찾기
    const handleFindEmail = async (e) => {
        e.preventDefault();

        try {
            setFindSending(true);
            const res = await findEmail({ name: findName, phone: findPhone });
            setFoundEmail(res.maskedEmail);
        } catch (err) {
            const data = err.response?.data;
            if (!data) return alert('네트워크 오류');
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) return alert(data.errors[0].msg);
            alert(data.message || '조회 실패');
        } finally {
            setFindSending(false);
        }
    };

    // 비밀번호 찾기
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetInfo(null);

        try {
            setForgotSending(true);
            const res = await forgotPassword({ email: forgotEmail });
            setResetInfo({ resetUrl: res.resetUrl });
        } catch (err) {
            const data = err.response?.data;
            if (!data) return alert('네트워크 오류');
            if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) return alert(data.errors[0].msg);
            alert(data.message || '요청 실패');
        } finally {
            setForgotSending(false);
        }
    };

    // 로그아웃
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
                                src="/images/profile-default.png"
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
                                {userInfo?.role === 'admin' && (
                                    <span className="badge bg-dark ms-2" style={{ fontSize: '0.65rem' }}>
                                        관리자
                                    </span>
                                )}
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
                        {userInfo?.role === 'admin' && (
                            <Button
                                className="mb-2"
                                variant="outline-dark"
                                size="sm"
                                onClick={() => navigate('/admin/login-history')}
                            >
                                <BsShieldLock className="me-1" />
                                전체 로그인 이력
                            </Button>
                        )}
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
                        <div className="mt-2 d-flex justify-content-center gap-3">
                            <small
                                style={{ color: '#6c757d', cursor: 'pointer' }}
                                onClick={() => {
                                    setShowLogin(false);
                                    setFoundEmail(null);
                                    setFindName('');
                                    setFindPhone('');
                                    setShowFindEmail(true);
                                }}
                            >
                                아이디(이메일) 찾기
                            </small>
                            <small
                                style={{ color: '#6c757d', cursor: 'pointer' }}
                                onClick={() => {
                                    setShowLogin(false);
                                    setResetInfo(null);
                                    setForgotEmail('');
                                    setShowForgotPassword(true);
                                }}
                            >
                                비밀번호를 잊으셨나요?
                            </small>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ========== 비밀번호 찾기 모달 ========== */}
            <Modal show={showForgotPassword} onHide={() => setShowForgotPassword(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>비밀번호 찾기</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {resetInfo ? (
                        <div>
                            <p className="mb-2">
                                재설정 링크가 발급되었습니다. (이메일 발송 기능이 아직 없어 링크를 바로 보여드려요)
                            </p>
                            <div className="d-grid mb-2">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        navigate(new URL(resetInfo.resetUrl).pathname + new URL(resetInfo.resetUrl).search);
                                    }}
                                >
                                    비밀번호 재설정하러 가기
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Form onSubmit={handleForgotPassword}>
                            <Form.Group className="mb-3">
                                <Form.Label>가입한 이메일</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="이메일 입력"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Button type="submit" variant="primary" className="w-100" disabled={forgotSending}>
                                {forgotSending ? '요청 중...' : '재설정 링크 받기'}
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>

            {/* ========== 아이디(이메일) 찾기 모달 ========== */}
            <Modal show={showFindEmail} onHide={() => setShowFindEmail(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>아이디(이메일) 찾기</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {foundEmail ? (
                        <div>
                            <p className="mb-2">회원님의 이메일은 다음과 같습니다.</p>
                            <Alert variant="success" className="text-center fw-bold mb-3">
                                {foundEmail}
                            </Alert>
                            <div className="d-grid">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setShowFindEmail(false);
                                        setShowLogin(true);
                                    }}
                                >
                                    로그인하러 가기
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Form onSubmit={handleFindEmail}>
                            <Form.Group className="mb-3">
                                <Form.Label>이름</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="가입 시 등록한 이름"
                                    value={findName}
                                    onChange={(e) => setFindName(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>전화번호</Form.Label>
                                <Form.Control
                                    type="tel"
                                    placeholder="예: 010-1234-5678"
                                    value={findPhone}
                                    onChange={(e) => setFindPhone(e.target.value)}
                                    required
                                />
                                <Form.Text className="text-muted">
                                    가입 시 등록한 전화번호와 정확히 일치해야 합니다. 전화번호를 등록하지 않았다면
                                    이 방법으로 찾을 수 없어요.
                                </Form.Text>
                            </Form.Group>
                            <Button type="submit" variant="primary" className="w-100" disabled={findSending}>
                                {findSending ? '조회 중...' : '이메일 찾기'}
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>

            {/* ========== 회원가입 모달 ========== */}
            <Modal
                show={showRegister}
                onHide={() => {
                    setShowRegister(false);
                    resetRegisterState();
                }}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>{registerStep === 'form' ? '회원가입' : '이메일 인증'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {registerStep === 'verify' ? (
                        <div>
                            <p className="mb-2">
                                <strong>{pendingEmail}</strong>로 인증코드가 발급되었습니다.
                                <br />
                                (이메일 발송 기능이 아직 없어 코드를 바로 보여드려요)
                            </p>
                            <Alert variant="info" className="text-center fw-bold" style={{ letterSpacing: '3px' }}>
                                {verificationCode}
                            </Alert>
                            <Form onSubmit={handleVerifyCode}>
                                <Form.Group className="mb-3">
                                    <Form.Label>인증코드 입력</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="6자리 코드 입력"
                                        value={codeInput}
                                        onChange={(e) => setCodeInput(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-100 mb-2"
                                    disabled={verifySending}
                                >
                                    {verifySending ? '확인 중...' : '인증 완료'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    className="w-100"
                                    onClick={() => setRegisterStep('form')}
                                >
                                    정보 다시 입력하기
                                </Button>
                            </Form>
                        </div>
                    ) : (
                    <Form onSubmit={handleRequestCode}>
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

                        <Button type="submit" variant="primary" className="w-100" disabled={registerSending}>
                            {registerSending ? '요청 중...' : '인증코드 받기'}
                        </Button>
                    </Form>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Sidebar;
