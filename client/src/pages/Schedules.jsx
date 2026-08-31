import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Nav, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Schedules = () => {
    const [mySchedules, setMySchedules] = useState([]);
    const [publicSchedules, setPublicSchedules] = useState([]);
    const [activeTab, setActiveTab] = useState('public');
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [searching, setSearching] = useState(false);
    const navigate = useNavigate();

    // ✅ 토큰 변화를 감지하기 위한 state
    const [token, setToken] = useState(localStorage.getItem('token'));

    // ✅ 토큰이 변경될 때마다 다시 읽어오기
    useEffect(() => {
        const handleStorageChange = () => {
            setToken(localStorage.getItem('token'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        const fetchSchedules = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setIsLoggedIn(true);
                } else {
                    delete api.defaults.headers.common['Authorization'];
                    setIsLoggedIn(false);
                }

                const publicRes = await api.get('/schedules/public');
                setPublicSchedules(publicRes.data.data);

                if (token) {
                    const myRes = await api.get('/schedules/my');
                    setMySchedules(myRes.data.data);
                } else {
                    setMySchedules([]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();

        // ✅ Sidebar에서 authChange 이벤트를 감지하면 다시 실행
        const handleAuthChange = () => fetchSchedules();
        window.addEventListener('authChange', handleAuthChange);

        return () => window.removeEventListener('authChange', handleAuthChange);
    }, []);

    // ✅ 검색 실행 함수
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) {
            alert('검색어를 입력해주세요.');
            return;
        }

        setSearching(true);
        try {
            const res = await api.get(`/schedules/public?keyword=${encodeURIComponent(keyword)}`);
            setPublicSchedules(res.data.data);
        } catch (err) {
            console.error('검색 오류:', err);
            alert('검색 결과를 불러오지 못했습니다.');
        } finally {
            setSearching(false);
        }
    };

    if (loading)
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" />
            </div>
        );

    const renderList = (list) => (
        <div className="d-flex flex-column gap-3 mt-3">
            {list.length === 0 ? (
                <p className="text-muted">등록된 일정이 없습니다.</p>
            ) : (
                list.map((s) => (
                    <Card
                        key={s.schedule_id}
                        className="p-3 shadow-sm border-0"
                        style={{
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                        onClick={() => navigate(`/schedules/${s.schedule_id}`)}
                    >
                        <div>
                            <h5 className="fw-bold mb-1">{s.title}</h5>
                            <p className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                                {s.start_date} ~ {s.end_date}{' '}
                                <span className="text-secondary">
                                    ({s.nights}박 {s.days}일)
                                </span>
                            </p>
                            <small className={s.is_public === 'Y' ? 'text-success' : 'text-secondary'}>
                                {s.is_public === 'Y' ? '공개 일정' : '비공개 일정'}
                            </small>
                        </div>
                        <Button variant="outline-primary" size="sm" style={{ whiteSpace: 'nowrap' }}>
                            자세히 보기
                        </Button>
                    </Card>
                ))
            )}
        </div>
    );

    return (
        <div style={{ margin: 'auto', maxWidth: '900px', padding: '20px' }}>
            <h4 className="mb-4">📅 여행 일정</h4>

            {/* 🔍 검색바 (공개 일정 전용) */}
            <Form onSubmit={handleSearch} className="mb-4">
                <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="일정 제목 또는 장소명을 입력하세요"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <Button type="submit" variant="primary" disabled={searching}>
                        {searching ? '검색 중...' : '검색'}
                    </Button>
                </InputGroup>
            </Form>

            {/* 탭 메뉴 */}
            {isLoggedIn ? (
                <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav.Item>
                        <Nav.Link eventKey="my">내 일정</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="public">공개 일정</Nav.Link>
                    </Nav.Item>
                </Nav>
            ) : (
                // 로그인 안 되어 있으면 공개 일정만 표시
                <h6 className="mt-3 text-secondary">공개 일정</h6>
            )}

            {/* 탭 콘텐츠 */}
            {isLoggedIn && activeTab === 'my' ? renderList(mySchedules) : renderList(publicSchedules)}

            <div className="text-end mt-4">
                <Button variant="primary" onClick={() => (isLoggedIn ? navigate('/schedules/new') : navigate('/'))}>
                    ➕ 새 일정 만들기
                </Button>
            </div>
        </div>
    );
};

export default Schedules;
