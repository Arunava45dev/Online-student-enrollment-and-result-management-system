import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Student pages
import StudentCourses from "./pages/student/StudentCourses";
import MyEnrollments from "./pages/student/MyEnrollments";
import MyResults from "./pages/student/MyResults";
import Notices from "./pages/student/Notices";
import AiChat from "./pages/student/AiChat";

// Admin pages — students, results, notices, exams
import ManageStudents from "./pages/admin/ManageStudents";
import PublishResults from "./pages/admin/PublishResults";
import ManageNotices from "./pages/admin/ManageNotices";

// Faculty pages — courses, enrollments, AI remark
import ManageCourses from "./pages/admin/ManageCourses";
import ManageEnrollments from "./pages/admin/ManageEnrollments";
import AiRemark from "./pages/admin/AiRemark";
import ManageExams from "./pages/admin/ManageExams";

function HomeRedirect() {
  const { isAuthed, role } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (role === "student")  return <Navigate to="/student"  replace />;
  if (role === "faculty")  return <Navigate to="/faculty"  replace />;
  return <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── Student ─────────────────────────────────────── */}
      <Route path="/student" element={<ProtectedRoute allow={["student"]}><StudentCourses /></ProtectedRoute>} />
      <Route path="/student/enrollments" element={<ProtectedRoute allow={["student"]}><MyEnrollments /></ProtectedRoute>} />
      <Route path="/student/results" element={<ProtectedRoute allow={["student"]}><MyResults /></ProtectedRoute>} />
      <Route path="/student/notices" element={<ProtectedRoute allow={["student"]}><Notices /></ProtectedRoute>} />
      <Route path="/student/chat" element={<ProtectedRoute allow={["student"]}><AiChat /></ProtectedRoute>} />

      {/* ── Admin — Students · Results · Notices · Exams ─ */}
      <Route path="/admin" element={<ProtectedRoute allow={["admin"]}><ManageStudents /></ProtectedRoute>} />
      <Route path="/admin/results" element={<ProtectedRoute allow={["admin"]}><PublishResults /></ProtectedRoute>} />
      <Route path="/admin/notices" element={<ProtectedRoute allow={["admin"]}><ManageNotices /></ProtectedRoute>} />

      {/* ── Faculty — Courses · Enrollments · AI Remark ── */}
      <Route path="/faculty" element={<ProtectedRoute allow={["faculty"]}><ManageCourses /></ProtectedRoute>} />
      <Route path="/faculty/exams" element={<ProtectedRoute allow={["faculty"]}><ManageExams /></ProtectedRoute>} />
      <Route path="/faculty/enrollments" element={<ProtectedRoute allow={["faculty"]}><ManageEnrollments /></ProtectedRoute>} />
      <Route path="/faculty/remark" element={<ProtectedRoute allow={["faculty"]}><AiRemark /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
