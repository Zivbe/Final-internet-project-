import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as usersApi from "../api/users";

export const ProfilePage = () => {
  const { user, accessToken, setSession } = useAuth();
  const [username, setUsername] = useState(user?.username ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!user || !accessToken) {
    return <div className="container">Loading profile...</div>;
  }

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const updated = await usersApi.updateProfile(accessToken, username);
      setSession({ accessToken, user: updated });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    setError(null);
    try {
      const updated = await usersApi.uploadAvatar(accessToken, event.target.files[0]);
      setSession({ accessToken, user: updated });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container">
      <h1>Profile</h1>
      <div className="card stack">
        {user.avatarUrl ? <img src={user.avatarUrl} alt="avatar" /> : null}
        <input type="file" accept="image/*" onChange={handleAvatar} />
        <form onSubmit={handleUpdate} className="stack">
          <label className="stack">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <button type="submit">Save</button>
        </form>
        {error ? <p>{error}</p> : null}
      </div>
    </div>
  );
};
