import React from "react";
import { NavLink } from "react-router-dom";

function Sidebar() {
  const navigation = [
    {
      label: "Dashboard",
      path: "/",
      icon: "▦",
    },
    {
      label: "Shipments",
      path: "/shipments",
      icon: "◫",
    },
    {
      label: "Audit Trail",
      path: "/events",
      icon: "◷",
    },
    {
      label: "Historical State",
      path: "/history",
      icon: "↺",
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: "⌁",
    },
  ];

  return (
    <aside className="trace-sidebar">
      <div className="sidebar-top">
        <div className="trace-brand">
          <div className="brand-mark">TG</div>

          <div className="brand-text">
            <h1>TRACEGRID</h1>
            <span>LOGISTICS LEDGER</span>
          </div>
        </div>

        <div className="sidebar-divider" />

        <nav className="trace-nav">
          <span className="nav-heading">WORKSPACE</span>

          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>

              <span className="nav-label">{item.label}</span>

              <span className="nav-active-mark" />
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="system-card">
          <div className="system-card-top">
            <span className="status-indicator" />
            <span>SYSTEM ONLINE</span>
          </div>

          <small>Event ledger operational</small>

          <div className="system-version">
            TRACEGRID / v0.1
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;