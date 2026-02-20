import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { AuthCallbackPage } from "./pages/AuthCallback";
import { DashboardPage } from "./pages/Dashboard";
import { CommentsPage } from "./pages/Comments";
import { ProfilePage } from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

export const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/images/:imageId/comments"
        element={
          <ProtectedRoute>
            <CommentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
