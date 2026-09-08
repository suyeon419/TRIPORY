import React, { useEffect, useState } from 'react';
import { Table, Spinner, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AdminLoginHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/users/admin/login-history');
                setLogs(res.data.data || []);
            } catch (err) {
                const status = err.response?.status;
                if (status === 401 || status === 403) {
                    setForbidden(true);
                } else {
                    console.error('전체 로그인 이력 불러오기 오류:', err);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading)
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" />
            </div>
        );

    if (forbidden)
        return (
            <div style={{ maxWidth: '480px', margin: '80px auto', padding: '20px' }}>
                <Card className="p-4 shadow-sm border-0 text-center" style={{ borderRadius: '14px' }}>
                    <div style={{ fontSize: '2rem' }}>🔒</div>
                    <h6 className="fw-bold mt-2 mb-1">접근 권한이 없습니다</h6>
                    <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                        관리자만 볼 수 있는 페이지예요.
                    </p>
                    <Button variant="primary" size="sm" onClick={() => navigate('/')}>
                        홈으로 이동
                    </Button>
                </Card>
            </div>
        );

    return (
        <div style={{ maxWidth: '1000px', margin: '80px auto', padding: '20px' }}>
            <h4 className="fw-bold mb-4">🛡️ [관리자] 전체 로그인 이력</h4>

            {logs.length === 0 ? (
                <p className="text-muted">로그인 기록이 없습니다.</p>
            ) : (
                <Table bordered hover responsive className="shadow-sm">
                    <thead className="table-light">
                        <tr>
                            <th>번호</th>
                            <th>이름</th>
                            <th>이메일</th>
                            <th>로그인 일자</th>
                            <th>로그아웃 일자</th>
                            <th>IP 주소</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, idx) => (
                            <tr key={log.log_id}>
                                <td>{idx + 1}</td>
                                <td>{log.name}</td>
                                <td>{log.email}</td>
                                <td>{log.login_time || '-'}</td>
                                <td>{log.logout_time || '-'}</td>
                                <td>{log.ip_address || 'unknown'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <div className="text-center mt-4">
                <Button variant="outline-secondary" onClick={() => navigate('/')}>
                    ← 홈으로
                </Button>
            </div>
        </div>
    );
};

export default AdminLoginHistory;
