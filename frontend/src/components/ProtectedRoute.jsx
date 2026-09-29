import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap a page with allow={["student"]} / ["admin"] / ["faculty"] to gate by role.
export default function ProtectedRoute({ children, allow }) {
  const { isAuthed, role } = useAuth();

  if (!isAuthed) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(role)) {
    if (role === "student") return <Navigate to="/student" replace />;
    if (role === "faculty") return <Navigate to="/faculty" replace />;
    return <Navigate to="/admin" replace />;
  }
  return children;
}
