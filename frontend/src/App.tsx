import React from "react";
import { Routes, Route } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import EventsPage from "./pages/EventsPage";

import "./App.css";

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

    </Routes>
  );
}

export default App;