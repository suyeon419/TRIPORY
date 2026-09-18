import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Accordion, Alert, Table } from 'react-bootstrap';
import { BsEnvelope, BsShieldLock } from 'react-icons/bs';
import api from '../api/axios';
import { getProfile } from '../api/auth';

const TYPE_LABELS = {
    general: '일반 문의',
    account: '계정 관련',
    bug: '버그 / 오류 신고',
    suggestion: '기능 제안',
};

const Support = () => {
    const [form, setForm] = useState({
        type: 'general',
        message: '',
    });
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const [myRole, setMyRole] = useState(null);
    const [checkingRole, setCheckingRole] = useState(true);
    const [inquiries, setInquiries] = useState([]);
    const [loadingInquiries, setLoadingInquiries] = useState(false);

    // 로그인한 사용자의 권한 확인 (관리자면 문의 목록을 보여주기 위함)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCheckingRole(false);
            return;
        }
        getProfile()
            .then((res) => setMyRole(res.user.role))
            .catch(() => setMyRole(null))
            .finally(() => setCheckingRole(false));
    }, []);

    // 관리자: 접수된 문의 목록 조회
    useEffect(() => {
        if (myRole !== 'admin') return;

        setLoadingInquiries(true);
        api.get('/inquiries')
            .then((res) => setInquiries(res.data.data || []))
            .catch((err) => console.error('문의 목록 조회 실패:', err))
            .finally(() => setLoadingInquiries(false));
    }, [myRole]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/inquiries', form);
            setSuccess(true);
            setForm({ type: 'general', message: '' });
        } catch (err) {
            alert(err.response?.data?.message || '문의 전송에 실패했습니다.');
        } finally {
            setSending(false);
        }
    };

    if (checkingRole) return <p className="text-center mt-5">불러오는 중...</p>;

    // 관리자는 문의를 작성할 필요가 없으므로, 접수된 문의 목록을 대신 보여준다.
    if (myRole === 'admin') {
        return (
            <div style={{ maxWidth: '1000px', margin: 'auto', padding: '20px' }}>
                <h4 className="mb-4">
                    <BsShieldLock className="me-2" />
                    접수된 문의 목록
                </h4>

                <Card className="p-4 shadow-sm border-0" style={{ borderRadius: '14px' }}>
                    {loadingInquiries ? (
                        <p className="text-muted mb-0">불러오는 중...</p>
                    ) : inquiries.length === 0 ? (
                        <p className="text-muted mb-0">접수된 문의가 없습니다.</p>
                    ) : (
                        <Table bordered hover responsive className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>번호</th>
                                    <th>유형</th>
                                    <th>작성자</th>
                                    <th>이메일</th>
                                    <th>내용</th>
                                    <th>접수일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inquiries.map((inq, idx) => (
                                    <tr key={inq.inquiry_id}>
                                        <td>{idx + 1}</td>
                                        <td>{TYPE_LABELS[inq.type] || inq.type}</td>
                                        <td>{inq.name}</td>
                                        <td>{inq.email}</td>
                                        <td style={{ whiteSpace: 'pre-wrap' }}>{inq.message}</td>
                                        <td>{inq.created_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px' }}>
            <h4 className="mb-4">
                <BsEnvelope className="me-2" />
                문의하기
            </h4>

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
                        문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
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
                            네, 마이페이지 내 활동 내가 쓴 글에서 수정 또는 삭제가 가능합니다.
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
