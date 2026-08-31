import React, { useState } from 'react';
import { Button, Card, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import api from '../api/axios';
import '../index.css';

const NewPost = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [region, setRegion] = useState('');
    const [is_advertised, setIsAdvertised] = useState('false');

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

    // 이미지 업로드 핸들러
    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('images', file);

            try {
                // 이미지 업로드 API
                const res = await api.post('/posts/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const imageUrl = res.data.url;

                // 에디터에 이미지 삽입
                editor.chain().focus().setImage({ src: imageUrl }).run();
            } catch (err) {
                alert('이미지 업로드 실패');
            }
        };
        input.click();
    };

    // Tiptap 에디터 설정
    const editor = useEditor({
        extensions: [StarterKit, Image],
        content: '',
        editorProps: {
            attributes: {
                class: 'border rounded p-3 min-h-[300px] focus:outline-none prose prose-sm max-w-none',
            },
        },
    });

    // 게시글 등록
    const handleSubmit = async (e) => {
        e.preventDefault();
        const content = editor.getHTML();

        if (!title || !content || !region) {
            alert('제목, 내용, 지역은 필수 입력입니다.');
            return;
        }

        try {
            await api.post('/posts', {
                title,
                content,
                region,
                is_advertised,
            });
            alert('후기가 등록되었습니다!');
            navigate('/posts');
        } catch (err) {
            alert(err.response?.data?.message || '등록 실패');
        }
    };

    if (!editor) return null;

    return (
        <div style={{ margin: 'auto', maxWidth: '900px', padding: '20px' }}>
            <Card className="shadow-sm border-0 p-4">
                <h4 className="mb-4 text-center">여행 후기 작성 ✏️</h4>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>제목</Form.Label>
                        <Form.Control
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>지역 선택</Form.Label>
                        <Form.Select value={region} onChange={(e) => setRegion(e.target.value)} required>
                            <option value="">-- 지역을 선택하세요 --</option>
                            {regions.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* 툴바 */}
                    <div
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px 8px 0 0',
                            background: '#f8f9fa',
                            padding: '8px',
                            display: 'flex',
                            gap: '6px',
                        }}
                    >
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                        >
                            <b>B</b>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                        >
                            <i>I</i>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                        >
                            • List
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={handleImageUpload}>
                            🖼️ 이미지
                        </Button>
                    </div>

                    {/* 에디터 본문 */}
                    <div
                        style={{
                            border: '1px solid #ddd',
                            borderTop: 'none',
                            borderRadius: '0 0 8px 8px',
                            marginBottom: '20px',
                        }}
                    >
                        <EditorContent editor={editor} />
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>광고 글 여부</Form.Label>
                        <Form.Select value={is_advertised} onChange={(e) => setIsAdvertised(e.target.value)}>
                            <option value="false">일반 후기</option>
                            <option value="true">광고 후기</option>
                        </Form.Select>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={() => navigate('/posts')}>
                            취소
                        </Button>
                        <Button variant="primary" type="submit">
                            등록하기
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default NewPost;
