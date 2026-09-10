import React from "react";

function Topbar() {
  return (
    <header className="trace-topbar">
      <div className="topbar-title">
        <span className="topbar-label">
          OPERATIONS / OVERVIEW
        </span>

        <h2>Control Center</h2>
      </div>

      <div className="topbar-meta">
        <div className="topbar-meta-item">
          <span>ENVIRONMENT</span>
          <strong>DEVELOPMENT</strong>
        </div>

        <div className="topbar-line" />

        <div className="topbar-meta-item">
          <span>LEDGER</span>
          <strong className="ledger-active">
            ● ACTIVE
          </strong>
        </div>
      </div>
    </header>
  );
}

export default Topbar;