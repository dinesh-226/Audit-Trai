import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { PortManagerDashboard } from './dashboards/PortManagerDashboard';
import { ShipManagerDashboard } from './dashboards/ShipManagerDashboard';
import { InspectorDashboard } from './dashboards/InspectorDashboard';
import { ViewerDashboard } from './dashboards/ViewerDashboard';

export const Dashboard = ({ onNavigate, onOpenTamperModal }) => {
  const { user } = useAuth();

  // Route to the dedicated, specialized dashboard for each role
  switch (user?.role) {
    case 'admin':
      return (
        <AdminDashboard
          onNavigate={onNavigate}
          onOpenTamperModal={onOpenTamperModal}
        />
      );

    case 'port_manager':
      return (
        <PortManagerDashboard
          onNavigate={onNavigate}
        />
      );

    case 'ship_manager':
      return (
        <ShipManagerDashboard
          onNavigate={onNavigate}
        />
      );

    case 'inspector':
      return (
        <InspectorDashboard
          onNavigate={onNavigate}
        />
      );

    case 'viewer':
      return (
        <ViewerDashboard
          onNavigate={onNavigate}
        />
      );

    default:
      return (
        <AdminDashboard
          onNavigate={onNavigate}
          onOpenTamperModal={onOpenTamperModal}
        />
      );
  }
};

export default Dashboard;
