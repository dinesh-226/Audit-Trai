import React, { useState } from "react";

type ShipmentSearchProps = {
  onSearch: (shipmentId: string) => void;
};

function ShipmentSearch({ onSearch }: ShipmentSearchProps) {
  const [shipmentId, setShipmentId] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const value = shipmentId.trim();

    if (!value) {
      return;
    }

    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="shipment-search">
        SHIPMENT / CONTAINER ID
      </label>

      <div className="dashboard-trace-input">
        <input
          id="shipment-search"
          type="text"
          value={shipmentId}
          onChange={(event) => setShipmentId(event.target.value)}
          placeholder="CNTR-AX4921"
        />

        <button type="submit">
          TRACE →
        </button>
      </div>
    </form>
  );
}

export default ShipmentSearch;