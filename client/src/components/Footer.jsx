import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer
            style={{
                backgroundColor: '#f8fdfb',
                borderTop: '1px solid #e0ece7',
                padding: '30px 0',
                marginTop: '60px',
            }}
        >
            <Container>
                <Row className="gy-3">
                    <Col md={4} sm={12}></Col>

                    <Col md={4} sm={6}>
                        <h6 className="fw-bold mb-2">바로가기</h6>
                        <ul className="list-unstyled" style={{ fontSize: '.9rem' }}>
                            <li>
                                <Link to="/" className="text-decoration-none text-muted">
                                    홈
                                </Link>
                            </li>
                            <li>
                                <Link to="/schedules" className="text-decoration-none text-muted">
                                    일정 보기
                                </Link>
                            </li>
                            <li>
                                <Link to="/points" className="text-decoration-none text-muted">
                                    포인트
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-decoration-none text-muted">
                                    문의하기
                                </Link>
                            </li>
                        </ul>
                    </Col>

                    <Col md={4} sm={6}>
                        <h6 className="fw-bold mb-2">고객지원</h6>
                        <ul className="list-unstyled mb-0" style={{ fontSize: '.9rem' }}>
                            <li>이메일: lsyeon030419@kumoh.ac.kr</li>
                            <li>운영시간: 평일 10:00 ~ 18:00</li>
                            <li className="text-muted mt-2">
                                ⓒ {new Date().getFullYear()} Tripory. All rights reserved.
                            </li>
                        </ul>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
