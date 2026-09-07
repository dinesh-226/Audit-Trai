import React from "react";

function ShipmentsPage() {
  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Shipments</h1>
          <p>Track shipment and container activity.</p>
        </div>

        <span className="prototype-badge">Audit Trail</span>
      </header>

      <main className="dashboard">
        <section className="intro">
          <span className="label">SHIPMENTS</span>

          <h2>Shipment Records</h2>

          <p>
            Search and inspect shipment information and associated containers.
          </p>
        </section>

        <section className="section">
          <div className="search-card">
            <span className="section-label">SHIPMENT LOOKUP</span>

            <h3>Find a shipment</h3>

            <div className="search-row">
              <input
                type="text"
                placeholder="Enter shipment ID..."
              />

              <button type="button">Search</button>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <span className="section-label">SHIPMENT DATA</span>
              <h3>Recent shipments</h3>
            </div>
          </div>

          <div className="cards">
            <div className="info-card">
              <span>Shipment ID</span>
              <strong>—</strong>
            </div>

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
          </div>
        </section>
      </main>
    </div>
  );
}

export default ShipmentsPage;