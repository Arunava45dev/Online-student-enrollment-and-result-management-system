import { BookOpen, ClipboardList, Award, Bell, MessageSquare, Ticket, LayoutDashboard } from "lucide-react";

export const STUDENT_NAV = [
  {
    eyebrow: "Records",
    links: [
      { to: "/student/dashboard", label: "My dashboard", icon: LayoutDashboard },
      { to: "/student", label: "Course catalog", end: true, icon: BookOpen },
      { to: "/student/enrollments", label: "My enrollments", icon: ClipboardList },
      { to: "/student/results", label: "Result summary", icon: Award },
      { to: "/student/hall-ticket", label: "Hall ticket", icon: Ticket },
      { to: "/student/notices", label: "Notices", icon: Bell },
    ],
  },
  {
    eyebrow: "Assistant",
    links: [{ to: "/student/chat", label: "Ask the AI assistant", icon: MessageSquare }],
  },
];
