import { useState } from "react";

interface ShipmentSearchProps {
  onSearch: (shipmentId: string) => void;
}

export default function ShipmentSearch({
  onSearch,
}: ShipmentSearchProps) {
  const [shipmentId, setShipmentId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const value = shipmentId.trim();

    if (!value) return;

    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="shipment-id">
        Shipment / Container ID
      </label>

      <div>
        <input
          id="shipment-id"
          type="text"
          value={shipmentId}
          onChange={(e) => setShipmentId(e.target.value)}
          placeholder="Enter shipment ID..."
        />

        <button type="submit">
          Search
        </button>
      </div>
    </form>
  );
}