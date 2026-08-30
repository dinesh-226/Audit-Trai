import React from "react";
import { Link } from "react-router-dom";

type MovementOverviewProps = {
  origin?: string;
  current?: string;
  destination?: string;
};

function MovementOverview({
  origin = "PUNE HUB",
  current = "MUMBAI PORT",
  destination = "SINGAPORE",
}: MovementOverviewProps) {
  return (
    <section className="movement-overview panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            MOVEMENT
          </span>

          <h3>Shipment route</h3>
        </div>

        <Link
          to="/shipments"
          className="panel-action"
        >
          DETAILS →
        </Link>
      </div>

      <div className="route-content">
        <div className="route-line">
          <div className="route-node complete">
            <span />
          </div>

          <div className="route-connector complete" />

          <div className="route-node current">
            <span />
          </div>

          <div className="route-connector" />

          <div className="route-node pending">
            <span />
          </div>
        </div>

        <div className="route-labels">
          <div>
            <strong>{origin}</strong>
            <span>ORIGIN</span>
          </div>

          <div>
            <strong>{current}</strong>
            <span>CURRENT</span>
          </div>

          <div>
            <strong>{destination}</strong>
            <span>DESTINATION</span>
          </div>
        </div>
      </div>

      <div className="route-footer">
        <span>ROUTE PROGRESS</span>
        <strong>1 / 3 LOCATIONS</strong>
      </div>
    </section>
  );
}

export default MovementOverview;