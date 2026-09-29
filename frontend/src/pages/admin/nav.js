import { BookOpen, Users, ClipboardList, CalendarCheck2, Award, Bell, Sparkles } from "lucide-react";

/** Sidebar nav for the Admin role — students, results, notices, exams */
export const ADMIN_NAV = [
  {
    eyebrow: "Registry",
    links: [
      { to: "/admin",          label: "Students",        end: true, icon: Users },
      { to: "/admin/results",  label: "Publish Results", icon: Award },
      { to: "/admin/notices",  label: "Notices",         icon: Bell },
    ],
  },
];

/** Sidebar nav for the Faculty role — courses, enrollments, AI remark */
export const FACULTY_NAV = [
  {
    eyebrow: "Academic",
    links: [
      { to: "/faculty",              label: "Courses",     end: true, icon: BookOpen },
      { to: "/faculty/exams",        label: "Exams",       icon: CalendarCheck2 },
      { to: "/faculty/enrollments",  label: "Enrollments", icon: ClipboardList },
    ],
  },
  {
    eyebrow: "Assistant",
    links: [
      { to: "/faculty/remark", label: "AI Faculty Remark", icon: Sparkles },
    ],
  },
];
