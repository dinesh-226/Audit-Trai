import React from "react";

function EventsPage() {
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Event History</h1>
          <p>Chronological audit trail of shipment activity.</p>
        </div>

        <span className="prototype-badge">Event Store</span>
      </header>

      <main className="dashboard">
        <section className="intro">
          <span className="label">EVENT HISTORY</span>

          <h2>Every change is recorded.</h2>

          <p>
            Review the sequence of events used to reconstruct the current
            shipment state.
          </p>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-label">CHRONOLOGICAL EVENTS</span>
              <h3>Audit trail</h3>
            </div>
          </div>

          <div className="timeline-placeholder">
            <div className="timeline-item">
              <span className="timeline-dot" />

              <div>
                <strong>Container Created</strong>
                <p>Initial container creation event.</p>
              </div>
            </div>

            <div className="timeline-item">
              <span className="timeline-dot" />

              <div>
                <strong>Shipment Updated</strong>
                <p>Shipment information was updated.</p>
              </div>
            </div>

            <div className="timeline-item">
              <span className="timeline-dot" />

              <div>
                <strong>Location Updated</strong>
                <p>Container location changed.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default EventsPage;