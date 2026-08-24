import { useState } from 'react';

const AuditTrailDashboard = () => {
  const [shipmentId, setShipmentId] = useState('');

  const handleSearch = () => {
    const value = shipmentId.trim();

    if (!value) return;

    console.log('Searching shipment:', value);
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <p className="eyebrow">AUDIT TRAI</p>

        <h1>Event-Sourced Inventory & Logistics Ledger</h1>

        <p className="subtitle">
          Trace shipment activity through an immutable event history.
        </p>
      </header>

      <section className="search-card">
        <div>
          <h2>Search Shipment or Container</h2>

          <p>
            Enter a shipment ID to inspect its complete audit trail.
          </p>
        </div>

        <div className="search-row">
          <input
            type="text"
            value={shipmentId}
            onChange={(event) => setShipmentId(event.target.value)}
            placeholder="Enter shipment ID..."
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSearch();
              }
            }}
          />

          <button type="button" onClick={handleSearch}>
            Search
          </button>
        </div>
      </section>

      <section className="empty-state">
        <div className="empty-icon">⌕</div>

        <h2>No Shipment Selected</h2>

        <p>
          Search for a shipment or container to view its event history.
        </p>
      </section>
    </main>
  );
};

export default AuditTrailDashboard;