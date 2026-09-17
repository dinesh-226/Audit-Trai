import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "../styles/DashBoardPage.css";
import ShipmentSearch from "../components/ShipmentSearch";

type EventItem = {
  number: string;
  title: string;
  location: string;
  time: string;
};

const recentEvents: EventItem[] = [
  {
    number: "07",
    title: "Location Updated",
    location: "Mumbai Port",
    time: "15:45",
  },
  {
    number: "06",
    title: "Shipment Dispatched",
    location: "Pune Hub",
    time: "12:15",
  },
  {
    number: "05",
    title: "Container Created",
    location: "Pune Hub",
    time: "10:30",
  },
  {
    number: "04",
    title: "Status Updated",
    location: "Pune Hub",
    time: "09:50",
  },
];

function DashboardPage() {
  const [selectedShipment, setSelectedShipment] =
    useState("CNTR-AX4921");

  const handleShipmentSearch = (shipmentId: string) => {
    setSelectedShipment(shipmentId.toUpperCase());
  };

  return (
    <div className="trace-app">

      {/* ================= SIDEBAR ================= */}

      <aside className="trace-sidebar">

        <div>
          <div className="trace-brand">
            <div className="brand-mark">TG</div>

            <div className="brand-text">
              <h1>TRACEGRID</h1>
              <span>LOGISTICS LEDGER</span>
            </div>
          </div>

          <div className="sidebar-divider" />

          <nav className="trace-nav">

            <span className="nav-heading">
              WORKSPACE
            </span>

            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">▦</span>
              <span className="nav-label">Dashboard</span>
              <span className="nav-active-mark" />
            </NavLink>

            <NavLink
              to="/shipments"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">◫</span>
              <span className="nav-label">Shipments</span>
              <span className="nav-active-mark" />
            </NavLink>

            <NavLink
              to="/events"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">◷</span>
              <span className="nav-label">Audit Trail</span>
              <span className="nav-active-mark" />
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">↺</span>
              <span className="nav-label">Historical State</span>
              <span className="nav-active-mark" />
            </NavLink>

            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">⌁</span>
              <span className="nav-label">Analytics</span>
              <span className="nav-active-mark" />
            </NavLink>

          </nav>
        </div>

        <div className="system-card">

          <div className="system-card-top">
            <span className="status-indicator" />
            <span>SYSTEM ONLINE</span>
          </div>

          <small>
            Event ledger operational
          </small>

          <div className="system-version">
            TRACEGRID / v0.1
          </div>

        </div>

      </aside>


      {/* ================= MAIN CONTENT ================= */}

      <div className="trace-content">

        {/* TOPBAR */}

        <header className="trace-topbar">

          <div className="topbar-title">

            <span className="topbar-label">
              OPERATIONS / OVERVIEW
            </span>

            <h2>
              Control Center
            </h2>

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


        {/* MAIN */}

        <main className="trace-main">

          {/* ================= INTRO ================= */}

          <section className="dashboard-intro">

            <div>

              <span className="dashboard-eyebrow">
                LOGISTICS / CONTROL CENTER
              </span>

              <h1>
                Operational Overview
              </h1>

              <p>
                Monitor shipment activity, trace recorded events,
                and inspect the current state of logistics operations.
              </p>

            </div>

            <div className="dashboard-revision">

              <span>
                LEDGER SNAPSHOT
              </span>

              <strong>
                REV 07
              </strong>

            </div>

          </section>


          {/* ================= KPI ================= */}

          <section className="dashboard-kpis">

            <article className="dashboard-kpi">

              <div className="dashboard-kpi-header">
                <span>ACTIVE SHIPMENTS</span>
                <i className="dashboard-kpi-dot" />
              </div>

              <strong className="dashboard-kpi-value">
                24
              </strong>

              <span className="dashboard-kpi-detail">
                Currently monitored
              </span>

            </article>


            <article className="dashboard-kpi positive">

              <div className="dashboard-kpi-header">
                <span>RECORDED EVENTS</span>
                <i className="dashboard-kpi-dot" />
              </div>

              <strong className="dashboard-kpi-value">
                184
              </strong>

              <span className="dashboard-kpi-detail">
                Across all shipments
              </span>

            </article>


            <article className="dashboard-kpi">

              <div className="dashboard-kpi-header">
                <span>IN TRANSIT</span>
                <i className="dashboard-kpi-dot" />
              </div>

              <strong className="dashboard-kpi-value">
                16
              </strong>

              <span className="dashboard-kpi-detail">
                Active movement
              </span>

            </article>


            <article className="dashboard-kpi warning">

              <div className="dashboard-kpi-header">
                <span>ACTIVE ALERTS</span>
                <i className="dashboard-kpi-dot" />
              </div>

              <strong className="dashboard-kpi-value">
                03
              </strong>

              <span className="dashboard-kpi-detail">
                Require attention
              </span>

            </article>

          </section>


          {/* ================= TRACE SEARCH ================= */}

          <section className="dashboard-panel">

            <div className="dashboard-panel-header">

              <div>

                <span className="dashboard-eyebrow">
                  AUDIT / TRACE REQUEST
                </span>

                <h3>
                  Trace a shipment
                </h3>

              </div>

              <span className="dashboard-panel-code">
                TG / TRACE / 001
              </span>

            </div>


            <div className="dashboard-trace-body">

              <div className="dashboard-trace-description">

                <p>
                  Search a shipment or container identifier
                  to inspect its current state and recorded
                  operational history.
                </p>

                <div className="dashboard-trace-tags">
                  <span>EVENT SOURCED</span>
                  <span>TRACEABLE</span>
                  <span>APPEND ONLY</span>
                </div>

              </div>


              <div className="dashboard-trace-form">

                <ShipmentSearch
                  onSearch={handleShipmentSearch}
                />

              </div>

            </div>

          </section>


          {/* ================= CURRENT STATE ================= */}

          <section className="dashboard-panel">

            <div className="dashboard-panel-header">

              <div>

                <span className="dashboard-eyebrow">
                  CURRENT STATE
                </span>

                <h3>
                  Shipment snapshot
                </h3>

              </div>

              <span className="dashboard-panel-code">
                REV 07
              </span>

            </div>


            <div className="dashboard-state-main">

              <div>

                <span className="dashboard-state-label">
                  CONTAINER
                </span>

                <strong className="dashboard-state-id">
                  {selectedShipment}
                </strong>

              </div>


              <div className="dashboard-state-status">

                <span className="dashboard-state-label">
                  CURRENT STATUS
                </span>

                <strong>
                  IN TRANSIT
                </strong>

              </div>

            </div>


            <div className="dashboard-state-grid">

              <div className="dashboard-state-item">

                <span>
                  CURRENT LOCATION
                </span>

                <strong>
                  MUMBAI PORT
                </strong>

              </div>


              <div className="dashboard-state-item">

                <span>
                  LAST EVENT
                </span>

                <strong>
                  LOCATION UPDATED
                </strong>

              </div>


              <div className="dashboard-state-item">

                <span>
                  STATE VERSION
                </span>

                <strong>
                  07
                </strong>

              </div>

            </div>

          </section>


          {/* ================= LOWER GRID ================= */}

          <section className="dashboard-lower-grid">

            {/* RECENT ACTIVITY */}

            <section className="dashboard-panel">

              <div className="dashboard-panel-header">

                <div>

                  <span className="dashboard-eyebrow">
                    EVENT STREAM
                  </span>

                  <h3>
                    Recent activity
                  </h3>

                </div>

                <Link
                  to="/events"
                  className="dashboard-panel-code"
                >
                  VIEW ALL →
                </Link>

              </div>


              <div className="dashboard-activity-list">

                {recentEvents.map((event) => (

                  <div
                    className="dashboard-activity"
                    key={event.number}
                  >

                    <span className="dashboard-activity-number">
                      {event.number}
                    </span>

                    <div className="dashboard-activity-marker">
                      <span />
                    </div>

                    <div className="dashboard-activity-info">

                      <strong>
                        {event.title}
                      </strong>

                      <span>
                        {event.location}
                      </span>

                    </div>

                    <div className="dashboard-activity-time">

                      <span>
                        EVENT
                      </span>

                      <strong>
                        {event.time}
                      </strong>

                    </div>

                  </div>

                ))}

              </div>

            </section>


            {/* ROUTE */}

            <section className="dashboard-panel">

              <div className="dashboard-panel-header">

                <div>

                  <span className="dashboard-eyebrow">
                    MOVEMENT
                  </span>

                  <h3>
                    Shipment route
                  </h3>

                </div>

                <Link
                  to="/shipments"
                  className="dashboard-panel-code"
                >
                  DETAILS →
                </Link>

              </div>


              <div className="dashboard-route">

                <div className="dashboard-route-line">

                  <div className="dashboard-route-node complete" />

                  <div className="dashboard-route-connector complete" />

                  <div className="dashboard-route-node current" />

                  <div className="dashboard-route-connector" />

                  <div className="dashboard-route-node" />

                </div>


                <div className="dashboard-route-labels">

                  <div>
                    <strong>PUNE HUB</strong>
                    <span>ORIGIN</span>
                  </div>

                  <div>
                    <strong>MUMBAI PORT</strong>
                    <span>CURRENT</span>
                  </div>

                  <div>
                    <strong>SINGAPORE</strong>
                    <span>DESTINATION</span>
                  </div>

                </div>

              </div>


              <div className="dashboard-route-footer">

                <span>
                  ROUTE PROGRESS
                </span>

                <strong>
                  1 / 3 LOCATIONS
                </strong>

              </div>

            </section>

          </section>


          {/* ================= LEDGER ================= */}

          <section className="dashboard-panel">

            <div className="dashboard-ledger-main">

              <div>

                <span className="dashboard-eyebrow">
                  SYSTEM INTEGRITY
                </span>

                <h3>
                  Event ledger
                </h3>

              </div>

              <div className="dashboard-ledger-valid">

                <i className="dashboard-ledger-dot" />

                SEQUENCE VALID

              </div>

            </div>


            <div className="dashboard-ledger-metrics">

              <div className="dashboard-ledger-item">
                <span>RECORDED EVENTS</span>
                <strong>184</strong>
              </div>

              <div className="dashboard-ledger-item">
                <span>LATEST REVISION</span>
                <strong>07</strong>
              </div>

              <div className="dashboard-ledger-item">
                <span>LEDGER MODE</span>
                <strong>APPEND ONLY</strong>
              </div>

              <div className="dashboard-ledger-item">
                <span>STATUS</span>
                <strong>OPERATIONAL</strong>
              </div>

            </div>

          </section>

        </main>


        {/* ================= FOOTER ================= */}

        <footer className="dashboard-footer">

          <div>

            <strong>
              TRACEGRID
            </strong>

            <span>
              Event-Sourced Inventory & Logistics Ledger
            </span>

          </div>


          <div className="dashboard-footer-center">

            <span>
              PROJECT 02
            </span>

            <span>
              AXLERO SOLUTIONS
            </span>

          </div>


          <div className="dashboard-footer-right">

            <span>
              PLATFORM STATUS
            </span>

            <strong>
              <i className="dashboard-footer-dot" />
              OPERATIONAL
            </strong>

          </div>

        </footer>

      </div>

    </div>
  );
}

export default DashboardPage;