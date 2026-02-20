import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import type { Image } from "../api/images";
import { getMyProfile, getUserProfile, updateMyPhoto } from "../api/users";
import { useAuth } from "../context/AuthContext";

const toAssetUrl = (url: string) =>
  !url ? "" : url.startsWith("http://") || url.startsWith("https://") ? url : `${API_BASE_URL}${url}`;

export const ProfilePage = () => {
  const { userId } = useParams();
  const { user, setSession, accessToken } = useAuth();
  const [profile, setProfile] = useState<{ id: string; username: string; photoUrl?: string } | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const targetUserId = userId === "me" || !userId ? user?.id : userId;

  const loadProfile = async (targetPage: number, reset = false) => {
    if (!targetUserId) return;
    const data = await getUserProfile(targetUserId, targetPage, 12);
    setProfile(data.user);
    setImages((prev) => (reset ? data.images : [...prev, ...data.images]));
    setPage(targetPage);
    setHasMore(targetPage < data.pagination.pages);
    setCanEdit(data.canEdit);
  };

  useEffect(() => {
    setImages([]);
    loadProfile(1, true).catch((err) => setStatus((err as Error).message));
  }, [targetUserId]);

  const handleUpdatePhoto = async () => {
    if (!photoFile || !accessToken) {
      setStatus("Please select a photo first.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await updateMyPhoto(photoFile);
      setProfile((prev) => (prev ? { ...prev, photoUrl: result.user.photoUrl } : prev));
      if (user) {
        setSession({
          accessToken,
          user: { ...user, photoUrl: result.user.photoUrl }
        });
      }
      await getMyProfile();
      setPhotoFile(null);
      setStatus("Profile photo updated.");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <section className="panel">
        <div className="feed-header">
          <h2>User details</h2>
          <Link to="/dashboard">Back to feed</Link>
        </div>
        <div className="profile-header">
          <img
            className="profile-photo"
            src={toAssetUrl(profile?.photoUrl || "") || "https://via.placeholder.com/96?text=User"}
            alt={profile?.username || "profile"}
          />
          <div>
            <h3>@{profile?.username || "loading..."}</h3>
            {canEdit ? <p className="muted">You can update your profile photo here.</p> : null}
          </div>
        </div>

        {canEdit ? (
          <div className="owner-actions">
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
            <button type="button" className="btn btn-primary" onClick={handleUpdatePhoto} disabled={loading}>
              Update photo
            </button>
          </div>
        ) : null}
        {status ? <p className="status">{status}</p> : null}
      </section>

      <section className="panel">
        <h2>{canEdit ? "My posts" : "User posts"}</h2>
        <div className="image-grid">
          {images.map((image) => (
            <article key={image.id} className="image-card">
              <img src={toAssetUrl(image.url)} alt={image.originalName} />
              <div className="image-card-body">
                <p>{image.description || "No description"}</p>
                <p className="muted">
                  {image.likeCount} likes - {image.commentCount} comments
                </p>
              </div>
            </article>
          ))}
        </div>
        {hasMore ? (
          <button type="button" className="btn btn-secondary load-more" onClick={() => loadProfile(page + 1)}>
            Load more
          </button>
        ) : null}
      </section>
    </div>
  );
};
