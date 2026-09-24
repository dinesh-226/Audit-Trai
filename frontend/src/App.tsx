import { Routes, Route } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import ShipmentsPage from "./pages/ShipmentsPage";
import EventsPage from "./pages/EventsPage";
import HistoricalStatePage from "./pages/HistoricalStatePage";
import AnalyticsPage from "./pages/AnalyticsPage";

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
       
       <Route path="/history" element={<HistoricalStatePage />} />
       <Route path="/analytics" element={<AnalyticsPage />} />

    </Routes>
  );
}

export default App;