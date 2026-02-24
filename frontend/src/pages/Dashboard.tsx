import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import {
  deleteImage,
  getImages,
  getMyImages,
  type Image,
  updateImage,
  uploadImage
} from "../api/images";
import { askFeedQuestion, getFeedInsights, type AiInsights } from "../api/ai";
import { toggleLike } from "../api/likes";
import { searchImages, searchUsers, type User } from "../api/search";
import { useAuth } from "../context/AuthContext";

const toImageUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://") ? url : `${API_BASE_URL}${url}`;

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [feedMode, setFeedMode] = useState<"all" | "mine">("all");
  const [images, setImages] = useState<Image[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFetchingPage, setIsFetchingPage] = useState(false);
  const feedSentinelRef = useRef<HTMLDivElement | null>(null);
  const latestRequestIdRef = useRef(0);
  const isFetchingRef = useRef(false);

  const hasSearch = useMemo(() => searchTerm.trim().length > 0, [searchTerm]);

  const loadImages = useCallback(
    async (targetPage: number, reset = false) => {
      const requestId = ++latestRequestIdRef.current;
      isFetchingRef.current = true;
      setIsFetchingPage(true);
      try {
        const fetchFn = feedMode === "mine" ? getMyImages : getImages;
        const data = await fetchFn(targetPage, 12);
        if (latestRequestIdRef.current !== requestId) {
          return;
        }
        setImages((prev) => (reset ? data.images : [...prev, ...data.images]));
        setPage(targetPage);
        setHasMore(targetPage < data.pagination.pages);
      } catch (err) {
        if (latestRequestIdRef.current === requestId) {
          setStatus((err as Error).message);
        }
      } finally {
        if (latestRequestIdRef.current === requestId) {
          isFetchingRef.current = false;
          setIsFetchingPage(false);
        }
      }
    },
    [feedMode]
  );

  useEffect(() => {
    setUsers([]);
    setSearchTerm("");
    loadImages(1, true);
  }, [feedMode, loadImages]);

  useEffect(() => {
    if (hasSearch) return;
    const sentinel = feedSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasMore && !isFetchingRef.current) {
          loadImages(page + 1);
        }
      },
      { root: null, rootMargin: "256px 0px", threshold: 0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasSearch, hasMore, loadImages, page]);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile && !description.trim()) {
      setStatus("Add text or select an image first.");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      await uploadImage(selectedFile, description);
      setSelectedFile(null);
      setDescription("");
      await loadImages(1, true);
      setStatus("Image uploaded.");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (imageId: string) => {
    try {
      const result = await toggleLike(imageId);
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                likeCount: result.likeCount,
                likes: result.likes
              }
            : img
        )
      );
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const q = searchTerm.trim();

    if (!q) {
      setUsers([]);
      await loadImages(1, true);
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const [imageResult, userResult] = await Promise.all([searchImages(q), searchUsers(q)]);
      setImages(imageResult.images);
      setUsers(userResult.users);
      setHasMore(false);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deleteImage(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      setStatus("Post deleted.");
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const startEdit = (image: Image) => {
    setEditingId(image.id);
    setEditDescription(image.description || "");
    setEditFile(null);
  };

  const handleSaveEdit = async (imageId: string) => {
    try {
      const result = await updateImage(imageId, { description: editDescription, file: editFile });
      setImages((prev) => prev.map((img) => (img.id === imageId ? result.image : img)));
      setEditingId(null);
      setEditDescription("");
      setEditFile(null);
      setStatus("Post updated.");
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const handleGenerateInsights = async () => {
    try {
      setLoading(true);
      const data = await getFeedInsights(feedMode);
      setInsights(data);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAi = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = aiQuestion.trim();
    if (!question) return;
    try {
      setLoading(true);
      setAiAnswer(null);
      const result = await askFeedQuestion(question, feedMode);
      setAiAnswer(result.answer);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Signed in as @{user?.username}</p>
        </div>
        <div className="owner-actions">
          {user?.id ? (
            <Link to={`/profile/${user.id}`} className="btn btn-secondary">
              My profile
            </Link>
          ) : null}
          <button type="button" className="btn btn-secondary" onClick={() => logout()}>
            Logout
          </button>
        </div>
      </header>

      <aside className="panel panel-left">
        <h2>Navigation</h2>
        <p>
          <Link to="/dashboard">News Feed</Link>
        </p>
        {user?.id ? (
          <p>
            <Link to={`/profile/${user.id}`}>My Profile</Link>
          </p>
        ) : null}
        <p className="muted">Vintage mode: 2008</p>
      </aside>

      <section className="panel panel-main">
        <h2>Create Post</h2>
        <form onSubmit={handleUpload} className="inline-form">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Upload
          </button>
        </form>
      </section>

      <section className="panel panel-right">
        <div className="feed-header">
          <h2>AI Insights</h2>
          <button type="button" className="btn btn-secondary" disabled={loading} onClick={handleGenerateInsights}>
            Analyze {feedMode === "mine" ? "My" : "Feed"} Content
          </button>
        </div>
        {insights ? (
          <div className="ai-insights">
            <p><strong>Summary:</strong> {insights.summary}</p>
            {insights.suggestedCaptions.length > 0 ? (
              <p><strong>Suggested captions:</strong> {insights.suggestedCaptions.join(" | ")}</p>
            ) : null}
            {insights.suggestedTags.length > 0 ? (
              <p><strong>Suggested tags:</strong> {insights.suggestedTags.join(", ")}</p>
            ) : null}
            {insights.moderationFlags.length > 0 ? (
              <p><strong>Moderation flags:</strong> {insights.moderationFlags.join(", ")}</p>
            ) : (
              <p><strong>Moderation flags:</strong> none</p>
            )}
          </div>
        ) : (
          <p className="muted">Click analyze to generate AI-based feed insights.</p>
        )}

        <form onSubmit={handleAskAi} className="inline-form">
          <input
            value={aiQuestion}
            onChange={(event) => setAiQuestion(event.target.value)}
            placeholder="Ask AI about this feed (free text)"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Ask AI
          </button>
        </form>
        {aiAnswer ? (
          <div className="ai-insights">
            <p><strong>Answer:</strong> {aiAnswer}</p>
          </div>
        ) : null}
      </section>

      <section className="panel panel-main">
        <h2>Search</h2>
        <form onSubmit={handleSearch} className="inline-form">
          <input
            placeholder="Search images or users"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Search
          </button>
          {hasSearch ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchTerm("");
                setUsers([]);
                loadImages(1, true);
              }}
            >
              Clear
            </button>
          ) : null}
        </form>

        {users.length > 0 ? (
          <div className="user-results">
            <h3>Matching users</h3>
            <ul>
              {users.map((u) => (
                <li key={u.id}>@{u.username}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="panel panel-main">
        <div className="feed-header">
          <h2>{hasSearch ? "Search results" : "Latest images"}</h2>
          {!hasSearch ? (
            <div className="feed-toggle">
              <button
                type="button"
                className={`btn ${feedMode === "all" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFeedMode("all")}
              >
                All posts
              </button>
              <button
                type="button"
                className={`btn ${feedMode === "mine" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFeedMode("mine")}
              >
                My posts
              </button>
            </div>
          ) : null}
        </div>
        {status ? <p className="status">{status}</p> : null}
        <div className="image-grid">
          {images.map((image) => {
            const likedByMe = !!user && image.likes.some((like) => like.id === user.id);
            const isOwner = !!user && image.uploadedBy.id === user.id;
            return (
              <article key={image.id} className="image-card">
                {image.url ? <img src={toImageUrl(image.url)} alt={image.originalName || "post"} /> : null}
                <div className="image-card-body">
                  <p className="image-meta">
                    <strong>
                      <Link to={`/profile/${image.uploadedBy.id}`}>@{image.uploadedBy.username}</Link>
                    </strong>
                  </p>
                  <p>{image.description || "No description"}</p>
                  <div className="image-actions">
                    <span>{image.likeCount} likes</span>
                    <button type="button" className="btn btn-like" onClick={() => handleLike(image.id)}>
                      {likedByMe ? "Unlike" : "Like"}
                    </button>
                  </div>
                  <Link to={`/images/${image.id}/comments`} className="comment-link">
                    {image.commentCount} comments
                  </Link>
                  {isOwner ? (
                    <div className="owner-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => startEdit(image)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(image.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                  {editingId === image.id ? (
                    <div className="edit-form">
                      <input
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        placeholder="Update description"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setEditFile(event.target.files?.[0] ?? null)}
                      />
                      <div className="owner-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleSaveEdit(image.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        {!hasSearch ? (
          <>
            <div ref={feedSentinelRef} className="feed-sentinel" aria-hidden />
            {isFetchingPage ? <p className="muted">Loading more posts...</p> : null}
            {!hasMore && images.length > 0 ? <p className="muted">You have reached the end.</p> : null}
          </>
        ) : null}
        {images.length === 0 ? <p className="muted">No images yet.</p> : null}
      </section>
    </div>
  );
};
