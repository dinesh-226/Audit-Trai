import { NavLink } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import "../styles/AnalyticsPage.css";

const temperatureData = [
  { time: "09:00", temperature: 4.2 },
  { time: "10:00", temperature: 4.5 },
  { time: "11:00", temperature: 5.1 },
  { time: "12:00", temperature: 5.8 },
  { time: "13:00", temperature: 7.2 },
  { time: "14:00", temperature: 9.8 },
  { time: "15:00", temperature: 6.4 },
  { time: "15:45", temperature: 5.2 },
];

const activityData = [
  { time: "09:00", events: 2 },
  { time: "10:00", events: 5 },
  { time: "11:00", events: 3 },
  { time: "12:00", events: 7 },
  { time: "13:00", events: 4 },
  { time: "14:00", events: 9 },
  { time: "15:00", events: 6 },
  { time: "15:45", events: 4 },
];

function AnalyticsPage() {
  return (
    <div className="trace-app analytics-page">

      {/* SIDEBAR */}

      <aside className="trace-sidebar">

        <div>

          <div className="trace-brand">

            <div className="brand-mark">
              TG
            </div>

            <div className="brand-text">
              <h1>TRACEGRID</h1>
              <span>LOGISTICS LEDGER</span>
            </div>

          </div>

          <div className="sidebar-divider" />

          <nav className="trace-nav">

            <span className="nav-heading">
              WORKSPACE
            </span>

            <NavLink to="/" className="nav-item">
              <span className="nav-icon">▦</span>
              <span className="nav-label">
                Dashboard
              </span>
            </NavLink>

            <NavLink
              to="/shipments"
              className="nav-item"
            >
              <span className="nav-icon">◫</span>
              <span className="nav-label">
                Shipments
              </span>
            </NavLink>

            <NavLink
              to="/events"
              className="nav-item"
            >
              <span className="nav-icon">◷</span>
              <span className="nav-label">
                Audit Trail
              </span>
            </NavLink>

            <NavLink
              to="/history"
              className="nav-item"
            >
              <span className="nav-icon">↺</span>
              <span className="nav-label">
                Historical State
              </span>
            </NavLink>

            <NavLink
              to="/analytics"
              className="nav-item"
            >
              <span className="nav-icon">⌁</span>
              <span className="nav-label">
                Analytics
              </span>
              <span className="nav-active-mark" />
            </NavLink>

          </nav>

        </div>


        <div className="system-card">

          <div className="system-card-top">
            <span className="status-indicator" />
            <span>SYSTEM ONLINE</span>
          </div>

          <small>
            Event ledger operational
          </small>

          <div className="system-version">
            TRACEGRID / v0.1
          </div>

        </div>

      </aside>


      {/* CONTENT */}

      <div className="trace-content">

        {/* TOPBAR */}

        <header className="trace-topbar">

          <div className="topbar-title">

            <span className="topbar-label">
              OPERATIONS / TEMPORAL ANALYTICS
            </span>

            <h2>
              Logistics Analytics
            </h2>

          </div>

          <div className="topbar-meta">

            <div className="topbar-meta-item">
              <span>CONTAINER</span>
              <strong>
                CNTR-AX4921
              </strong>
            </div>

            <div className="topbar-line" />

            <div className="topbar-meta-item">
              <span>LEDGER</span>
              <strong className="ledger-active">
                ● ACTIVE
              </strong>
            </div>

          </div>

        </header>


        {/* MAIN */}

        <main className="trace-main">

          {/* INTRO */}

          <section className="analytics-intro">

            <div>

              <span className="dashboard-eyebrow">
                SENSOR / EVENT CORRELATION
              </span>

              <h1>
                Analytics
              </h1>

              <p>
                Analyze operational sensor readings and event
                activity across the shipment timeline to identify
                abnormal conditions and temporal correlations.
              </p>

            </div>

            <div className="analytics-revision">

              <span>
                ANALYSIS WINDOW
              </span>

              <strong>
                REV 04 — REV 07
              </strong>

              <small>
                ACTIVE CONTAINER
              </small>

            </div>

          </section>


          {/* SUMMARY */}

          <section className="analytics-summary">

            <div className="analytics-summary-card">

              <span>
                TEMPERATURE PEAK
              </span>

              <strong>
                9.8°C
              </strong>

              <small>
                14:00 EVENT WINDOW
              </small>

            </div>

            <div className="analytics-summary-card">

              <span>
                EVENTS ANALYZED
              </span>

              <strong>
                04
              </strong>

              <small>
                REVISIONS 04 — 07
              </small>

            </div>

            <div className="analytics-summary-card">

              <span>
                CURRENT TEMPERATURE
              </span>

              <strong>
                5.2°C
              </strong>

              <small>
                WITHIN OPERATING RANGE
              </small>

            </div>

            <div className="analytics-summary-card alert">

              <span>
                ANOMALY WINDOW
              </span>

              <strong>
                14:00
              </strong>

              <small>
                TEMPERATURE SPIKE DETECTED
              </small>

            </div>

          </section>


          {/* TEMPERATURE CHART */}

          <section className="analytics-panel">

            <div className="analytics-panel-header">

              <div>

                <span>
                  SENSOR METRIC / TEMPERATURE
                </span>

                <h3>
                  Temperature over event timeline
                </h3>

              </div>

              <span className="analytics-code">
                SENSOR / TEMP / 01
              </span>

            </div>


            <div className="analytics-chart">

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <LineChart data={temperatureData}>

                  <CartesianGrid
                    stroke="#d5d1c8"
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fontSize: 10,
                      fill: "#77746c",
                    }}
                    axisLine={{
                      stroke: "#cbc7bd",
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 12]}
                    tick={{
                      fontSize: 10,
                      fill: "#77746c",
                    }}
                    axisLine={{
                      stroke: "#cbc7bd",
                    }}
                    tickLine={false}
                    unit="°C"
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#171816",
                      border: "1px solid #df9828",
                      color: "#f5f3ed",
                      fontSize: "11px",
                    }}
                    formatter={(value) => [
                      `${value}°C`,
                      "Temperature",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#df9828"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: "#df9828",
                    }}
                    activeDot={{
                      r: 5,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </section>


          {/* SECONDARY ANALYTICS */}

          <section className="analytics-grid">

            {/* EVENT ACTIVITY */}

            <div className="analytics-panel">

              <div className="analytics-panel-header">

                <div>

                  <span>
                    LEDGER ACTIVITY
                  </span>

                  <h3>
                    Event frequency
                  </h3>

                </div>

                <span className="analytics-code">
                  EVENTS / HOUR
                </span>

              </div>


              <div className="analytics-chart small">

                <ResponsiveContainer
                  width="100%"
                  height={250}
                >

                  <AreaChart data={activityData}>

                    <CartesianGrid
                      stroke="#d5d1c8"
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="time"
                      tick={{
                        fontSize: 9,
                        fill: "#77746c",
                      }}
                      axisLine={{
                        stroke: "#cbc7bd",
                      }}
                      tickLine={false}
                    />

                    <YAxis
                      allowDecimals={false}
                      tick={{
                        fontSize: 9,
                        fill: "#77746c",
                      }}
                      axisLine={{
                        stroke: "#cbc7bd",
                      }}
                      tickLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#171816",
                        border: "1px solid #df9828",
                        color: "#f5f3ed",
                        fontSize: "10px",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="events"
                      stroke="#71864d"
                      fill="#71864d"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              </div>

            </div>


            {/* TEMPORAL FINDINGS */}

            <div className="analytics-panel">

              <div className="analytics-panel-header">

                <div>

                  <span>
                    TEMPORAL ANALYSIS
                  </span>

                  <h3>
                    Detected conditions
                  </h3>

                </div>

                <span className="analytics-code">
                  ANALYSIS / 04
                </span>

              </div>


              <div className="analytics-findings">

                <div className="finding-row">

                  <div className="finding-marker warning">
                    !
                  </div>

                  <div>

                    <strong>
                      Temperature spike
                    </strong>

                    <span>
                      Peak of 9.8°C recorded around
                      revision window 06.
                    </span>

                  </div>

                </div>


                <div className="finding-row">

                  <div className="finding-marker normal">
                    ✓
                  </div>

                  <div>

                    <strong>
                      Recovery detected
                    </strong>

                    <span>
                      Temperature returned toward
                      baseline after the spike.
                    </span>

                  </div>

                </div>


                <div className="finding-row">

                  <div className="finding-marker normal">
                    ✓
                  </div>

                  <div>

                    <strong>
                      Ledger continuity
                    </strong>

                    <span>
                      Event sequence remains continuous
                      across the selected revisions.
                    </span>

                  </div>

                </div>


                <div className="finding-row">

                  <div className="finding-marker normal">
                    ✓
                  </div>

                  <div>

                    <strong>
                      Current state
                    </strong>

                    <span>
                      Container remains in transit at
                      Mumbai Port.
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* FOOTER */}

          <footer className="dashboard-footer">

            <div>

              <strong>
                TRACEGRID
              </strong>

              <span>
                Event-Sourced Inventory & Logistics Ledger
              </span>

            </div>

            <div className="dashboard-footer-center">

              <span>
                PROJECT 02
              </span>

              <span>
                AXLERO SOLUTIONS
              </span>

            </div>

            <div className="dashboard-footer-right">

              <span>
                PLATFORM STATUS
              </span>

              <strong>
                <i className="dashboard-footer-dot" />
                OPERATIONAL
              </strong>

            </div>

          </footer>

        </main>

      </div>

    </div>
  );
}

export default AnalyticsPage;