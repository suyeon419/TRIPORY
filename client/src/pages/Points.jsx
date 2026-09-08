import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Badge, Spinner } from 'react-bootstrap';
import { BsGift } from 'react-icons/bs';
import api from '../api/axios';

const Points = () => {
    const [points, setPoints] = useState(0);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 실제 포인트 가져오기
                const statsRes = await api.get('/users/stats');
                const myPoints = statsRes.data.stats.points;
                setPoints(myPoints);

                // 더미 쿠폰 (확장 가능 구조)
                setCoupons([
                    {
                        id: 1,
                        title: '숙소 10% 할인 쿠폰',
                        desc: 'Tripory 제휴 숙소에서 사용 가능',
                        requiredPoints: 1000,
                        expiresAt: '2025-12-31',
                    },
                    {
                        id: 2,
                        title: '카페 음료 1+1 쿠폰',
                        desc: '전국 주요 여행지 내 제휴 카페',
                        requiredPoints: 1500,
                        expiresAt: '2025-11-15',
                    },
                    {
                        id: 3,
                        title: '렌터카 20% 할인권',
                        desc: '지정 렌터카 업체 한정',
                        requiredPoints: 2500,
                        expiresAt: '2025-12-31',
                    },
                    {
                        id: 4,
                        title: '여행용품 5,000원 할인쿠폰',
                        desc: 'Tripory 마켓 오픈 시 사용 가능',
                        requiredPoints: 2000,
                        expiresAt: '2026-01-30',
                    },
                ]);
            } catch (err) {
                console.error('포인트 조회 오류:', err);
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
        <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px' }}>
            <h4 className="mb-4">
                <BsGift className="me-2" />
                포인트 사용처
            </h4>

            {/* 내 포인트 카드 */}
            <Card className="p-4 mb-4 shadow-sm border-0 text-center" style={{ borderRadius: '14px' }}>
                <h5 className="fw-bold mb-2">내 포인트</h5>
                <h2 className="fw-bold text-primary mb-3">{points.toLocaleString()}P</h2>
                <p className="text-muted mb-0" style={{ fontSize: '.9rem' }}>
                    포인트는 후기 작성, 댓글, 일정 공유 등으로 적립됩니다.
                </p>
            </Card>

            {/* 쿠폰 목록 */}
            <Row xs={1} md={2} className="g-4">
                {coupons.map((c) => {
                    const canUse = points >= c.requiredPoints;
                    return (
                        <Col key={c.id}>
                            <Card
                                className="shadow-sm border-0 p-3"
                                style={{
                                    borderRadius: '14px',
                                    backgroundColor: canUse ? 'white' : '#f8f9fa',
                                    opacity: canUse ? 1 : 0.7,
                                }}
                            >
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <h6 className="fw-bold mb-0">{c.title}</h6>
                                        <Badge bg={canUse ? 'success' : 'secondary'}>
                                            {canUse ? '교환 가능' : '포인트 부족'}
                                        </Badge>
                                    </div>
                                    <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                                        {c.desc}
                                    </p>
                                    <p className="text-secondary mb-3" style={{ fontSize: '0.8rem' }}>
                                        유효기간: {c.expiresAt}
                                    </p>
                                    <Button
                                        variant={canUse ? 'primary' : 'outline-secondary'}
                                        size="sm"
                                        disabled={!canUse}
                                        onClick={() => alert(`'${c.title}' 쿠폰을 교환했습니다! (더미)`)}
                                    >
                                        {c.requiredPoints.toLocaleString()}P로 교환
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

export default Points;
