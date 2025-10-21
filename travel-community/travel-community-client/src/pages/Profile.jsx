import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import api from '../api/axios';
import { getProfile } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        getProfile()
            .then((res) => setProfile(res.user))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/users/profile', {
                name: profile.name,
                phone: profile.phone,
                password: profile.password || undefined,
            });
            alert('회원정보가 수정되었습니다.');
            setEditMode(false);
        } catch (err) {
            alert(err.response?.data?.message || '회원정보 수정 실패');
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm('정말로 회원 탈퇴하시겠습니까? 😢');
        if (!confirmDelete) return;

        try {
            await api.delete('/users/delete');
            alert('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.');

            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];

            navigate('/');
            window.location.reload();
        } catch (err) {
            alert(err.response?.data?.message || '회원 탈퇴 실패');
        }
    };

    if (loading) return <p>불러오는 중...</p>;

    return (
        <div style={{ margin: 'auto', maxWidth: '600px' }}>
            <Card className="shadow-sm p-4 border-0">
                <h4 className="mb-4 text-center">회원정보 수정</h4>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>이메일</Form.Label>
                        <Form.Control type="email" value={profile.email} disabled />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>이름</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={profile.name || ''}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>전화번호</Form.Label>
                        <Form.Control
                            type="tel"
                            name="phone"
                            value={profile.phone || ''}
                            onChange={handleChange}
                            placeholder="010-1234-5678"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>비밀번호 변경 (선택)</Form.Label>
                        <Form.Control
                            type="password"
                            name="password"
                            onChange={handleChange}
                            placeholder="변경할 비밀번호를 입력하세요"
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 mb-3" onClick={() => navigate('/')}>
                        저장
                    </Button>
                    <Button variant="outline-danger" type="submit" className="w-100" onClick={handleDeleteAccount}>
                        회원탈퇴
                    </Button>
                </Form>
            </Card>
        </div>
    );
};

export default Profile;
