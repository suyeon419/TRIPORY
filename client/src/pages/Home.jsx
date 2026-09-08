// src/pages/Home.jsx
import React, { useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Card, Badge, Carousel } from 'react-bootstrap';
import { BsEye, BsShieldCheck, BsChatDots, BsLightningCharge } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

const useReveal = () => {
    const refs = useRef([]);
    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('reveal-show');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.15 }
        );
        refs.current.forEach((el) => el && io.observe(el));
        return () => io.disconnect();
    }, []);
    return (el) => refs.current.push(el);
};

const Home = () => {
    const navigate = useNavigate();
    const reveal = useReveal();

    return (
        <>
            {/* 인라인 스타일: 프로젝트 테마(#00523D)와 부드러운 애니메이션 */}
            <style>{`
        .hero {
          position: relative;
          min-height: 72vh;
          display: flex;
          align-items: center;
          color: #fff;
          border-radius: 18px;
          overflow: hidden;
          background: #0a3d31;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }
        .hero::before {
          content: "";
          position: absolute; inset: 0;
          background: url("/images/hero-travel.jpg") center/cover no-repeat;
          opacity: .75;
          transform: scale(1.03);
          filter: saturate(1.05) contrast(1.05);
        }
        .hero::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55));
        }
        .hero-content {
          position: relative;
          z-index: 1;
        }
        .soft-card {
          border: 0;
          border-radius: 16px;
          box-shadow: 0 10px 24px rgba(0,0,0,.08);
          transition: transform .25s ease, box-shadow .25s ease;
          background: #fff;
        }
        .soft-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(0,0,0,.12);
        }
        .feature-icon {
          font-size: 28px;
          padding: 12px;
          border-radius: 12px;
          background: #eaf6f1;
          color: #00523D;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 54px; height: 54px;
        }
        .section-title {
          font-weight: 800;
          letter-spacing: -.2px;
        }
        .reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity .7s ease, transform .7s ease;
        }
        .reveal.reveal-show { opacity: 1; transform: translateY(0); }

        /* 광고 슬롯 (향후 교체 예정) */
        .ad-slot {
          background: linear-gradient(135deg, #f7faf9, #eef7f3);
          border: 1px dashed #b9d6cb;
          color: #3f6b5e;
        }

        .pill {
          background: #eaf6f1;
          color: #0e5f4b;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: .85rem;
          font-weight: 600;
        }

        .cta {
          background: linear-gradient(135deg, #00523D, #0a6a53);
          color: #fff;
          border-radius: 16px;
        }
      `}</style>

            {/* Hero */}
            <Container className="mt-4">
                <div className="hero px-4 px-md-5">
                    <Row className="w-100 hero-content align-items-center">
                        <Col md={7} className="py-5">
                            <div className="reveal" ref={reveal}>
                                <span className="pill d-inline-block mb-3">여행 후기 & 일정 커뮤니티</span>
                                <h1 className="display-5 fw-bold mb-3">
                                    Tripory — 보기 쉽고, 신뢰할 수 있고,
                                    <br />
                                    함께 채우는 여행
                                </h1>
                                <p className="lead mb-4" style={{ opacity: 0.95 }}>
                                    • <b>낮은 진입장벽</b>의 직관적 UI
                                    <br />• <b>광고 필터링</b>으로 담백한 정보
                                    <br />• <b>소통 중심</b> 커뮤니티 기능
                                    <br />• 공개 일정을 <b>한 번에 복사</b>해 쉽게 일정 생성
                                </p>
                                <div className="d-flex gap-2">
                                    <Button variant="light" size="lg" onClick={() => navigate('/posts')}>
                                        후기 보러가기
                                    </Button>
                                    <Button variant="outline-light" size="lg" onClick={() => navigate('/schedules')}>
                                        일정 둘러보기
                                    </Button>
                                </div>
                            </div>
                        </Col>
                        <Col md={5} className="py-5">
                            <div className="reveal" ref={reveal}>
                                {/* 우측 데모 이미지 (없으면 자동 대체) */}
                                <Card className="soft-card">
                                    <Card.Img
                                        alt="앱 미리보기"
                                        src="/images/preview-schedule.png"
                                        onError={(e) => {
                                            e.currentTarget.src = '/images/placeholder-map.jpg';
                                        }}
                                    />
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </div>
            </Container>

            {/* Features */}
            <Container className="my-5">
                <Row className="g-3">
                    <Col md={3} sm={6}>
                        <Card className="soft-card p-3 reveal" ref={reveal}>
                            <div className="feature-icon mb-2">
                                <BsEye />
                            </div>
                            <Card.Title className="fw-bold">낮은 진입장벽</Card.Title>
                            <Card.Text className="text-muted mb-2">누구나 바로 익숙해지는 인터페이스.</Card.Text>
                            <Badge bg="success" pill>
                                사용성 우선
                            </Badge>
                        </Card>
                    </Col>
                    <Col md={3} sm={6}>
                        <Card className="soft-card p-3 reveal" ref={reveal}>
                            <div className="feature-icon mb-2">
                                <BsShieldCheck />
                            </div>
                            <Card.Title className="fw-bold">광고 필터링</Card.Title>
                            <Card.Text className="text-muted mb-2">과한 광고는 걸러내고 핵심 정보에 집중.</Card.Text>
                            <Badge bg="success" pill>
                                신뢰도
                            </Badge>
                        </Card>
                    </Col>
                    <Col md={3} sm={6}>
                        <Card className="soft-card p-3 reveal" ref={reveal}>
                            <div className="feature-icon mb-2">
                                <BsChatDots />
                            </div>
                            <Card.Title className="fw-bold">커뮤니티</Card.Title>
                            <Card.Text className="text-muted mb-2">댓글·좋아요로 서로 질문하고 답하는 문화.</Card.Text>
                            <Badge bg="success" pill>
                                소통 중심
                            </Badge>
                        </Card>
                    </Col>
                    <Col md={3} sm={6}>
                        <Card className="soft-card p-3 reveal" ref={reveal}>
                            <div className="feature-icon mb-2">
                                <BsLightningCharge />
                            </div>
                            <Card.Title className="fw-bold">일정 복사</Card.Title>
                            <Card.Text className="text-muted mb-2">공개 일정을 내 일정으로 복사해 바로 사용.</Card.Text>
                            <Badge bg="success" pill>
                                쉽고 빠름
                            </Badge>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* How it works */}
            <Container className="my-5">
                <Row className="align-items-center g-4">
                    <Col md={6}>
                        <div className="reveal" ref={reveal}>
                            <Card className="soft-card p-4">
                                <span className="pill d-inline-block mb-2">How it works</span>
                                <h3 className="section-title mb-3">3단계로 끝내는 Tripory</h3>
                                <ol className="mb-0" style={{ lineHeight: 1.9 }}>
                                    <li>
                                        <b>후기 탐색:</b> 지역·키워드로 진짜 후기만 추려보기
                                    </li>
                                    <li>
                                        <b>일정 복사:</b> 마음에 드는 공개 일정을 한 번에 복제
                                    </li>
                                    <li>
                                        <b>커스텀:</b> 내 일정에 장소 추가·메모·예약 배지로 마무리
                                    </li>
                                </ol>
                            </Card>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="reveal" ref={reveal}>
                            <Card className="soft-card overflow-hidden">
                                <Card.Img
                                    alt="How it works"
                                    src="/images/how-it-works.jpg"
                                    onError={(e) => {
                                        e.currentTarget.src = '/images/placeholder-steps.jpg';
                                    }}
                                />
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* 커뮤니티 하이라이트 / 광고 슬롯(추후) */}
            <Container className="my-5">
                <Row className="g-4">
                    <Col md={8}>
                        <div className="reveal" ref={reveal}>
                            <Card className="soft-card p-4">
                                <h4 className="section-title mb-2">여행은 함께일 때 더 즐거워요</h4>
                                <p className="text-muted mb-3">
                                    Tripory 커뮤니티에서 질문하고, 팁을 공유하고, 다음 여행 메이트를 만나보세요.
                                </p>
                                <div className="d-flex gap-2">
                                    <Button variant="primary" onClick={() => navigate('/posts')}>
                                        인기 후기 보기
                                    </Button>
                                    <Button variant="outline-primary" onClick={() => navigate('/schedules')}>
                                        공개 일정 보기
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </Col>
                    <Col md={4}>
                        <div className="reveal" ref={reveal}>
                            {/* 광고 이미지 슬라이더 */}
                            <Card className="soft-card overflow-hidden ad-slot text-center p-0">
                                <Carousel fade interval={3500} pause="hover">
                                    <Carousel.Item>
                                        <img
                                            className="d-block w-100"
                                            src="/images/ad1.jpg"
                                            alt="광고 1"
                                            style={{ objectFit: 'cover', height: '160px' }}
                                        />
                                    </Carousel.Item>

                                    <Carousel.Item>
                                        <img
                                            className="d-block w-100"
                                            src="/images/ad2.jpg"
                                            alt="광고 2"
                                            style={{ objectFit: 'cover', height: '160px' }}
                                        />
                                    </Carousel.Item>

                                    <Carousel.Item>
                                        <img
                                            className="d-block w-100"
                                            src="/images/ad3.jpg"
                                            alt="광고 3"
                                            style={{ objectFit: 'cover', height: '160px' }}
                                        />
                                    </Carousel.Item>
                                </Carousel>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* CTA */}
            <Container className="my-5">
                <div className="cta p-4 p-md-5 text-center reveal" ref={reveal}>
                    <h3 className="fw-bold mb-2">지금 바로 Tripory와 떠나볼까요?</h3>
                    <p className="mb-4" style={{ opacity: 0.9 }}>
                        첫 후기 작성, 혹은 첫 일정 만들기로 여러분의 경험을 나눠주세요.
                    </p>
                    <div className="d-flex gap-2 justify-content-center">
                        <Button size="lg" variant="light" onClick={() => navigate('/posts/new')}>
                            후기 작성
                        </Button>
                        <Button size="lg" variant="outline-light" onClick={() => navigate('/schedules/new')}>
                            일정 만들기
                        </Button>
                    </div>
                </div>
            </Container>
        </>
    );
};

export default Home;
