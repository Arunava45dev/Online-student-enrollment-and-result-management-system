import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Seal from "./Seal";

// Shared app frame: topbar with seal brand + user chip, sidebar nav.
// `groups` = [{ eyebrow: "Records", links: [{ to, label, icon: LucideIcon, end }] }]
export default function Shell({ groups, children }) {
  const { name, role, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("registrar-theme") || "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("registrar-theme", theme);
  }, [theme]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-seal">
            <Seal size={26} tone="paper" />
          </div>
          <div className="brand-text">
            <strong>Registrar</strong>
            <small>Enrollment &amp; Result Office</small>
          </div>
        </div>
        <div className="topbar-user">
          <button
            className="icon-button theme-toggle"
            type="button"
            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="user-chip">
            <span className="avatar">{initial}</span>
            {name || "—"}
            <span className="role-pill">{role}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> Sign out
          </button>
          <button
            className="icon-button nav-toggle"
            type="button"
            onClick={() => setNavOpen((open) => !open)}
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navOpen}
          >
            {navOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <div className="body-frame">
        <aside className={`sidebar ${navOpen ? "is-open" : ""}`}>
          <nav>
            {groups.map((group) => (
              <div key={group.eyebrow}>
                <div className="side-eyebrow">{group.eyebrow}</div>
                {group.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) => "side-link" + (isActive ? " active" : "")}
                      onClick={() => setNavOpen(false)}
                    >
                      {Icon && <Icon size={15} />}
                      {link.label}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
