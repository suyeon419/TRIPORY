import React, { useState } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const NewSchedule = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isPublic, setIsPublic] = useState('N');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !startDate || !endDate) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert('시작일이 종료일보다 늦을 수 없습니다.');
            return;
        }

        try {
            setLoading(true);

            const res = await api.post('/schedules', {
                title,
                start_date: startDate,
                end_date: endDate,
                is_public: isPublic,
            });

            if (res.data.ok) {
                alert('새 일정이 등록되었습니다!');
                navigate('/schedules');
            } else {
                alert(res.data.message || '등록에 실패했습니다.');
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || '서버 오류');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ margin: 'auto', maxWidth: '700px', padding: '20px' }}>
            <Card className="shadow-sm border-0 p-4">
                <h4 className="mb-4 text-center">✈️ 새 여행 일정 만들기</h4>

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>일정 제목</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="일정명을 입력하세요."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>여행 기간</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                            <span className="mt-2">~</span>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>공개 여부</Form.Label>
                        <Form.Select value={isPublic} onChange={(e) => setIsPublic(e.target.value)}>
                            <option value="N">비공개</option>
                            <option value="Y">공개</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                            공개 일정으로 설정 시 다른 사용자도 볼 수 있습니다.
                        </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => navigate('/schedules')} disabled={loading}>
                            취소
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? '등록 중...' : '등록하기'}
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default NewSchedule;
