import React from "react";

type LedgerStatusProps = {
  eventCount?: number;
  revision?: number;
  sequenceValid?: boolean;
};

function LedgerStatus({
  eventCount = 184,
  revision = 7,
  sequenceValid = true,
}: LedgerStatusProps) {
  return (
    <section className="ledger-status panel">

      <div className="ledger-status-main">

        <div className="ledger-title">
          <span className="eyebrow">
            SYSTEM INTEGRITY
          </span>

          <h3>Event ledger</h3>
        </div>

        <div
          className={`ledger-health ${
            sequenceValid ? "valid" : "warning"
          }`}
        >
          <span className="health-dot" />

          {sequenceValid
            ? "SEQUENCE VALID"
            : "CHECK REQUIRED"}
        </div>

      </div>

      <div className="ledger-metrics">

        <div>
          <span>RECORDED EVENTS</span>
          <strong>{eventCount}</strong>
        </div>

        <div>
          <span>LATEST REVISION</span>
          <strong>
            {String(revision).padStart(2, "0")}
          </strong>
        </div>

        <div>
          <span>LEDGER MODE</span>
          <strong>APPEND ONLY</strong>
        </div>

        <div>
          <span>STATUS</span>
          <strong>OPERATIONAL</strong>
        </div>

      </div>

    </section>
  );
}

export default LedgerStatus;