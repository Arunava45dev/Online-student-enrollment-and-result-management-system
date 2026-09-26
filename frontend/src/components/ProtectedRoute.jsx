import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap a page with allow={["student"]} / ["admin"] to gate by role.
export default function ProtectedRoute({ children, allow }) {
  const { isAuthed, role } = useAuth();

  if (!isAuthed) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(role)) {
    return <Navigate to={role === "student" ? "/student" : "/admin"} replace />;
  }
  return children;
}
