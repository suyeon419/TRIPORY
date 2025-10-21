import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Accordion, Alert } from 'react-bootstrap';
import api from '../api/axios';

const Support = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        type: 'general',
        message: '',
    });
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            // ✅ 추후 백엔드 연결 시 여기에 api.post('/inquiry', form)
            console.log('문의 내용:', form);
            await new Promise((r) => setTimeout(r, 1000)); // 더미 지연
            setSuccess(true);
            setForm({ name: '', email: '', type: 'general', message: '' });
        } catch (err) {
            alert('문의 전송에 실패했습니다.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px' }}>
            <h4 className="mb-4">📮 문의하기</h4>

            {/* 상단 안내 카드 */}
            <Card className="p-4 mb-4 shadow-sm border-0" style={{ borderRadius: '14px' }}>
                <h5 className="fw-bold mb-2">무엇을 도와드릴까요?</h5>
                <p className="text-muted mb-0" style={{ fontSize: '.9rem' }}>
                    서비스 이용 중 궁금한 점이나 불편 사항이 있으신가요?
                    <br />
                    아래 양식을 작성하시면 빠르게 확인 후 답변드리겠습니다.
                </p>
            </Card>

            {/* 문의 폼 */}
            <Card className="p-4 shadow-sm border-0 mb-4" style={{ borderRadius: '14px' }}>
                <h6 className="fw-bold mb-3">문의 내용 작성</h6>

                {success && (
                    <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
                        문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다 😊
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>이름</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="이름 입력"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>이메일</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="example@tripory.com"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>문의 유형</Form.Label>
                        <Form.Select name="type" value={form.type} onChange={handleChange}>
                            <option value="general">일반 문의</option>
                            <option value="account">계정 관련</option>
                            <option value="bug">버그 / 오류 신고</option>
                            <option value="suggestion">기능 제안</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>내용</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={5}
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            placeholder="문의하실 내용을 자세히 적어주세요."
                            required
                        />
                    </Form.Group>

                    <div className="text-end">
                        <Button type="submit" variant="primary" disabled={sending}>
                            {sending ? '전송 중...' : '문의 전송'}
                        </Button>
                    </div>
                </Form>
            </Card>

            {/* 자주 묻는 질문 */}
            <Card className="p-4 shadow-sm border-0" style={{ borderRadius: '14px' }}>
                <h6 className="fw-bold mb-3">자주 묻는 질문 (FAQ)</h6>
                <Accordion>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>포인트는 어떻게 적립되나요?</Accordion.Header>
                        <Accordion.Body>
                            후기 작성, 댓글 작성, 일정 공유 등의 활동에 따라 자동으로 포인트가 적립됩니다. 포인트 관련
                            세부 규칙은 추후 공지될 예정입니다.
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1">
                        <Accordion.Header>작성한 후기를 수정하거나 삭제할 수 있나요?</Accordion.Header>
                        <Accordion.Body>
                            네, 마이페이지 → 내 활동 → 내가 쓴 글에서 수정 또는 삭제가 가능합니다.
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="2">
                        <Accordion.Header>공개 일정을 다른 사용자와 공유할 수 있나요?</Accordion.Header>
                        <Accordion.Body>
                            네, Tripory에서는 공개된 일정을 복사하여 자신의 일정으로 가져올 수 있습니다. (해당 기능은
                            업데이트 예정입니다.)
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Card>
        </div>
    );
};

export default Support;
