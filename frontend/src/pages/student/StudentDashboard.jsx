import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ClipboardList, GraduationCap, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { listCourses } from "../../api/courses";
import { myEnrollments } from "../../api/enrollments";
import { getMyResults } from "../../api/results";
import { listNotices } from "../../api/notices";
import { STUDENT_NAV } from "./nav";
import { useAuth } from "../../context/AuthContext";
import { semesterLabel } from "../../constants/semesters";

const ACTIVE_SEMESTER = 1;

function formatDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function StudentDashboard() {
  const { name } = useAuth();
  const [data, setData] = useState({ courses: [], enrollments: [], results: [], notices: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const requests = await Promise.allSettled([
        listCourses(ACTIVE_SEMESTER),
        myEnrollments(ACTIVE_SEMESTER),
        getMyResults(ACTIVE_SEMESTER),
        listNotices(),
      ]);
      if (!mounted) return;
      const [courses, enrollments, results, notices] = requests.map((item) => item.status === "fulfilled" ? item.value.data || [] : []);
      setData({ courses, enrollments, results, notices });
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const credits = useMemo(
    () => data.courses.filter((course) => data.enrollments.some((row) => row.course_id === course.id)).reduce((total, course) => total + (Number(course.credits) || 0), 0),
    [data]
  );
  const enrollmentProgress = data.courses.length ? Math.min(100, Math.round((data.enrollments.length / data.courses.length) * 100)) : 0;
  const published = data.results.length;
  const latestNotices = data.notices.slice(0, 3);
  const firstName = (name || "Student").trim().split(" ")[0];

  return (
    <Shell groups={STUDENT_NAV}>
      <section className="dashboard-hero">
        <div>
          <p className="page-eyebrow">Student command center</p>
          <h1 className="page-title">Good to see you, {firstName}.</h1>
          <p className="page-subtitle">Here’s your {semesterLabel(ACTIVE_SEMESTER).toLowerCase()} academic pulse at a glance.</p>
        </div>
        <div className="dashboard-orbit" aria-hidden="true"><Sparkles size={22} /></div>
      </section>

      {loading ? <Loader label="Building your academic snapshot…" /> : <>
        <div className="stat-row dashboard-stats">
          <div className="stat-card"><div className="stat-label"><ClipboardList size={13} /> Enrolled courses</div><div className="stat-value">{data.enrollments.length}</div><span className="stat-hint">of {data.courses.length} available</span></div>
          <div className="stat-card"><div className="stat-label"><GraduationCap size={13} /> Registered credits</div><div className="stat-value">{credits}</div><span className="stat-hint">this semester</span></div>
          <div className="stat-card"><div className="stat-label"><Trophy size={13} /> Results published</div><div className="stat-value">{published}</div><span className="stat-hint">subjects available</span></div>
          <div className="stat-card"><div className="stat-label"><Bell size={13} /> New notices</div><div className="stat-value">{data.notices.length}</div><span className="stat-hint">from the office</span></div>
        </div>

        <div className="dashboard-grid">
          <article className="panel dashboard-progress">
            <div className="panel-header"><h2><CheckCircle2 size={16} /> Enrollment progress</h2><span className="progress-number">{enrollmentProgress}%</span></div>
            <div className="panel-body">
              <p className="muted">You’re enrolled in <strong>{data.enrollments.length}</strong> of <strong>{data.courses.length}</strong> available courses.</p>
              <div className="progress-track" role="progressbar" aria-label="Enrollment progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={enrollmentProgress}><span style={{ width: `${enrollmentProgress}%` }} /></div>
              <Link className="dashboard-action" to="/student">Browse course catalog <ArrowRight size={15} /></Link>
            </div>
          </article>

          <article className="panel dashboard-quick">
            <div className="panel-header"><h2><Sparkles size={16} /> Quick actions</h2></div>
            <div className="quick-links">
              <Link to="/student/enrollments"><ClipboardList size={17} /><span><strong>My enrollments</strong><small>Manage registered courses</small></span><ArrowRight size={15} /></Link>
              <Link to="/student/results"><Trophy size={17} /><span><strong>Result summary</strong><small>Review published marks</small></span><ArrowRight size={15} /></Link>
              <Link to="/student/hall-ticket"><CalendarDays size={17} /><span><strong>Hall ticket</strong><small>Prepare for examinations</small></span><ArrowRight size={15} /></Link>
            </div>
          </article>
        </div>

        <article className="panel dashboard-notices">
          <div className="panel-header"><h2><Bell size={16} /> Latest from the registrar</h2><Link className="text-link" to="/student/notices">View all <ArrowRight size={14} /></Link></div>
          <div className="notice-preview-list">
            {latestNotices.length ? latestNotices.map((notice) => <div className="notice-preview" key={notice.id}><div className="notice-icon"><Bell size={15} /></div><div><strong>{notice.title}</strong><p>{notice.content}</p></div><time>{formatDate(notice.created_at)}</time></div>) : <div className="empty-dashboard"><BookOpen size={19} /> No announcements yet—check back soon.</div>}
          </div>
        </article>
      </>}
    </Shell>
  );
}
