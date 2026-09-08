import React, { useEffect, useState } from 'react';
import { Table, Spinner, Button } from 'react-bootstrap';
import { BsClockHistory, BsArrowLeft } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const LoginHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/users/login-history');
                setLogs(res.data.data || []);
            } catch (err) {
                console.error('로그인 이력 불러오기 오류:', err);
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

    return (
        <div style={{ maxWidth: '900px', margin: '80px auto', padding: '20px' }}>
            <h4 className="fw-bold mb-4">
                <BsClockHistory className="me-2" />
                로그인 이력
            </h4>

            {logs.length === 0 ? (
                <p className="text-muted">로그인 기록이 없습니다.</p>
            ) : (
                <Table bordered hover responsive className="shadow-sm">
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: '15%' }}>번호</th>
                            <th style={{ width: '30%' }}>로그인 일자</th>
                            <th style={{ width: '30%' }}>로그아웃 일자</th>
                            <th style={{ width: '25%' }}>IP 주소</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, idx) => (
                            <tr key={log.log_id}>
                                <td>{idx + 1}</td>
                                <td>{log.login_time || '-'}</td>
                                <td>{log.logout_time || '-'}</td>
                                <td>{log.ip_address || 'unknown'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <div className="text-center mt-4">
                <Button variant="outline-secondary" onClick={() => navigate('/my-activity')}>
                    <BsArrowLeft className="me-1" />
                    내 활동으로 돌아가기
                </Button>
            </div>
        </div>
    );
};

export default LoginHistory;
