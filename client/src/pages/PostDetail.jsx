import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Form } from 'react-bootstrap';
import api, { API_BASE_URL } from '../api/axios';

const PostDetail = () => {
    const { postId } = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [images, setImages] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');

    // 후기 상세 조회
    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                const res = await api.get(`/posts/${postId}`);
                if (res.data.ok) {
                    setPost(res.data.data.post);
                    setImages(res.data.data.images);
                    setComments(res.data.data.comments);
                } else {
                    alert(res.data.message || '게시글을 불러올 수 없습니다.');
                }
            } catch (err) {
                console.error('상세 조회 실패:', err);
                alert('게시글을 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchPostDetail();
    }, [postId]);

    // 댓글 등록
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return alert('댓글을 입력해주세요.');

        try {
            await api.post(`/comments/${postId}`, {
                content: commentText,
            });
            alert('댓글이 등록되었습니다.');
            setCommentText('');

            // 댓글 목록 새로고침
            const res = await api.get(`/comments/${postId}`);
            setComments(res.data.comments);
        } catch (err) {
            alert(err.response?.data?.message || '댓글 등록 실패');
        }
    };

    if (loading) return <p className="text-center mt-5">불러오는 중...</p>;
    if (!post) return <p className="text-center mt-5">게시글을 찾을 수 없습니다.</p>;

    return (
        <div style={{ margin: 'auto', maxWidth: '900px', padding: '20px' }}>
            <Card className="shadow-sm border-0 p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4>{post.title}</h4>
                    <small className="text-muted">{post.created_at}</small>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'gray' }} className="mb-3">
                    📍 {post.region || '지역 정보 없음'} | 작성자: {post.author_name}
                </div>

                {/* 이미지 목록 */}
                {images.length > 0 && (
                    <div className="mb-3 d-flex flex-column gap-3">
                        {images.map((img, idx) => (
                            <img
                                key={idx}
                                src={`${API_BASE_URL}/uploads/${img.image_url}`}
                                alt={`post-${idx}`}
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                    objectFit: 'cover',
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* 본문 */}
                <div
                    className="post-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                    style={{
                        fontSize: '1rem',
                        lineHeight: '1.7',
                        color: '#333',
                        marginBottom: '30px',
                    }}
                ></div>

                <hr />

                {/* 댓글 목록 */}
                <div className="mt-4">
                    <h6>💬 댓글 ({comments.length})</h6>
                    {comments.length === 0 ? (
                        <p className="text-muted mt-2">아직 댓글이 없습니다.</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c.comment_id} className="border-bottom py-2" style={{ fontSize: '0.95rem' }}>
                                <strong>{c.author_name}</strong> <small className="text-muted">{c.created_at}</small>
                                <p className="mb-0">{c.content}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* 댓글 작성 */}
                <Form onSubmit={handleAddComment} className="mt-3">
                    <Form.Group controlId="commentText">
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="댓글을 입력하세요..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                    </Form.Group>
                    <div className="text-end mt-2">
                        <Button variant="primary" type="submit">
                            등록
                        </Button>
                    </div>
                </Form>

                <div className="text-end mt-4">
                    <Button variant="secondary" onClick={() => navigate('/posts')}>
                        목록으로
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default PostDetail;
