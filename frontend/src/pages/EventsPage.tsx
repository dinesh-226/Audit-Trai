import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/EventsPage.css";

type AuditEvent = {
  id: string;
  type: string;
  description: string;
  location: string;
  timestamp: string;
  actor: string;
};

const events: AuditEvent[] = [
  {
    id: "EVT-007",
    type: "Location Updated",
    description: "Container location changed during shipment movement.",
    location: "Mumbai Port",
    timestamp: "30 Aug 2026 / 15:45",
    actor: "LOGISTICS-SVC",
  },
  {
    id: "EVT-006",
    type: "Shipment Dispatched",
    description: "Shipment dispatched from the Pune logistics hub.",
    location: "Pune Hub",
    timestamp: "30 Aug 2026 / 12:15",
    actor: "DISPATCH-SVC",
  },
  {
    id: "EVT-005",
    type: "Container Created",
    description: "New container record registered in the ledger.",
    location: "Pune Hub",
    timestamp: "30 Aug 2026 / 10:30",
    actor: "SYSTEM",
  },
  {
    id: "EVT-004",
    type: "Status Updated",
    description: "Shipment status changed to active transit.",
    location: "Pune Hub",
    timestamp: "30 Aug 2026 / 09:50",
    actor: "LOGISTICS-SVC",
  },
  {
    id: "EVT-003",
    type: "Shipment Created",
    description: "Shipment aggregate initialized.",
    location: "Pune Hub",
    timestamp: "30 Aug 2026 / 09:20",
    actor: "SYSTEM",
  },
];

function EventsPage() {
  const [search, setSearch] = useState("");

  const filteredEvents = events.filter((event) =>
    `${event.id} ${event.type} ${event.location} ${event.actor}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="trace-app events-page">

      {/* SIDEBAR */}

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

            <NavLink to="/" className="nav-item">
              <span className="nav-icon">▦</span>
              <span className="nav-label">Dashboard</span>
            </NavLink>

            <NavLink to="/shipments" className="nav-item">
              <span className="nav-icon">◫</span>
              <span className="nav-label">Shipments</span>
            </NavLink>

            <NavLink to="/events" className="nav-item active">
              <span className="nav-icon">◷</span>
              <span className="nav-label">Audit Trail</span>
              <span className="nav-active-mark" />
            </NavLink>

            <NavLink to="/history" className="nav-item">
              <span className="nav-icon">↺</span>
              <span className="nav-label">Historical State</span>
            </NavLink>

            <NavLink to="/analytics" className="nav-item">
              <span className="nav-icon">⌁</span>
              <span className="nav-label">Analytics</span>
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


      {/* CONTENT */}

      <div className="trace-content">

        <header className="trace-topbar">

          <div className="topbar-title">

            <span className="topbar-label">
              AUDIT / EVENT LEDGER
            </span>

            <h2>
              Audit Trail
            </h2>

          </div>

          <div className="topbar-meta">

            <div className="topbar-meta-item">
              <span>EVENTS</span>
              <strong>{filteredEvents.length} LOADED</strong>
            </div>

            <div className="topbar-line" />

            <div className="topbar-meta-item">
              <span>SEQUENCE</span>
              <strong className="ledger-active">
                ● VALID
              </strong>
            </div>

          </div>

        </header>


        <main className="trace-main">

          {/* INTRO */}

          <section className="events-intro">

            <div>

              <span className="dashboard-eyebrow">
                EVENT-SOURCED / APPEND-ONLY
              </span>

              <h1>
                Audit Trail
              </h1>

              <p>
                Inspect the chronological sequence of recorded
                events that defines shipment state.
              </p>

            </div>

            <div className="ledger-sequence">

              <span>LATEST SEQUENCE</span>

              <strong>
                #0007
              </strong>

            </div>

          </section>


          {/* FILTER */}

          <section className="event-filter-panel">

            <div>
              <span>LEDGER QUERY</span>
              <h3>Search event history</h3>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Event ID, type, location, actor..."
            />

          </section>


          {/* TIMELINE */}

          <section className="event-ledger-panel">

            <div className="event-panel-header">

              <div>
                <span className="dashboard-eyebrow">
                  CHRONOLOGICAL RECORD
                </span>

                <h3>
                  Event sequence
                </h3>
              </div>

              <span className="event-count">
                {filteredEvents.length} EVENTS
              </span>

            </div>


            <div className="event-timeline">

              {filteredEvents.map((event, index) => (

                <article
                  className="event-row"
                  key={event.id}
                >

                  <div className="event-sequence">
                    {String(filteredEvents.length - index).padStart(2, "0")}
                  </div>

                  <div className="event-node-area">
                    <span className="event-node" />
                    {index !== filteredEvents.length - 1 && (
                      <span className="event-line" />
                    )}
                  </div>

                  <div className="event-content">

                    <div className="event-main">

                      <div>

                        <span className="event-id">
                          {event.id}
                        </span>

                        <h4>
                          {event.type}
                        </h4>

                      </div>

                      <time>
                        {event.timestamp}
                      </time>

                    </div>

                    <p>
                      {event.description}
                    </p>

                    <div className="event-meta">

                      <span>
                        LOCATION: <strong>{event.location}</strong>
                      </span>

                      <span>
                        ACTOR: <strong>{event.actor}</strong>
                      </span>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          </section>


          {/* INTEGRITY */}

          <section className="event-integrity">

            <div>

              <span className="dashboard-eyebrow">
                SYSTEM INTEGRITY
              </span>

              <h3>
                Ledger sequence valid
              </h3>

            </div>

            <div className="integrity-status">
              <span />
              APPEND-ONLY / VERIFIED
            </div>

          </section>

        </main>


        <footer className="dashboard-footer">

          <div>
            <strong>TRACEGRID</strong>
            <span>
              Event-Sourced Inventory & Logistics Ledger
            </span>
          </div>

          <div className="dashboard-footer-center">
            <span>PROJECT 02</span>
            <span>AXLERO SOLUTIONS</span>
          </div>

          <div className="dashboard-footer-right">
            <span>PLATFORM STATUS</span>

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

export default EventsPage;