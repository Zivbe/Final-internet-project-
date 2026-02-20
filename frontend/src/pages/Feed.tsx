import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Post } from "../types/post";
import * as postsApi from "../api/posts";

export const FeedPage = () => {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = async () => {
    if (!accessToken || loading) return;
    setLoading(true);
    try {
      const data = await postsApi.listPosts(accessToken, nextCursor);
      setPosts((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, [accessToken]);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nextCursor, accessToken]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    const created = await postsApi.createPost(accessToken, text, image);
    setPosts((prev) => [created, ...prev]);
    setText("");
    setImage(null);
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken || !search.trim()) return;
    const data = await postsApi.searchPosts(accessToken, search.trim());
    setPosts(data.items);
    setNextCursor(null);
  };

  const clearSearch = () => {
    setSearch("");
    setPosts([]);
    setNextCursor(null);
    loadMore();
  };

  const toggleLike = async (post: Post) => {
    if (!accessToken) return;
    if (post.hasLiked) {
      await postsApi.unlikePost(accessToken, post.id);
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? {
                ...item,
                hasLiked: false,
                likeCount: Math.max(0, item.likeCount - 1)
              }
            : item
        )
      );
    } else {
      await postsApi.likePost(accessToken, post.id);
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? { ...item, hasLiked: true, likeCount: item.likeCount + 1 }
            : item
        )
      );
    }
  };

  return (
    <div className="container">
      <h1>Feed</h1>
      <nav>
        <Link to="/profile">Profile</Link> | <Link to="/ai">AI Tools</Link>
      </nav>
      <form onSubmit={handleSearch} className="card stack">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search posts..."
        />
        <div className="meta-row">
          <button type="submit">Search</button>
          <button type="button" className="secondary" onClick={clearSearch}>
            Clear
          </button>
        </div>
      </form>
      <form onSubmit={handleCreate} className="card stack">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Share something..."
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
        />
        <button type="submit">Post</button>
      </form>

      <div>
        {posts.map((post) => (
          <article key={post.id} className="card stack">
            <header>
              <strong>{post.author.username}</strong>
            </header>
            {post.text ? <p>{post.text}</p> : null}
            {post.imageUrl ? <img src={post.imageUrl} alt="post" /> : null}
            <div className="meta-row">
              <button type="button" onClick={() => toggleLike(post)}>
                {post.hasLiked ? "Unlike" : "Like"} ({post.likeCount})
              </button>
              <Link to={`/posts/${post.id}/comments`}>
                Comments ({post.commentCount})
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div ref={loaderRef}>{loading ? "Loading..." : null}</div>
      {!nextCursor && posts.length > 0 ? <p>End of feed</p> : null}
    </div>
  );
};
