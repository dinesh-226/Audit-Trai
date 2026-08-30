import React from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  detail: string;
  status?: "normal" | "warning" | "positive";
};

function StatCard({
  label,
  value,
  detail,
  status = "normal",
}: StatCardProps) {
  return (
    <article className={`stat-card stat-${status}`}>
      <div className="stat-card-header">
        <span>{label}</span>

        <span className="stat-indicator" />
      </div>

      <strong className="stat-value">{value}</strong>

      <span className="stat-detail">{detail}</span>
    </article>
  );
}

export default StatCard;