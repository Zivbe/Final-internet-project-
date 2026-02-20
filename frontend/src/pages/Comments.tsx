import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createComment, deleteComment, getCommentsByImage, type CommentItem } from "../api/comments";
import { useAuth } from "../context/AuthContext";

export const CommentsPage = () => {
  const { imageId } = useParams();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    if (!imageId) return;
    const data = await getCommentsByImage(imageId, 1, 100);
    setComments(data.comments);
  };

  useEffect(() => {
    loadComments().catch((err) => setStatus((err as Error).message));
  }, [imageId]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!imageId || !text.trim()) return;

    setLoading(true);
    setStatus(null);
    try {
      const result = await createComment(imageId, text.trim());
      setComments((prev) => [result.comment, ...prev]);
      setText("");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <div className="dashboard-page">
      <section className="panel">
        <div className="feed-header">
          <h2>Comments</h2>
          <Link to="/dashboard">Back to feed</Link>
        </div>

        <form className="inline-form" onSubmit={handleAdd}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a comment"
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            Add comment
          </button>
        </form>

        {status ? <p className="status">{status}</p> : null}

        <div className="comment-list">
          {comments.map((comment) => (
            <article key={comment.id} className="comment-item">
              <p>
                <strong>@{comment.user.username}</strong>
              </p>
              <p>{comment.text}</p>
              {user?.id === comment.user.id ? (
                <button className="btn btn-danger" type="button" onClick={() => handleDelete(comment.id)}>
                  Delete
                </button>
              ) : null}
            </article>
          ))}
          {comments.length === 0 ? <p className="muted">No comments yet.</p> : null}
        </div>
      </section>
    </div>
  );
};
