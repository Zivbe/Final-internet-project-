import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Comment } from "../types/comment";
import * as commentsApi from "../api/comments";

export const CommentsPage = () => {
  const { postId } = useParams();
  const { accessToken } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [text, setText] = useState("");
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = async () => {
    if (!accessToken || !postId) return;
    const data = await commentsApi.listComments(accessToken, postId, nextCursor);
    setComments((prev) => [...prev, ...data.items]);
    setNextCursor(data.nextCursor);
  };

  useEffect(() => {
    loadMore();
  }, [accessToken, postId]);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nextCursor, accessToken, postId]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken || !postId || !text.trim()) return;
    const created = await commentsApi.createComment(accessToken, postId, text.trim());
    setComments((prev) => [created, ...prev]);
    setText("");
  };

  return (
    <div className="container">
      <h1>Comments</h1>
      <form onSubmit={handleCreate} className="card stack">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a comment..."
        />
        <button type="submit">Send</button>
      </form>
      <div>
        {comments.map((comment) => (
          <article key={comment.id} className="card stack">
            <strong>{comment.author.username}</strong>
            <p>{comment.text}</p>
          </article>
        ))}
      </div>
      <div ref={loaderRef} />
    </div>
  );
};
