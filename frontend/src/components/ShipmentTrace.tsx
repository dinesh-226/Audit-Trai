import React, { useState } from "react";

type ShipmentTraceProps = {
  onTrace?: (shipmentId: string) => void;
};

function ShipmentTrace({ onTrace }: ShipmentTraceProps) {
  const [shipmentId, setShipmentId] = useState("");

  const handleTrace = () => {
    const value = shipmentId.trim();

    if (!value) return;

    onTrace?.(value);
  };

  return (
    <section className="shipment-trace panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            AUDIT / TRACE REQUEST
          </span>

          <h3>Trace a shipment</h3>
        </div>

        <span className="panel-code">
          TG / TRACE / 001
        </span>
      </div>

      <div className="trace-body">
        <div className="trace-description">
          <p>
            Enter a shipment or container identifier to
            inspect its current state and event history.
          </p>

          <div className="trace-tags">
            <span>EVENT SOURCED</span>
            <span>TRACEABLE</span>
            <span>APPEND ONLY</span>
          </div>
        </div>

        <div className="trace-form">
          <label htmlFor="shipment-id">
            SHIPMENT / CONTAINER ID
          </label>

          <div className="trace-input-row">
            <input
              id="shipment-id"
              type="text"
              value={shipmentId}
              onChange={(event) =>
                setShipmentId(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleTrace();
                }
              }}
              placeholder="CNTR-AX4921"
            />

            <button
              type="button"
              onClick={handleTrace}
            >
              TRACE →
            </button>
          </div>

          <span className="input-hint">
            Enter identifier and press TRACE
          </span>
        </div>
      </div>
    </section>
  );
}

export default ShipmentTrace;