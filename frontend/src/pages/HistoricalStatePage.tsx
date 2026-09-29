import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/HistoricalStatePage.css";

type HistoricalEvent = {
  version: number;
  title: string;
  location: string;
  time: string;
  status: string;
};

const historicalEvents: HistoricalEvent[] = [
  {
    version: 4,
    title: "Status Updated",
    location: "PUNE HUB",
    time: "09:50",
    status: "PROCESSING",
  },
  {
    version: 5,
    title: "Container Created",
    location: "PUNE HUB",
    time: "10:30",
    status: "CREATED",
  },
  {
    version: 6,
    title: "Shipment Dispatched",
    location: "PUNE HUB",
    time: "12:15",
    status: "IN TRANSIT",
  },
  {
    version: 7,
    title: "Location Updated",
    location: "MUMBAI PORT",
    time: "15:45",
    status: "IN TRANSIT",
  },
];

function HistoricalStatePage() {
  const [selectedVersion, setSelectedVersion] = useState(7);

  const selectedEvent =
    historicalEvents.find(
      (event) => event.version === selectedVersion
    ) || historicalEvents[historicalEvents.length - 1];

  const getState = (version: number) => {
    if (version <= 4) {
      return {
        status: "PROCESSING",
        location: "PUNE HUB",
        state: "INITIALIZED",
      };
    }

    if (version === 5) {
      return {
        status: "CREATED",
        location: "PUNE HUB",
        state: "READY",
      };
    }

    if (version === 6) {
      return {
        status: "IN TRANSIT",
        location: "PUNE HUB",
        state: "ACTIVE",
      };
    }

    return {
      status: "IN TRANSIT",
      location: "MUMBAI PORT",
      state: "ACTIVE",
    };
  };

  const reconstructedState = getState(selectedVersion);

  return (
    <div className="trace-app historical-page">

      {/* ================= SIDEBAR ================= */}

      <aside className="trace-sidebar">

        <div>
          <div className="trace-brand">

            <div className="brand-mark">
              TG
            </div>

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
              className="nav-item"
            >
              <span className="nav-icon">▦</span>
              <span className="nav-label">
                Dashboard
              </span>
            </NavLink>

            <NavLink
              to="/shipments"
              className="nav-item"
            >
              <span className="nav-icon">◫</span>
              <span className="nav-label">
                Shipments
              </span>
            </NavLink>

            <NavLink
              to="/events"
              className="nav-item"
            >
              <span className="nav-icon">◷</span>
              <span className="nav-label">
                Audit Trail
              </span>
            </NavLink>

            <NavLink
              to="/history"
              className="nav-item"
            >
              <span className="nav-icon">↺</span>
              <span className="nav-label">
                Historical State
              </span>

              <span className="nav-active-mark" />
            </NavLink>

            <NavLink
              to="/analytics"
              className="nav-item"
            >
              <span className="nav-icon">⌁</span>
              <span className="nav-label">
                Analytics
              </span>
            </NavLink>

          </nav>
        </div>

        {/* SYSTEM STATUS */}

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


      {/* ================= CONTENT ================= */}

      <div className="trace-content">

        {/* TOP BAR */}

        <header className="trace-topbar">

          <div className="topbar-title">

            <span className="topbar-label">
              OPERATIONS / TEMPORAL ANALYSIS
            </span>

            <h2>
              Historical State
            </h2>

          </div>

          <div className="topbar-meta">

            <div className="topbar-meta-item">
              <span>CONTAINER</span>
              <strong>
                CNTR-AX4921
              </strong>
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

          {/* INTRO */}

          <section className="historical-intro">

            <div>

              <span className="dashboard-eyebrow">
                TEMPORAL / EVENT REPLAY
              </span>

              <h1>
                Historical State
              </h1>

              <p>
                Reconstruct the operational state of a shipment
                by replaying its immutable event history up to a
                selected ledger revision.
              </p>

            </div>

            <div className="history-revision-badge">

              <span>
                CURRENT REVISION
              </span>

              <strong>
                REV {selectedVersion}
              </strong>

              <small>
                EVENT REPLAY
              </small>

            </div>

          </section>


          {/* CONTAINER TRACE */}

          <section className="history-trace-bar">

            <div>
              <span>CONTAINER</span>
              <strong>
                CNTR-AX4921
              </strong>
            </div>

            <div>
              <span>RECONSTRUCTED STATUS</span>
              <strong className="active-state">
                {reconstructedState.status}
              </strong>
            </div>

            <div>
              <span>CURRENT LOCATION</span>
              <strong>
                {reconstructedState.location}
              </strong>
            </div>

          </section>


          {/* REPLAY */}

          <section className="history-replay-panel">

            <div className="history-section-heading">

              <div>

                <span>
                  EVENT SOURCING / REPLAY CONTROL
                </span>

                <h2>
                  Rewind ledger state
                </h2>

              </div>

              <div className="history-replay-readout">
                REVISION {selectedVersion}
              </div>

            </div>


            <div className="history-slider-area">

              <div className="history-slider-labels">
                <span>EARLIEST EVENT</span>
                <span>LATEST EVENT</span>
              </div>

              <input
                className="history-slider"
                type="range"
                min="4"
                max="7"
                step="1"
                value={selectedVersion}
                onChange={(event) =>
                  setSelectedVersion(
                    Number(event.target.value)
                  )
                }
              />


              <div className="history-revision-scale">

                {historicalEvents.map((event) => (

                  <button
                    key={event.version}
                    type="button"
                    className={
                      selectedVersion === event.version
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setSelectedVersion(event.version)
                    }
                  >

                    <span />

                    REV {event.version}

                  </button>

                ))}

              </div>

            </div>


            <div className="history-replay-note">

              <span className="history-note-dot" />

              State reconstructed by replaying events through
              <strong>
                {" "}REV {selectedVersion}
              </strong>.
              No historical record is modified during reconstruction.

            </div>

          </section>


          {/* STATE + EVENT */}

          <section className="history-content-grid">

            {/* RECONSTRUCTED STATE */}

            <div className="history-state-panel">

              <div className="history-panel-top">

                <div>
                  <span>
                    RECONSTRUCTED AGGREGATE
                  </span>

                  <h2>
                    Container State
                  </h2>
                </div>

                <span className="history-revision-code">
                  REV {selectedVersion}
                </span>

              </div>


              <div className="history-state-hero">

                <span>
                  OPERATIONAL STATUS
                </span>

                <strong>
                  {reconstructedState.status}
                </strong>

                <small>
                  STATE AFTER EVENT REPLAY
                </small>

              </div>


              <div className="history-state-grid">

                <div>
                  <span>LOCATION</span>
                  <strong>
                    {reconstructedState.location}
                  </strong>
                </div>

                <div>
                  <span>STATE</span>
                  <strong>
                    {reconstructedState.state}
                  </strong>
                </div>

                <div>
                  <span>REVISION</span>
                  <strong>
                    REV {selectedVersion}
                  </strong>
                </div>

              </div>

            </div>


            {/* SELECTED EVENT */}

            <div className="history-event-panel">

              <div className="history-panel-top">

                <div>
                  <span>
                    SELECTED LEDGER EVENT
                  </span>

                  <h2>
                    Event Detail
                  </h2>
                </div>

                <span className="history-event-number">
                  #{selectedEvent.version}
                </span>

              </div>


              <div className="history-event-icon">
                <span />
              </div>

              <span className="history-event-type">
                EVENT APPLIED
              </span>

              <h3>
                {selectedEvent.title}
              </h3>


              <div className="history-event-details">

                <div>
                  <span>VERSION</span>
                  <strong>
                    REV {selectedEvent.version}
                  </strong>
                </div>

                <div>
                  <span>LOCATION</span>
                  <strong>
                    {selectedEvent.location}
                  </strong>
                </div>

                <div>
                  <span>TIMESTAMP</span>
                  <strong>
                    {selectedEvent.time}
                  </strong>
                </div>

                <div>
                  <span>RESULTING STATUS</span>
                  <strong>
                    {selectedEvent.status}
                  </strong>
                </div>

              </div>

            </div>

          </section>


          {/* EVENT PATH */}

          <section className="history-path-panel">

            <div className="history-panel-top">

              <div>
                <span>
                  EVENT SEQUENCE
                </span>

                <h2>
                  Replay path
                </h2>
              </div>

              <span className="panel-code">
                APPEND-ONLY LEDGER
              </span>

            </div>


            <div className="history-path">

              {historicalEvents.map(
                (event, index) => {

                  const applied =
                    event.version <= selectedVersion;

                  const current =
                    event.version === selectedVersion;

                  return (
                    <React.Fragment
                      key={event.version}
                    >

                      <button
                        type="button"
                        className={`history-path-event ${
                          applied ? "applied" : ""
                        } ${
                          current ? "current" : ""
                        }`}
                        onClick={() =>
                          setSelectedVersion(
                            event.version
                          )
                        }
                      >

                        <span className="history-path-node">
                          {event.version}
                        </span>

                        <span>

                          <strong>
                            {event.title}
                          </strong>

                          <small>
                            {event.time}
                          </small>

                        </span>

                      </button>

                      {index <
                        historicalEvents.length - 1 && (
                        <span
                          className={`history-path-line ${
                            historicalEvents[index + 1]
                              .version <= selectedVersion
                              ? "applied"
                              : ""
                          }`}
                        />
                      )}

                    </React.Fragment>
                  );
                }
              )}

            </div>

          </section>


          {/* FOOTER */}

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

        </main>

      </div>

    </div>
  );
}

export default HistoricalStatePage;