import React from "react";

type CurrentStateProps = {
  shipmentId?: string;
  status?: string;
  location?: string;
  lastEvent?: string;
  version?: number;
};

function CurrentState({
  shipmentId = "CNTR-AX4921",
  status = "IN TRANSIT",
  location = "MUMBAI PORT",
  lastEvent = "LOCATION UPDATED",
  version = 7,
}: CurrentStateProps) {
  return (
    <section className="current-state panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            CURRENT STATE
          </span>

          <h3>Shipment snapshot</h3>
        </div>

        <span className="revision">
          REV {String(version).padStart(2, "0")}
        </span>
      </div>

      <div className="state-main">
        <div className="shipment-identity">
          <span>CONTAINER</span>

          <strong>{shipmentId}</strong>
        </div>

        <div className="state-status">
          <span>STATUS</span>

          <strong>{status}</strong>
        </div>
      </div>

      <div className="state-grid">
        <div className="state-item">
          <span>CURRENT LOCATION</span>
          <strong>{location}</strong>
        </div>

        <div className="state-item">
          <span>LAST EVENT</span>
          <strong>{lastEvent}</strong>
        </div>

        <div className="state-item">
          <span>STATE VERSION</span>
          <strong>
            {String(version).padStart(2, "0")}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default CurrentState;