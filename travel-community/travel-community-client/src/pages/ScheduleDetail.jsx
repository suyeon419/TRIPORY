import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Modal, Form } from 'react-bootstrap';
import api from '../api/axios';
import axios from 'axios';

const ScheduleDetail = () => {
    const { scheduleId } = useParams();
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState(null);
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null); // 로그인한 유저 ID

    // 장소 추가 관련 상태
    const [showModal, setShowModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [newPlace, setNewPlace] = useState({
        name: '',
        address: '',
        memo: '',
        is_reserved: 'N',
    });

    // 장소명 변경 핸들러
    const handleNameChange = (e) => {
        const name = e.target.value;
        setNewPlace((prev) => ({ ...prev, name }));
    };

    // 주소 검색
    const handleSearchAddress = async () => {
        const name = newPlace.name.trim();
        if (!name) {
            alert('장소명을 입력해주세요.');
            return;
        }

        const KAKAO_KEY = '81055070c6f64c7dfaece23c6d4d8a41'; // REST API 키

        try {
            console.log('🔍 검색 요청 시작:', name);
            const res = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
                headers: {
                    Authorization: `KakaoAK ${KAKAO_KEY.trim()}`,
                    'Content-Type': 'application/json;charset=UTF-8',
                },
                params: { query: name },
            });

            if (!res.data.documents || res.data.documents.length === 0) {
                alert('검색 결과가 없습니다.');
                return;
            }

            const first = res.data.documents[0];
            const address =
                first.road_address_name && first.road_address_name.trim() !== ''
                    ? first.road_address_name
                    : first.address_name;

            setNewPlace((prev) => ({
                ...prev,
                address,
            }));
        } catch (err) {
            console.error('주소 자동입력 오류:', err.response?.status, err.response?.data || err.message);
            alert('주소를 불러오지 못했습니다.');
        }
    };

    // JWT 토큰에서 user_id 가져오기
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                // ✅ 숫자 타입으로 변환 (문자열 비교 방지)
                setUserId(Number(payload.user_id));
            } catch (err) {
                console.warn('토큰 파싱 오류:', err);
            }
        }
    }, []);

    // 일정 데이터 불러오기
    useEffect(() => {
        fetchSchedule();
    }, [scheduleId]);

    const fetchSchedule = async () => {
        try {
            const res = await api.get(`/schedules/${scheduleId}`);
            if (res.data.ok) {
                console.log('서버에서 받은 일정:', res.data.data.schedule);
                setSchedule(res.data.data.schedule);
                setDays(res.data.data.days);
            } else {
                alert(res.data.message || '일정을 불러오지 못했습니다.');
            }
        } catch (err) {
            console.error('일정 상세 불러오기 오류:', err);
        } finally {
            setLoading(false);
        }
    };

    // 날짜 포맷
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        const offsetDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        return offsetDate.toISOString().split('T')[0];
    };

    // 장소 추가 모달 열기
    const handleOpenModal = (day) => {
        setSelectedDay(day);
        setNewPlace({
            name: '',
            address: '',
            memo: '',
            is_reserved: 'N',
        });
        setShowModal(true);
    };

    // 장소 추가
    const handleAddPlace = async (e) => {
        e.preventDefault();
        if (!newPlace.name || !newPlace.address) {
            alert('장소명과 주소는 필수 입력 항목입니다.');
            return;
        }

        try {
            await api.post(`/schedules/${selectedDay.day_id}/places`, newPlace);
            alert('새 장소가 추가되었습니다!');
            setShowModal(false);
            fetchSchedule(); // 새로고침
        } catch (err) {
            console.error('장소 추가 오류:', err);
            alert(err.response?.data?.message || '등록 실패');
        }
    };

    if (loading)
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" />
            </div>
        );

    if (!schedule) return <p className="text-center mt-5">일정을 찾을 수 없습니다.</p>;

    return (
        <div style={{ margin: 'auto', maxWidth: '900px', padding: '20px' }}>
            <Card className="shadow-sm border-0 p-4">
                {/* 일정 정보 */}
                <div className="mb-3">
                    <h4 className="fw-bold">{schedule.title}</h4>
                    <p className="text-muted mb-1">
                        {formatDate(schedule.start_date)} ~ {formatDate(schedule.end_date)}{' '}
                        <span className="text-secondary">
                            (
                            {schedule.nights && schedule.days
                                ? `${schedule.nights}박 ${schedule.days}일`
                                : '일정 계산 중'}
                            )
                        </span>
                    </p>
                    <small className={schedule.is_public === 'Y' ? 'text-success' : 'text-secondary'}>
                        {schedule.is_public === 'Y' ? '공개 일정' : '비공개 일정'}
                    </small>
                </div>

                <hr />

                {/* Day별 일정 */}
                {days.map((day) => (
                    <div key={day.day_id} className="mb-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-success mb-0">
                                📅 Day {day.day_order} ({formatDate(day.date)})
                            </h6>

                            {/* 작성자만 버튼 표시 */}
                            {userId === Number(schedule.user_id) && (
                                <Button size="sm" variant="outline-primary" onClick={() => handleOpenModal(day)}>
                                    ➕ 장소 추가
                                </Button>
                            )}
                        </div>

                        {day.places && day.places.length > 0 ? (
                            <div className="timeline">
                                {day.places.map((place, idx) => (
                                    <div
                                        key={place.place_id}
                                        className="timeline-item d-flex mb-3"
                                        style={{ gap: '12px' }}
                                    >
                                        {/* 타임라인 점 */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#007bff',
                                                    marginBottom: '4px',
                                                }}
                                            ></div>
                                            {idx !== day.places.length - 1 && (
                                                <div
                                                    style={{
                                                        width: '2px',
                                                        height: '95px',
                                                        backgroundColor: '#ccc',
                                                    }}
                                                ></div>
                                            )}
                                        </div>

                                        {/* 장소 카드 */}
                                        <div
                                            className="p-3 rounded shadow-sm flex-grow-1"
                                            style={{
                                                backgroundColor: '#f9fafb',
                                                border: '1px solid #e0e0e0',
                                            }}
                                        >
                                            <h5 className="fw-bold mb-2 text-dark">{place.name}</h5>
                                            {place.address && (
                                                <p className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
                                                    📍 {place.address}
                                                </p>
                                            )}
                                            {place.memo && (
                                                <p
                                                    className="mb-1"
                                                    style={{
                                                        fontSize: '0.95rem',
                                                        color: '#555',
                                                    }}
                                                >
                                                    ✏️ {place.memo}
                                                </p>
                                            )}
                                            {place.is_reserved === 'Y' && (
                                                <span className="badge bg-info text-dark mt-1">예약 필요</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted ms-2">장소가 아직 등록되지 않았습니다.</p>
                        )}
                    </div>
                ))}

                <div className="text-end mt-4">
                    <Button variant="secondary" onClick={() => navigate('/schedules')}>
                        목록으로
                    </Button>
                </div>
            </Card>

            {/* 장소 추가 모달 */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>장소 추가 (Day {selectedDay?.day_order})</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddPlace}>
                        {/* 장소명 입력 */}
                        <Form.Group className="mb-3">
                            <Form.Label>장소명</Form.Label>
                            <div className="d-flex gap-2 align-items-stretch">
                                <Form.Control
                                    type="text"
                                    placeholder="장소를 입력해주세요."
                                    value={newPlace.name}
                                    onChange={handleNameChange}
                                    required
                                    style={{ height: '40px' }}
                                />
                                <Button
                                    variant="outline-primary"
                                    type="button"
                                    onClick={handleSearchAddress}
                                    style={{
                                        width: '80px',
                                        height: '40px',
                                        lineHeight: '1.2',
                                        padding: '0',
                                    }}
                                >
                                    검색
                                </Button>
                            </div>
                            <Form.Text className="text-muted">입력 후 '주소 검색' 버튼을 눌러주세요.</Form.Text>
                        </Form.Group>

                        {/* 자동 채워지는 주소 */}
                        <Form.Group className="mb-3">
                            <Form.Label>주소</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="자동으로 입력됩니다"
                                value={newPlace.address}
                                readOnly
                            />
                        </Form.Group>

                        {/* 메모 */}
                        <Form.Group className="mb-3">
                            <Form.Label>메모</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="메모를 입력하세요"
                                value={newPlace.memo}
                                onChange={(e) => setNewPlace({ ...newPlace, memo: e.target.value })}
                            />
                        </Form.Group>

                        {/* 예약 필요 여부 */}
                        <Form.Group className="mb-3">
                            <Form.Label>예약 필요 여부</Form.Label>
                            <Form.Select
                                value={newPlace.is_reserved}
                                onChange={(e) =>
                                    setNewPlace({
                                        ...newPlace,
                                        is_reserved: e.target.value,
                                    })
                                }
                            >
                                <option value="N">아니오</option>
                                <option value="Y">예</option>
                            </Form.Select>
                        </Form.Group>

                        <div className="text-end">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                취소
                            </Button>{' '}
                            <Button variant="primary" type="submit">
                                등록
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ScheduleDetail;
