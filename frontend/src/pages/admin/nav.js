import { BookOpen, Users, ClipboardList, CalendarCheck2, Award, Bell, Sparkles } from "lucide-react";

export const ADMIN_NAV = [
  {
    eyebrow: "Records",
    links: [
      { to: "/admin", label: "Courses", end: true, icon: BookOpen },
      { to: "/admin/students", label: "Students", icon: Users },
      { to: "/admin/enrollments", label: "Enrollments", icon: ClipboardList },
      { to: "/admin/exams", label: "Exams", icon: CalendarCheck2 },
      { to: "/admin/results", label: "Publish results", icon: Award },
      { to: "/admin/notices", label: "Notices", icon: Bell },
    ],
  },
  {
    eyebrow: "Assistant",
    links: [{ to: "/admin/remark", label: "AI faculty remark", icon: Sparkles }],
  },
];
