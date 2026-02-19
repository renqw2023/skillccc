import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = 'http://localhost:3001';

export default function CommentSection({ owner, slug }) {
    const { user, login } = useAuth();
    const [comments, setComments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const skillId = `${owner}/${slug}`;

    const fetchComments = async (p = 1) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/skills/${owner}/${slug}/comments?page=${p}`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setComments(data.comments);
                setTotal(data.total);
                setPage(data.page);
                setTotalPages(data.totalPages);
            }
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [owner, slug]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/skills/${owner}/${slug}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: newComment.trim() })
            });
            const data = await res.json();
            if (data.success) {
                setNewComment('');
                fetchComments(1); // Refresh from page 1
            }
        } catch (err) {
            console.error('Failed to post comment:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!confirm('确定要删除这条评论吗？')) return;

        try {
            const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                fetchComments(page);
            }
        } catch (err) {
            console.error('Failed to delete comment:', err);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 30) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="comment-section">
            <h3 className="comment-title">
                💬 Comments {total > 0 && <span className="comment-count">({total})</span>}
            </h3>

            {/* Comment Input */}
            {user ? (
                <form className="comment-form" onSubmit={handleSubmit}>
                    <div className="comment-form-header">
                        <img src={user.avatar_url} alt={user.username} className="comment-avatar" />
                        <span className="comment-username">{user.username}</span>
                    </div>
                    <textarea
                        className="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Leave a comment..."
                        maxLength={2000}
                        rows={3}
                    />
                    <div className="comment-form-footer">
                        <span className="comment-char-count">{newComment.length}/2000</span>
                        <button
                            type="submit"
                            className="comment-submit-btn"
                            disabled={!newComment.trim() || submitting}
                        >
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="comment-login-prompt">
                    <p>Login to leave a comment</p>
                    <button className="login-prompt-btn" onClick={login}>
                        🔑 Login with GitHub
                    </button>
                </div>
            )}

            {/* Comments List */}
            {loading ? (
                <div className="comment-loading">Loading comments...</div>
            ) : comments.length === 0 ? (
                <div className="comment-empty">No comments yet. Be the first!</div>
            ) : (
                <div className="comment-list">
                    {comments.map(comment => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-item-header">
                                <img
                                    src={comment.avatar_url}
                                    alt={comment.username}
                                    className="comment-avatar"
                                />
                                <span className="comment-author">{comment.username}</span>
                                <span className="comment-date">{formatDate(comment.created_at)}</span>
                                {user && user.id === comment.user_id && (
                                    <button
                                        className="comment-delete-btn"
                                        onClick={() => handleDelete(comment.id)}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                            <div className="comment-content">{comment.content}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="comment-pagination">
                    <button
                        disabled={page <= 1}
                        onClick={() => fetchComments(page - 1)}
                    >
                        ← Previous
                    </button>
                    <span>{page} / {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => fetchComments(page + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
