import React from "react";

function DashboardPage() {
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Audit Trail</h1>
          <p>Event-Sourced Inventory &amp; Logistics Ledger</p>
        </div>

        <span className="prototype-badge">Prototype</span>
      </header>

      <main className="dashboard">
        {/* Project Introduction */}
        <section className="intro">
          <span className="label">AUDIT TRAIL</span>

          <h2>
            Track every event.
            <br />
            Reconstruct every state.
          </h2>

          <p>
            Explore the chronological history of shipments and containers
            through an event-sourced audit trail.
          </p>
        </section>

        {/* Shipment Search */}
        <section className="search-card">
          <div>
            <span className="section-label">SHIPMENT LOOKUP</span>
            <h3>Find a shipment or container</h3>
          </div>

          <div className="search-row">
            <input
              type="text"
              placeholder="Enter shipment ID or container ID..."
            />

            <button type="button">Search</button>
          </div>
        </section>

        {/* Current State */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-label">CURRENT STATE</span>
              <h3>Shipment overview</h3>
            </div>

            <span className="placeholder-tag">Awaiting selection</span>
          </div>

          <div className="cards">
            <div className="info-card">
              <span>Status</span>
              <strong>—</strong>
            </div>

            <div className="info-card">
              <span>Location</span>
              <strong>—</strong>
            </div>

            <div className="info-card">
              <span>Last Event</span>
              <strong>—</strong>
            </div>

            <div className="info-card">
              <span>Version</span>
              <strong>—</strong>
            </div>
          </div>
        </section>

        {/* Event History */}
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-label">EVENT HISTORY</span>
              <h3>Chronological audit trail</h3>
            </div>
          </div>

          <div className="timeline-placeholder">
            <div className="timeline-item">
              <span className="timeline-dot" />

              <div>
                <strong>Container Created</strong>
                <p>Event will appear here</p>
              </div>
            </div>

            <div className="timeline-item">
              <span className="timeline-dot" />

              <div>
                <strong>Shipment Event</strong>
                <p>Event history will be loaded from the Event Store</p>
              </div>
            </div>

            <div className="timeline-item">
              <span className="timeline-dot" />

              <div>
                <strong>Current State</strong>
                <p>State will be reconstructed from events</p>
              </div>
            </div>
          </div>
        </section>

        {/* Planned Features */}
        <section className="future-grid">
          <div className="future-card">
            <span>01</span>

            <h3>Historical State</h3>

            <p>
              Rewind through the event history to inspect the state at an
              earlier point in time.
            </p>
          </div>

          <div className="future-card">
            <span>02</span>

            <h3>Sensor Analytics</h3>

            <p>
              Visualize metrics such as temperature alongside the event
              timeline.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;