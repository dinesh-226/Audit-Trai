import React, { useState } from "react";
import "../styles/HistoricalState.css";
type HistoricalStateProps = {
  shipmentId?: string;
};

type StateSnapshot = {
  version: number;
  timestamp: string;
  status: string;
  location: string;
  lastEvent: string;
  eventType: string;
};

const snapshots: StateSnapshot[] = [
  {
    version: 1,
    timestamp: "2026-09-12 09:15",
    status: "CREATED",
    location: "PUNE WAREHOUSE",
    lastEvent: "CONTAINER CREATED",
    eventType: "CONTAINER_CREATED",
  },
  {
    version: 2,
    timestamp: "2026-09-12 14:30",
    status: "LOADED",
    location: "PUNE WAREHOUSE",
    lastEvent: "LOADED ON TRUCK",
    eventType: "LOADED_ON_TRUCK",
  },
  {
    version: 3,
    timestamp: "2026-09-13 08:45",
    status: "IN TRANSIT",
    location: "NH48",
    lastEvent: "DEPARTED WAREHOUSE",
    eventType: "SHIPMENT_DISPATCHED",
  },
  {
    version: 4,
    timestamp: "2026-09-14 16:20",
    status: "IN TRANSIT",
    location: "MUMBAI",
    lastEvent: "LOCATION UPDATED",
    eventType: "LOCATION_UPDATED",
  },
  {
    version: 5,
    timestamp: "2026-09-15 11:10",
    status: "IN TRANSIT",
    location: "MUMBAI PORT",
    lastEvent: "ARRIVED AT PORT",
    eventType: "ARRIVED_AT_PORT",
  },
  {
    version: 6,
    timestamp: "2026-09-16 13:40",
    status: "UNDER INSPECTION",
    location: "MUMBAI PORT",
    lastEvent: "CONTAINER INSPECTED",
    eventType: "CONTAINER_INSPECTED",
  },
  {
    version: 7,
    timestamp: "2026-09-17 18:05",
    status: "IN TRANSIT",
    location: "MUMBAI PORT",
    lastEvent: "LOCATION UPDATED",
    eventType: "LOCATION_UPDATED",
  },
];

function HistoricalState({
  shipmentId = "CNTR-AX4921",
}: HistoricalStateProps) {
  const [version, setVersion] = useState(snapshots.length);

  const selectedState = snapshots[version - 1];

  const handleVersionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setVersion(Number(event.target.value));
  };

  return (
    <section className="historical-state">

      {/* HEADER */}
      <div className="historical-header">

        <div>
          <span className="historical-eyebrow">
            HISTORICAL STATE / RECONSTRUCTION
          </span>

          <h2>
            State Replay
          </h2>

          <p>
            Reconstruct shipment state by replaying recorded events
            up to a selected ledger version.
          </p>
        </div>

        <div className="historical-revision">
          <span>SELECTED REVISION</span>
          <strong>
            V{String(version).padStart(2, "0")}
          </strong>
        </div>

      </div>


      {/* SHIPMENT INFO */}
      <div className="historical-identity">

        <div className="historical-identity-main">
          <span>SHIPMENT / CONTAINER</span>
          <strong>{shipmentId}</strong>
        </div>

        <div className="historical-integrity">
          <span className="integrity-dot" />
          <span>REPLAY AVAILABLE</span>
        </div>

      </div>


      {/* SCRUBBER */}
      <div className="historical-scrubber-panel">

        <div className="scrubber-top">

          <div>
            <span className="historical-label">
              STATE SCRUBBER
            </span>

            <strong>
              Event Version {version}
            </strong>
          </div>

          <div className="scrubber-date">
            {selectedState.timestamp}
          </div>

        </div>


        <div className="scrubber-wrapper">

          <input
            className="historical-range"
            type="range"
            min="1"
            max={snapshots.length}
            value={version}
            onChange={handleVersionChange}
          />

          <div className="version-markers">

            {snapshots.map((snapshot) => (
              <button
                key={snapshot.version}
                type="button"
                className={
                  snapshot.version === version
                    ? "version-marker active"
                    : snapshot.version < version
                    ? "version-marker completed"
                    : "version-marker"
                }
                onClick={() => setVersion(snapshot.version)}
                aria-label={`Select version ${snapshot.version}`}
              >
                <span />
                <small>
                  V{snapshot.version}
                </small>
              </button>
            ))}

          </div>

        </div>


        <div className="scrubber-footer">

          <span>
            V1 · INITIAL STATE
          </span>

          <span>
            V{snapshots.length} · CURRENT LEDGER STATE
          </span>

        </div>

      </div>


      {/* SELECTED EVENT */}
      <div className="selected-event">

        <div className="selected-event-number">
          V{String(selectedState.version).padStart(2, "0")}
        </div>

        <div className="selected-event-content">

          <span>
            REPLAYED EVENT
          </span>

          <strong>
            {selectedState.eventType}
          </strong>

        </div>

        <div className="selected-event-time">
          <span>TIMESTAMP</span>
          <strong>{selectedState.timestamp}</strong>
        </div>

      </div>


      {/* RECONSTRUCTED STATE */}
      <div className="reconstructed-section">

        <div className="section-heading">

          <div>
            <span className="historical-eyebrow">
              RECONSTRUCTED SNAPSHOT
            </span>

            <h3>
              State at Revision V{version}
            </h3>
          </div>

          <span className="reconstruction-badge">
            REPLAY VERIFIED
          </span>

        </div>


        <div className="state-cards">

          <div className="state-card">

            <span>STATUS</span>

            <strong>
              {selectedState.status}
            </strong>

          </div>


          <div className="state-card">

            <span>CURRENT LOCATION</span>

            <strong>
              {selectedState.location}
            </strong>

          </div>


          <div className="state-card">

            <span>LAST EVENT</span>

            <strong>
              {selectedState.lastEvent}
            </strong>

          </div>


          <div className="state-card">

            <span>STATE VERSION</span>

            <strong>
              V{String(selectedState.version).padStart(2, "0")}
            </strong>

          </div>

        </div>

      </div>


      {/* REPLAY INFORMATION */}
      <div className="replay-info">

        <div>
          <span>AGGREGATE</span>
          <strong>{shipmentId}</strong>
        </div>

        <div>
          <span>EVENTS REPLAYED</span>
          <strong>{version}</strong>
        </div>

        <div>
          <span>RECONSTRUCTION</span>
          <strong>SUCCESSFUL</strong>
        </div>

        <div>
          <span>LEDGER MODE</span>
          <strong>APPEND ONLY</strong>
        </div>

      </div>

    </section>
  );
}

export default HistoricalState;