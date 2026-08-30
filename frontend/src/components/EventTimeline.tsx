import React from "react";

type AuditEvent = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  location?: string;
};

const sampleEvents: AuditEvent[] = [
  {
    id: "EVT-001",
    type: "Container Created",
    description: "Container was registered in the system.",
    timestamp: "30 Aug 2026, 10:30 AM",
    location: "Pune Warehouse",
  },
  {
    id: "EVT-002",
    type: "Shipment Dispatched",
    description: "Shipment was dispatched from the warehouse.",
    timestamp: "30 Aug 2026, 12:15 PM",
    location: "Pune Warehouse",
  },
  {
    id: "EVT-003",
    type: "In Transit",
    description: "Shipment entered transit.",
    timestamp: "30 Aug 2026, 03:45 PM",
    location: "Mumbai Route",
  },
];

function EventTimeline() {
  return (
    <section className="section event-history">
      <div className="section-heading">
        <div>
          <span className="section-label">EVENT HISTORY</span>
          <h3>Chronological audit trail</h3>
        </div>

        <span className="placeholder-tag">
          {sampleEvents.length} Events
        </span>
      </div>

      <div className="timeline">
        {sampleEvents.map((event) => (
          <div className="timeline-item" key={event.id}>
            <span className="timeline-dot" />

            <div className="timeline-content">
              <div className="timeline-top">
                <strong>{event.type}</strong>
                <span>{event.timestamp}</span>
              </div>

              <p>{event.description}</p>

              {event.location && (
                <small>Location: {event.location}</small>
              )}

              <small>Event ID: {event.id}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EventTimeline;