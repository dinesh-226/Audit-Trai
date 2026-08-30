import React, { useMemo, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "../styles/ShipmentsPage.css";

type Shipment = {
  id: string;
  status: "IN TRANSIT" | "DELIVERED" | "DELAYED";
  origin: string;
  destination: string;
  location: string;
  updated: string;
};

const shipments: Shipment[] = [
  {
    id: "CNTR-AX4921",
    status: "IN TRANSIT",
    origin: "PUNE HUB",
    destination: "SINGAPORE",
    location: "MUMBAI PORT",
    updated: "15:45",
  },
  {
    id: "CNTR-BK7318",
    status: "DELIVERED",
    origin: "DELHI HUB",
    destination: "DUBAI",
    location: "DUBAI",
    updated: "14:20",
  },
  {
    id: "CNTR-QP1842",
    status: "IN TRANSIT",
    origin: "MUMBAI",
    destination: "ROTTERDAM",
    location: "MUMBAI PORT",
    updated: "13:05",
  },
  {
    id: "CNTR-LM5520",
    status: "DELAYED",
    origin: "PUNE HUB",
    destination: "TOKYO",
    location: "NASHIK ROUTE",
    updated: "11:40",
  },
];

function ShipmentsPage() {
  const [search, setSearch] = useState("");

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) =>
      `${shipment.id} ${shipment.origin} ${shipment.destination} ${shipment.location}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="trace-app shipments-page">

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
            <span className="nav-heading">WORKSPACE</span>

            <NavLink to="/" className="nav-item">
              <span className="nav-icon">▦</span>
              <span className="nav-label">Dashboard</span>
            </NavLink>

            <NavLink to="/shipments" className="nav-item active">
              <span className="nav-icon">◫</span>
              <span className="nav-label">Shipments</span>
              <span className="nav-active-mark" />
            </NavLink>

            <NavLink to="/events" className="nav-item">
              <span className="nav-icon">◷</span>
              <span className="nav-label">Audit Trail</span>
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

          <small>Event ledger operational</small>

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
              OPERATIONS / SHIPMENT REGISTRY
            </span>

            <h2>Shipment Registry</h2>
          </div>

          <div className="topbar-meta">
            <div className="topbar-meta-item">
              <span>RECORDS</span>
              <strong>{filteredShipments.length} ACTIVE VIEW</strong>
            </div>

            <div className="topbar-line" />

            <div className="topbar-meta-item">
              <span>LEDGER</span>
              <strong className="ledger-active">● ACTIVE</strong>
            </div>
          </div>

        </header>


        <main className="trace-main">

          {/* HEADER */}

          <section className="shipments-intro">

            <div>
              <span className="dashboard-eyebrow">
                INVENTORY / LOGISTICS
              </span>

              <h1>Shipment Registry</h1>

              <p>
                Search and inspect registered shipments,
                containers, routes, and their current operational state.
              </p>
            </div>

            <div className="registry-count">
              <span>REGISTERED</span>
              <strong>24</strong>
              <small>SHIPMENTS</small>
            </div>

          </section>


          {/* SEARCH */}

          <section className="shipment-search-panel">

            <div className="search-heading">
              <div>
                <span>REGISTRY QUERY</span>
                <h3>Find shipment</h3>
              </div>

              <span className="panel-code">
                TG / SHIP / 002
              </span>
            </div>

            <div className="shipment-search">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search container, origin, destination..."
              />

              <button type="button">
                SEARCH
              </button>
            </div>

          </section>


          {/* TABLE */}

          <section className="shipment-table-panel">

            <div className="table-header">

              <div>
                <span className="dashboard-eyebrow">
                  REGISTERED ASSETS
                </span>

                <h3>Shipment records</h3>
              </div>

              <span className="record-status">
                {filteredShipments.length} RECORDS
              </span>

            </div>


            <div className="shipment-table-wrapper">

              <table className="shipment-table">

                <thead>
                  <tr>
                    <th>CONTAINER</th>
                    <th>STATUS</th>
                    <th>ROUTE</th>
                    <th>CURRENT LOCATION</th>
                    <th>UPDATED</th>
                    <th />
                  </tr>
                </thead>

                <tbody>

                  {filteredShipments.map((shipment) => (

                    <tr key={shipment.id}>

                      <td>
                        <strong className="container-id">
                          {shipment.id}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`shipment-status ${shipment.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          <i />
                          {shipment.status}
                        </span>
                      </td>

                      <td>
                        <div className="route-cell">
                          <strong>{shipment.origin}</strong>
                          <span>→</span>
                          <strong>{shipment.destination}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="location-cell">
                          {shipment.location}
                        </span>
                      </td>

                      <td>
                        <span className="updated-cell">
                          {shipment.updated}
                        </span>
                      </td>

                      <td>
                        <Link
                          to={`/shipments/${shipment.id}`}
                          className="inspect-button"
                        >
                          INSPECT →
                        </Link>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {filteredShipments.length === 0 && (
              <div className="empty-state">
                NO MATCHING SHIPMENT RECORDS
              </div>
            )}

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

export default ShipmentsPage;