import React, { useEffect, useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('latest');
    const [region, setRegion] = useState('');
    const navigate = useNavigate();

    console.log('posts');

    const regions = [
        '서울',
        '경기',
        '충북',
        '충남',
        '대전',
        '강원',
        '전북',
        '전남',
        '광주',
        '경북',
        '경남',
        '대구',
        '부산',
        '울산',
        '인천',
        '세종',
        '제주',
    ];

    // 후기 목록 불러오기
    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/posts', {
                params: {
                    filter: filter === 'all' ? undefined : filter,
                    sort: sort === 'latest' ? undefined : sort,
                    region: region || undefined,
                },
            });
            setPosts(res.data.data);
        } catch (err) {
            console.error('후기 목록 불러오기 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [filter, sort, region]);

    if (loading) return <p className="text-center mt-5">로딩 중...</p>;

    return (
        <div style={{ margin: 'auto', maxWidth: '1000px', padding: '20px' }}>
            <h3 className="mb-4 text-center">여행 후기</h3>

            {/* ===== 필터 영역 ===== */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex gap-2 flex-wrap">
                    <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: '140px' }}>
                        <option value="all">전체 글</option>
                        <option value="noads">일반 후기</option>
                        <option value="ads">광고 후기</option>
                    </Form.Select>

                    <Form.Select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: '140px' }}>
                        <option value="latest">최신순</option>
                        <option value="popular">좋아요순</option>
                        <option value="disliked">싫어요순</option>
                    </Form.Select>

                    <Form.Select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: '160px' }}>
                        <option value="">전체 지역</option>
                        {regions.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </Form.Select>
                </div>

                <Button variant="primary" onClick={() => navigate('/posts/new')}>
                    후기 작성 ✏️
                </Button>
            </div>

            {/* ===== 후기 목록 ===== */}
            {posts.length === 0 ? (
                <p className="text-center mt-4">등록된 후기가 없습니다.</p>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {posts.map((post) => (
                        <Card
                            key={post.post_id}
                            className="shadow-sm border-0"
                            style={{
                                cursor: 'pointer',
                                borderRadius: '12px',
                                padding: '15px 20px',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s ease',
                            }}
                            onClick={() => navigate(`/posts/${post.post_id}`)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fbfa')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                        >
                            <div style={{ flex: 1 }}>
                                <h6 className="mb-1">{post.title}</h6>
                                <div style={{ fontSize: '0.9rem', color: 'gray' }}>
                                    📍 {post.region || '지역 정보 없음'} | 작성자: {post.author_name}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', minWidth: '160px' }}>
                                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                                    👍 {post.likes} / 👎 {post.dislikes}
                                </div>
                                <small className="text-muted">
                                    {post.created_at
                                        ? new Date(post.created_at).toLocaleDateString('ko-KR', {
                                              year: 'numeric',
                                              month: '2-digit',
                                              day: '2-digit',
                                          })
                                        : ''}
                                </small>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Posts;
