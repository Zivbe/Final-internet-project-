import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate("/feed");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="card stack">
        <label className="stack">
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="stack">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p>{error}</p> : null}
        <button type="submit">Login</button>
        <button
          type="button"
          className="secondary"
          onClick={() => (window.location.href = "http://localhost:4000/api/auth/google")}
        >
          Continue with Google
        </button>
      </form>
      <p>
        Need an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};
