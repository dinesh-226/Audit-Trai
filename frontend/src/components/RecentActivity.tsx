import React from "react";
import { Link } from "react-router-dom";

export type RecentEvent = {
  id: string;
  type: string;
  location: string;
  timestamp: string;
};

type RecentActivityProps = {
  events?: RecentEvent[];
};

const defaultEvents: RecentEvent[] = [
  {
    id: "EVT-007",
    type: "Location Updated",
    location: "Mumbai Port",
    timestamp: "15:45",
  },
  {
    id: "EVT-006",
    type: "Shipment Dispatched",
    location: "Pune Hub",
    timestamp: "12:15",
  },
  {
    id: "EVT-005",
    type: "Container Created",
    location: "Pune Hub",
    timestamp: "10:30",
  },
  {
    id: "EVT-004",
    type: "Status Updated",
    location: "Pune Hub",
    timestamp: "09:50",
  },
];

function RecentActivity({
  events = defaultEvents,
}: RecentActivityProps) {
  return (
    <section className="recent-activity panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            EVENT STREAM
          </span>

          <h3>Recent activity</h3>
        </div>

        <Link
          to="/events"
          className="panel-action"
        >
          VIEW ALL →
        </Link>
      </div>

      <div className="activity-list">
        {events.map((event, index) => (
          <div
            className="activity-item"
            key={event.id}
          >
            <div className="activity-sequence">
              {String(events.length - index).padStart(2, "0")}
            </div>

            <div className="activity-marker">
              <span />
            </div>

            <div className="activity-info">
              <strong>{event.type}</strong>

              <span>
                {event.location}
              </span>
            </div>

            <div className="activity-time">
              <span>{event.id}</span>
              <strong>{event.timestamp}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecentActivity;