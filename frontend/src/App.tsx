import React from "react";
import { Routes, Route } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import EventsPage from "./pages/EventsPage";
import HistoricalState from "./components/HistoricalState";import "./App.css";

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<DashboardPage />}
      />

      <Route
        path="/dashboard"
        element={<DashboardPage />}
      />

      <Route
        path="/shipments"
        element={<ShipmentsPage />}
      />

      <Route
        path="/events"
        element={<EventsPage />}
      />
      <Route
  path="/history"
  element={
    <div className="history-page">
      <HistoricalState shipmentId="CNTR-AX4921" />
    </div>
  }
/>

    </Routes>
  );
}

export default App;