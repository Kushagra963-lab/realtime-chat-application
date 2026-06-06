import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { ChatLayout } from "./components/ChatLayout.jsx";
import { acceptOAuthToken, fetchMe } from "./features/auth/authSlice.js";

function OAuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      dispatch(acceptOAuthToken(token));
      dispatch(fetchMe());
    }
    navigate("/", { replace: true });
  }, [dispatch, navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f9]">
      <Loader2 className="h-8 w-8 animate-spin text-[#1f6f78]" />
    </main>
  );
}

function ProtectedRoute({ children }) {
  const { token, user, status } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe());
    }
  }, [dispatch, status, token, user]);

  if (token && status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1f6f78]" />
      </main>
    );
  }

  if (!token || !user) {
    return <AuthScreen />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
