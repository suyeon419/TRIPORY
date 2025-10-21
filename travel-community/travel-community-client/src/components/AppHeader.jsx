// src/components/AppHeader.jsx
import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AppHeader = () => {
    const navigate = useNavigate();

    return (
        <Navbar expand="lg" fixed="top" className="shadow-sm">
            <Container>
                <Navbar.Brand
                    onClick={() => navigate('/')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                    <img src="./images/logo.png" alt="Tripory Logo" style={{ height: '60px' }} />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar" />
                <Navbar.Collapse id="main-navbar">
                    <Nav className="mx-auto">
                        <Nav.Link onClick={() => navigate('/')}>소개</Nav.Link>
                        <Nav.Link onClick={() => navigate('/posts')}>여행 후기</Nav.Link>
                        <Nav.Link onClick={() => navigate('/schedules')}>여행 일정</Nav.Link>
                        <Nav.Link onClick={() => navigate('/points')}>포인트</Nav.Link>
                        <Nav.Link onClick={() => navigate('/support')}>문의</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppHeader;
