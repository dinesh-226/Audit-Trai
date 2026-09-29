import { Routes, Route } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import EventsPage from "./pages/EventsPage";
<<<<<<< HEAD
import HistoricalState from "./components/HistoricalState";import "./App.css";
=======
import HistoricalStatePage from "./pages/HistoricalStatePage";
import AnalyticsPage from "./pages/AnalyticsPage";
>>>>>>> origin/frontend

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
<<<<<<< HEAD
      <Route
  path="/history"
  element={
    <div className="history-page">
      <HistoricalState shipmentId="CNTR-AX4921" />
    </div>
  }
/>
=======
       
       <Route path="/history" element={<HistoricalStatePage />} />
       <Route path="/analytics" element={<AnalyticsPage />} />
>>>>>>> origin/frontend

    </Routes>
  );
}

export default App;