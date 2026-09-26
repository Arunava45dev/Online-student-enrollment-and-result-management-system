import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

import StudentCourses from "./pages/student/StudentCourses";
import MyEnrollments from "./pages/student/MyEnrollments";
import MyResults from "./pages/student/MyResults";
import Notices from "./pages/student/Notices";
import AiChat from "./pages/student/AiChat";

import ManageCourses from "./pages/admin/ManageCourses";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageEnrollments from "./pages/admin/ManageEnrollments";
import ManageExams from "./pages/admin/ManageExams";
import PublishResults from "./pages/admin/PublishResults";
import ManageNotices from "./pages/admin/ManageNotices";
import AiRemark from "./pages/admin/AiRemark";

function HomeRedirect() {
  const { isAuthed, role } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Navigate to={role === "student" ? "/student" : "/admin"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allow={["student"]}>
            <StudentCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/enrollments"
        element={
          <ProtectedRoute allow={["student"]}>
            <MyEnrollments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/results"
        element={
          <ProtectedRoute allow={["student"]}>
            <MyResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/notices"
        element={
          <ProtectedRoute allow={["student"]}>
            <Notices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/chat"
        element={
          <ProtectedRoute allow={["student"]}>
            <AiChat />
          </ProtectedRoute>
        }
      />

      {/* Admin / Faculty */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={["admin", "faculty"]}>
            <ManageCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allow={["admin", "faculty"]}>
            <ManageStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/enrollments"
        element={
          <ProtectedRoute allow={["admin", "faculty"]}>
            <ManageEnrollments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/exams"
        element={
          <ProtectedRoute allow={["admin", "faculty"]}>
            <ManageExams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/results"
        element={
          <ProtectedRoute allow={["admin", "faculty"]}>
            <PublishResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notices"
        element={
          <ProtectedRoute allow={["admin", "faculty"]}>
            <ManageNotices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/remark"
        element={
          <ProtectedRoute allow={["admin", "faculty"]}>
            <AiRemark />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
