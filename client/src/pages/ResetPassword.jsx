import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { resetPassword } from '../api/auth';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            setSending(true);
            await resetPassword({ token, password });
            setSuccess(true);
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors?.length > 0) return alert(data.errors[0].msg);
            alert(data?.message || '비밀번호 재설정에 실패했습니다.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ maxWidth: '480px', margin: '60px auto', padding: '20px' }}>
            <Card className="p-4 shadow-sm border-0" style={{ borderRadius: '14px' }}>
                <h5 className="fw-bold mb-3">비밀번호 재설정</h5>

                {!token && <Alert variant="danger">유효하지 않은 재설정 링크입니다.</Alert>}

                {success ? (
                    <>
                        <Alert variant="success">비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.</Alert>
                        <div className="d-grid">
                            <Button variant="primary" onClick={() => navigate('/')}>
                                홈으로 이동
                            </Button>
                        </div>
                    </>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>새 비밀번호</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="8자 이상, 영문+숫자 포함"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>새 비밀번호 확인</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="비밀번호 재입력"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="d-grid">
                            <Button type="submit" variant="primary" disabled={!token || sending}>
                                {sending ? '변경 중...' : '비밀번호 변경'}
                            </Button>
                        </div>
                    </Form>
                )}
            </Card>
        </div>
    );
};

export default ResetPassword;
