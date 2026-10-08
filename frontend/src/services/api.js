export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('auditflow_token');
  const demoRole = localStorage.getItem('auditflow_demo_role');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (demoRole) {
    headers['x-demo-role'] = demoRole;
  }

  return headers;
};

const handleResponse = async (res) => {
  if (!res.ok) {
    let errorMsg = 'API request failed';
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.error || errorJson.message || errorMsg;
    } catch (e) {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

/**
 * Clean Query String Builder: removes undefined, null, empty strings, and stringified 'undefined'/'null'
 */
const buildQueryString = (params = {}) => {
  const cleanParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'undefined' &&
      value !== 'null'
    ) {
      cleanParams[key] = value;
    }
  }
  const qs = new URLSearchParams(cleanParams).toString();
  return qs ? `?${qs}` : '';
};

export const api = {
  // Authentication & Users
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return handleResponse(res);
    },
    register: async (userData) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return handleResponse(res);
    },
    getProfile: async () => {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getDemoUsers: async () => {
      const res = await fetch(`${API_BASE}/auth/demo-users`);
      return handleResponse(res);
    },
    updateProfile: async (profileData) => {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      });
      return handleResponse(res);
    },
    updateUserRole: async (userId, role) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ role })
      });
      return handleResponse(res);
    },
    forgotPassword: async (email) => {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return handleResponse(res);
    },
    resetPassword: async (email, code, newPassword) => {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      return handleResponse(res);
    },
    getPendingUsers: async () => {
      const res = await fetch(`${API_BASE}/auth/pending-users`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    updateUserApproval: async (userId, action) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/approval`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ action })
      });
      return handleResponse(res);
    },
    getUsers: async (params = {}) => {
      const res = await fetch(`${API_BASE}/auth/users${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    createUser: async (userData) => {
      const res = await fetch(`${API_BASE}/auth/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      return handleResponse(res);
    },
    toggleUserStatus: async (userId, isActive) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isActive })
      });
      return handleResponse(res);
    },
    adminResetPassword: async (userId, newPassword) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ newPassword })
      });
      return handleResponse(res);
    },
    deleteUser: async (userId) => {
      const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getSecurityStats: async () => {
      const res = await fetch(`${API_BASE}/auth/security-stats`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Ships Fleet
  ships: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/ships${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getById: async (shipId) => {
      const res = await fetch(`${API_BASE}/ships/${shipId}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (shipData) => {
      const res = await fetch(`${API_BASE}/ships`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(shipData)
      });
      return handleResponse(res);
    },
    update: async (shipId, updateData) => {
      const res = await fetch(`${API_BASE}/ships/${shipId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });
      return handleResponse(res);
    },
    updateStatus: async (shipId, status, currentLocation) => {
      const res = await fetch(`${API_BASE}/ships/${shipId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, currentLocation })
      });
      return handleResponse(res);
    }
  },

  // Containers
  containers: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/containers${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getById: async (containerId) => {
      const res = await fetch(`${API_BASE}/containers/${containerId}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (containerData) => {
      const res = await fetch(`${API_BASE}/containers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(containerData)
      });
      return handleResponse(res);
    },
    updateStatus: async (containerId, statusData) => {
      const res = await fetch(`${API_BASE}/containers/${containerId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(statusData)
      });
      return handleResponse(res);
    },
    assignShip: async (containerId, shipId) => {
      const res = await fetch(`${API_BASE}/containers/${containerId}/assign-ship`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ shipId })
      });
      return handleResponse(res);
    }
  },

  // Cryptographic Audit Trail
  auditLogs: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/audit-logs${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getStats: async () => {
      const res = await fetch(`${API_BASE}/audit-logs/stats/summary`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    verifyIntegrity: async () => {
      const res = await fetch(`${API_BASE}/audit-logs/verify-integrity`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    simulateTamper: async (tamperData = {}) => {
      const res = await fetch(`${API_BASE}/audit-logs/simulate-tamper`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tamperData)
      });
      return handleResponse(res);
    },
    repairChain: async () => {
      const res = await fetch(`${API_BASE}/audit-logs/repair-chain`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getById: async (auditId) => {
      const res = await fetch(`${API_BASE}/audit-logs/${auditId}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Inspections
  inspections: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/inspections${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getStats: async (params = {}) => {
      const res = await fetch(`${API_BASE}/inspections/stats${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (inspectionData) => {
      const res = await fetch(`${API_BASE}/inspections`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inspectionData)
      });
      return handleResponse(res);
    },
    updateStatus: async (inspectionId, statusData) => {
      const res = await fetch(`${API_BASE}/inspections/${encodeURIComponent(inspectionId)}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(statusData)
      });
      return handleResponse(res);
    },
    requestReinspection: async (inspectionId, data) => {
      const res = await fetch(`${API_BASE}/inspections/${encodeURIComponent(inspectionId)}/request-reinspection`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },

  // Evidence
  evidence: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/evidence${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    attach: async (evidenceData) => {
      const res = await fetch(`${API_BASE}/evidence`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(evidenceData)
      });
      return handleResponse(res);
    }
  },

  // Anomalies
  anomalies: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/anomalies${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    resolve: async (anomalyId, resolutionNotes) => {
      const res = await fetch(`${API_BASE}/anomalies/${anomalyId}/resolve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ resolutionNotes })
      });
      return handleResponse(res);
    }
  },

  // Alerts
  alerts: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/alerts${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (alertData) => {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(alertData)
      });
      return handleResponse(res);
    },
    markRead: async (alertId) => {
      const res = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    markAllRead: async () => {
      const res = await fetch(`${API_BASE}/alerts/mark-all-read`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Port Activities & Operations
  portActivities: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/port-activities${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getBerths: async (port) => {
      const res = await fetch(`${API_BASE}/port-activities/berths?port=${encodeURIComponent(port || 'Mumbai Port')}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    updateBerth: async (berthId, berthData) => {
      const res = await fetch(`${API_BASE}/port-activities/berths/${encodeURIComponent(berthId)}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(berthData)
      });
      return handleResponse(res);
    },
    recordGate: async (gateData) => {
      const res = await fetch(`${API_BASE}/port-activities/gate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(gateData)
      });
      return handleResponse(res);
    },
    assignYardSlot: async (yardData) => {
      const res = await fetch(`${API_BASE}/port-activities/yard-slot`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(yardData)
      });
      return handleResponse(res);
    },
    loadingAction: async (loadingData) => {
      const res = await fetch(`${API_BASE}/port-activities/loading-action`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(loadingData)
      });
      return handleResponse(res);
    },
    holdContainer: async (holdData) => {
      const res = await fetch(`${API_BASE}/port-activities/hold-container`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(holdData)
      });
      return handleResponse(res);
    },
    recordDelay: async (delayData) => {
      const res = await fetch(`${API_BASE}/port-activities/delay`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(delayData)
      });
      return handleResponse(res);
    },
    logActivity: async (activityData) => {
      const res = await fetch(`${API_BASE}/port-activities/log`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(activityData)
      });
      return handleResponse(res);
    },
    getReport: async (port) => {
      const res = await fetch(`${API_BASE}/port-activities/report?port=${encodeURIComponent(port || 'Mumbai Port')}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Voyage Management
  voyages: {
    getAll: async (params = {}) => {
      const res = await fetch(`${API_BASE}/voyages${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getById: async (voyageId) => {
      const res = await fetch(`${API_BASE}/voyages/${encodeURIComponent(voyageId)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    create: async (voyageData) => {
      const res = await fetch(`${API_BASE}/voyages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(voyageData)
      });
      return handleResponse(res);
    },
    updateEta: async (voyageId, etaData) => {
      const res = await fetch(`${API_BASE}/voyages/${encodeURIComponent(voyageId)}/eta`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(etaData)
      });
      return handleResponse(res);
    },
    updateTelemetry: async (voyageId, telemetryData) => {
      const res = await fetch(`${API_BASE}/voyages/${encodeURIComponent(voyageId)}/telemetry`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(telemetryData)
      });
      return handleResponse(res);
    },
    recordDelay: async (voyageId, delayData) => {
      const res = await fetch(`${API_BASE}/voyages/${encodeURIComponent(voyageId)}/delay`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(delayData)
      });
      return handleResponse(res);
    },
    coordinatePort: async (voyageId, coordData) => {
      const res = await fetch(`${API_BASE}/voyages/${encodeURIComponent(voyageId)}/coordinate-port`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(coordData)
      });
      return handleResponse(res);
    },
    updateStatus: async (voyageId, statusData) => {
      const res = await fetch(`${API_BASE}/voyages/${encodeURIComponent(voyageId)}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(statusData)
      });
      return handleResponse(res);
    },
    getPerformance: async (voyageId) => {
      const res = await fetch(`${API_BASE}/voyages/${encodeURIComponent(voyageId)}/performance`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // AI Assistant
  ai: {
    query: async (prompt) => {
      const res = await fetch(`${API_BASE}/ai/query`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt })
      });
      return handleResponse(res);
    }
  },

  // Reports
  reports: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/reports`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    generate: async (reportData) => {
      const res = await fetch(`${API_BASE}/reports/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reportData)
      });
      return handleResponse(res);
    },
    getHtmlExportUrl: (reportId) => `${API_BASE}/reports/${reportId}/export-html`,
    getCsvExportUrl: () => `${API_BASE}/reports/export/csv`
  },

  // AIS Live Map & Tracking
  tracking: {
    getLiveMap: async () => {
      const res = await fetch(`${API_BASE}/tracking/live-map`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    simulateStep: async () => {
      const res = await fetch(`${API_BASE}/tracking/simulate-step`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  // Analytics & Visualizations
  analytics: {
    getSummary: async (params = {}) => {
      const res = await fetch(`${API_BASE}/analytics/summary${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getAdmin: async (params = {}) => {
      const res = await fetch(`${API_BASE}/analytics/admin${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getPortManager: async (params = {}) => {
      const res = await fetch(`${API_BASE}/analytics/port-manager${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getShipManager: async (params = {}) => {
      const res = await fetch(`${API_BASE}/analytics/ship-manager${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getInspector: async (params = {}) => {
      const res = await fetch(`${API_BASE}/analytics/inspector${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getDrilldown: async (params = {}) => {
      const res = await fetch(`${API_BASE}/analytics/drilldown${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    logExport: async (data) => {
      const res = await fetch(`${API_BASE}/analytics/log-export`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },

  // Temperature & Reefer Monitoring
  temperature: {
    getOverview: async (params = {}) => {
      const res = await fetch(`${API_BASE}/temperature/overview${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getContainers: async (params = {}) => {
      const res = await fetch(`${API_BASE}/temperature/containers${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getContainerById: async (containerId) => {
      const res = await fetch(`${API_BASE}/temperature/containers/${encodeURIComponent(containerId)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    addReading: async (containerId, readingData) => {
      const res = await fetch(`${API_BASE}/temperature/containers/${encodeURIComponent(containerId)}/readings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(readingData)
      });
      return handleResponse(res);
    },
    simulateReading: async (containerId) => {
      const res = await fetch(`${API_BASE}/temperature/containers/${encodeURIComponent(containerId)}/simulate-reading`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    updateProfile: async (containerId, profileData) => {
      const res = await fetch(`${API_BASE}/temperature/containers/${encodeURIComponent(containerId)}/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      });
      return handleResponse(res);
    },
    placeHold: async (containerId, holdData) => {
      const res = await fetch(`${API_BASE}/temperature/containers/${encodeURIComponent(containerId)}/hold`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(holdData)
      });
      return handleResponse(res);
    },
    acknowledgeIncident: async (incidentId) => {
      const res = await fetch(`${API_BASE}/temperature/incidents/${encodeURIComponent(incidentId)}/acknowledge`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    resolveIncident: async (incidentId, resolveData) => {
      const res = await fetch(`${API_BASE}/temperature/incidents/${encodeURIComponent(incidentId)}/resolve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(resolveData)
      });
      return handleResponse(res);
    },
    submitInspection: async (containerId, inspectionData) => {
      const res = await fetch(`${API_BASE}/temperature/containers/${encodeURIComponent(containerId)}/inspection`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inspectionData)
      });
      return handleResponse(res);
    },
    getAnalytics: async (params = {}) => {
      const res = await fetch(`${API_BASE}/temperature/analytics${buildQueryString(params)}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },
    getCsvExportUrl: () => `${API_BASE}/temperature/export/csv`
  },

  // AI Maritime Assistant
  ai: {
    query: async (prompt) => {
      const res = await fetch(`${API_BASE}/ai/query`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt })
      });
      return handleResponse(res);
    }
  },

  // System Diagnostics
  system: {
    getHealth: async () => {
      const res = await fetch(`${API_BASE}/health`);
      return handleResponse(res);
    },
    reseed: async () => {
      const res = await fetch(`${API_BASE}/system/reseed`, {
        method: 'POST',
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  }
};
