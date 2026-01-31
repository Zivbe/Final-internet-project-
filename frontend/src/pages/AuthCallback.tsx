import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get("accessToken");
    if (accessToken) {
      const payloadSegment = accessToken.split(".")[1] || "";
      const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      setSession({
        accessToken,
        user: { id: payload.sub, username: payload.username }
      });
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [location.search, navigate, setSession]);

  return <div>Signing you in...</div>;
};
