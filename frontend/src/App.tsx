import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { AuthCallbackPage } from "./pages/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { FeedPage } from "./pages/Feed";
import { ProfilePage } from "./pages/Profile";
import { CommentsPage } from "./pages/Comments";
import { AiToolsPage } from "./pages/AiTools";

export const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/feed" : "/login"} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/posts/:postId/comments"
        element={
          <ProtectedRoute>
            <CommentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <AiToolsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
