import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const MyActivity = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        posts: { written: 0 },
        schedules: { created: 0 },
        likes: 0,
        dislikes: 0,
        points: 0,
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get('/users/profile');
                const statsRes = await api.get('/users/stats');
                setUser(userRes.data.user);
                setStats(statsRes.data.stats);
            } catch (err) {
                console.error('활동 통계 불러오기 오류:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading)
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" />
            </div>
        );

    return (
        <div style={{ maxWidth: '900px', margin: '80px auto', padding: '20px' }}>
            {/* 상단 인사 */}
            <h4 className="fw-bold mb-2">마이페이지</h4>
            <p className="text-muted mb-4">
                {user?.name}님 안녕하세요! <br />
                <small>{user?.email}</small>
            </p>

            {/* 포인트 및 뱃지 */}
            <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: '14px' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="fw-bold mb-1 text-success">여행 초보</h6>
                        <small className="text-muted">여행이 아직 어려워요!</small>
                    </div>
                    <Button variant="outline-primary" size="sm">
                        뱃지변경
                    </Button>
                </div>
                <div className="mt-3 text-end">
                    <span className="fw-bold text-secondary">포인트</span>{' '}
                    <span className="fw-bold fs-5 text-dark">{stats.points} P</span>
                </div>
            </Card>

            {/* 활동 카드 */}
            <Row className="text-center g-3">
                <Col xs={6} md={3}>
                    <Card
                        className="p-3 shadow-sm border-0"
                        onClick={() => navigate('/my-posts')}
                        style={{ borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <div className="fw-bold fs-5 text-primary">{stats.posts.written}</div>
                        <small className="text-muted">내가 쓴 글</small>
                    </Card>
                </Col>

                <Col xs={6} md={3}>
                    <Card
                        className="p-3 shadow-sm border-0"
                        onClick={() => navigate('/my-schedules')}
                        style={{ borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <div className="fw-bold fs-5 text-primary">{stats.schedules.created}</div>
                        <small className="text-muted">나의 일정</small>
                    </Card>
                </Col>

                <Col xs={6} md={3}>
                    <Card
                        className="p-3 shadow-sm border-0"
                        onClick={() => navigate('/my-likes')}
                        style={{ borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <div className="fw-bold fs-5 text-primary">{stats.posts.likes || 0}</div>
                        <small className="text-muted">좋아요</small>
                    </Card>
                </Col>

                <Col xs={6} md={3}>
                    <Card
                        className="p-3 shadow-sm border-0"
                        onClick={() => navigate('/my-dislikes')}
                        style={{ borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <div className="fw-bold fs-5 text-primary">{stats.posts.dislikes || 0}</div>
                        <small className="text-muted">싫어요</small>
                    </Card>
                </Col>
            </Row>

            {/* 로그인 이력 버튼 */}
            <div className="text-center mt-5">
                <h6 className="mb-3 text-muted">내 로그인 기록을 확인해보세요</h6>
                <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate('/login-history')}
                    style={{ borderRadius: '8px', padding: '6px 20px' }}
                >
                    로그인 이력 보기
                </Button>
            </div>
        </div>
    );
};

export default MyActivity;
